package org.poweruptime.backend.features.authentication.service

import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.CriteriaQuery
import jakarta.persistence.criteria.Root
import jakarta.transaction.Transactional
import org.poweruptime.backend.core.Filter
import org.poweruptime.backend.core.FilterCompare
import org.poweruptime.backend.core.dto.PageableValidator
import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.core.toPredicate
import org.poweruptime.backend.features.authentication.SessionInformationMissingException
import org.poweruptime.backend.features.authentication.SessionTokenIncorrectException
import org.poweruptime.backend.features.authentication.domain.RefreshTokenRepository
import org.poweruptime.backend.features.authentication.domain.SessionRepository
import org.poweruptime.backend.features.authentication.model.RefreshToken
import org.poweruptime.backend.features.authentication.model.Session
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.model.User
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.security.core.Authentication
import org.springframework.security.core.GrantedAuthority
import org.springframework.stereotype.Service
import java.time.Instant
import kotlin.jvm.Throws

@Service
class SessionService(
    val sessionRepository: SessionRepository,
    val refreshTokenRepository: RefreshTokenRepository,
    val refreshTokenGenerationService: RefreshTokenGenerationService
) : AEntityService<Session>(sessionRepository) {
    fun generateNewRefreshToken(authentication: Authentication) =
        generateNewRefreshToken(authentication.name, authentication.authorities)

    fun generateNewRefreshToken(userId: String, authorities: Collection<GrantedAuthority>): String {
        var refreshToken = refreshTokenGenerationService.createToken(userId, authorities)
        while (sessionRepository.existsByToken(refreshToken)) {
            refreshToken = refreshTokenGenerationService.createToken(userId, authorities)
        }
        return refreshToken
    }

    fun existsBySessionAndUserId(sessionId: String, userId: String) =
        sessionRepository.existsBySessionAndUserId(sessionId, userId)

    @Transactional
    @Throws(SessionTokenIncorrectException::class)
    @Suppress("ThrowsCount")
    fun refreshSession(
        token: String,
        description: String
    ): RefreshToken {
        val session = sessionRepository.findByToken(token).firstOrNull() ?: throw SessionTokenIncorrectException()
        val refreshToken = refreshTokenRepository.findByToken(token) ?: throw SessionTokenIncorrectException()

        // If refresh token was already used once, it can't be reused again
        // The whole session will be deactivated because it may be malicious
        if (!refreshToken.valid) {
            sessionRepository.invalidateSession(session.id)
            throw SessionTokenIncorrectException()
        }

        if (!session.valid) {
            throw SessionTokenIncorrectException()
        }

        // Update session to mark as active
        session.let {
            it.description = description
            it.touch()
            save(it)
        }

        // invalidate all previous tokens for this session
        refreshTokenRepository.invalidateAllTokensForSession(session.id)

        return createRefreshToken(
            token = generateNewRefreshToken(
                userId = session.user.id,
                authorities = session.user.role.grantedAuthorities,
            ),
            session = session,
        )
    }

    fun invalidateSessionByRefreshToken(refreshToken: String) = getByTokenOrThrow(refreshToken).run {
        sessionRepository.invalidateSession(id)
        refreshTokenRepository.invalidateAllTokensForSession(id)
    }

    fun invalidateSessionById(sessionId: String) = getByIdOrThrow(sessionId).run {
        sessionRepository.invalidateSession(id)
        refreshTokenRepository.invalidateAllTokensForSession(id)
    }

    fun invalidateSessionsByUserId(userId: String) = sessionRepository.findByUserId(userId).map {
        it.id
    }.run {
        sessionRepository.invalidateSessions(this)
        refreshTokenRepository.invalidateAllTokensForSessions(this)
    }

    fun clearSessionsOlderThan(past: Instant) = sessionRepository.findByUpdatedDateTimeBefore(past).apply {
        deleteAll(this)
    }

    @Throws(SessionTokenIncorrectException::class)
    fun getByTokenOrThrow(token: String) = sessionRepository.findByToken(token).firstOrNull()
        ?: throw SessionTokenIncorrectException()

    private fun makeSession(description: String, entity: User) = Session(
        description = description,
        user = entity,
    )

    private fun createRefreshToken(token: String, session: Session) = refreshTokenRepository.save(
        RefreshToken(
            token = token,
            session = session,
        ),
    )

    fun createSessionForOAuth2(
        user: User,
        sessionInformation: String,
    ): RefreshToken {
        val session = save(
            makeSession(
                description = sessionInformation,
                entity = user,
            ),
        )

        return createRefreshToken(
            token = generateNewRefreshToken(user.id, SystemRole.USER.grantedAuthorities),
            session = session,
        )
    }

    @Throws(SessionTokenIncorrectException::class)
    fun createSessionIfNeeded(
        stayLoggedIn: Boolean?,
        sessionInformation: String?,
        user: User
    ): RefreshToken? {
        if (stayLoggedIn != true) {
            return null
        }

        if (sessionInformation.isNullOrBlank()) {
            throw SessionInformationMissingException()
        }

        val session = save(
            makeSession(
                description = sessionInformation,
                entity = user,
            ),
        )

        return createRefreshToken(
            token = generateNewRefreshToken(user.id, user.role.grantedAuthorities),
            session = session,
        )
    }

    fun getAllPaginated(
        pageable: Pageable,
        userId: String,
        valid: Boolean = true
    ): Page<Session> = sessionRepository.findAll(
        { root: Root<Session>, _: CriteriaQuery<*>?, criteriaBuilder: CriteriaBuilder ->
            criteriaBuilder.and(
                *buildList {
                    add(Filter("user.id", userId, FilterCompare.EQ))
                    add(Filter("valid", valid, FilterCompare.EQ))
                }.toPredicate(root, criteriaBuilder).toTypedArray(),
            )
        },
        PageableValidator.validateSort(
            pageable,
            listOf("updatedAt", "createdAt"),
        ),
    )
}
