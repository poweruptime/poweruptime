package org.poweruptime.backend.features.authentication.service

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.Page
import org.poweruptime.backend.core.domain.findByIdOrThrow
import org.poweruptime.backend.core.domain.findIdByPublicIdOrThrow
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.features.authentication.SessionInformationMissingException
import org.poweruptime.backend.features.authentication.SessionTokenIncorrectException
import org.poweruptime.backend.features.authentication.domain.deleteAllUpdatedAtBefore
import org.poweruptime.backend.features.authentication.domain.deleteByPublicId
import org.poweruptime.backend.features.authentication.domain.existsByPublicSessionAndUserId
import org.poweruptime.backend.features.authentication.domain.existsByRefreshToken
import org.poweruptime.backend.features.authentication.domain.findAll
import org.poweruptime.backend.features.authentication.domain.findAllByUserId
import org.poweruptime.backend.features.authentication.domain.findByRefreshToken
import org.poweruptime.backend.features.authentication.domain.findByToken
import org.poweruptime.backend.features.authentication.domain.findJoinUserByRefreshToken
import org.poweruptime.backend.features.authentication.domain.invalidateAllTokensBySessionId
import org.poweruptime.backend.features.authentication.domain.invalidateAllTokensBySessionIds
import org.poweruptime.backend.features.authentication.domain.invalidateSession
import org.poweruptime.backend.features.authentication.domain.invalidateSessions
import org.poweruptime.backend.features.authentication.model.RefreshToken
import org.poweruptime.backend.features.authentication.model.RefreshTokenRecord
import org.poweruptime.backend.features.authentication.model.Session
import org.poweruptime.backend.features.authentication.model.SessionRecord
import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.authentication.model.rowToRefreshTokenRecord
import org.springframework.security.core.GrantedAuthority
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import kotlin.jvm.Throws

@Service
@Transactional(readOnly = true)
class SessionService(
    val refreshTokenGenerationService: RefreshTokenGenerationService
) {
    fun existsByPublicSessionAndUserId(sessionId: String, userId: ULong) =
        Session.existsByPublicSessionAndUserId(sessionId, userId)

    fun getAllPaginated(
        pageable: Pageable,
        userId: ULong,
        valid: Boolean = true
    ): Page<SessionRecord> = Session.findAll(
        pageable = pageable,
        userId = userId,
        valid = valid,
    )

    @Transactional
    @Throws(SessionTokenIncorrectException::class)
    @Suppress("ThrowsCount")
    fun refreshSession(
        token: String,
        description: String
    ): RefreshTokenRecord {
        val (session, user) = getJoinUserByTokenOrThrow(token)
        val refreshToken = RefreshToken.findByToken(token) ?: throw SessionTokenIncorrectException()

        // If refresh token was already used once, it can't be reused again
        // The whole session will be deactivated because it may be malicious
        if (!refreshToken.valid) {
            Session.invalidateSession(session.id)
            throw SessionTokenIncorrectException()
        }

        if (!session.valid) {
            throw SessionTokenIncorrectException()
        }

        // Update session to mark as active
        Session.update({ Session.id eq session.id }) {
            it[Session.description] = description
        }

        // invalidate all previous tokens for this session
        RefreshToken.invalidateAllTokensBySessionId(session.id)

        return createRefreshToken(
            token = generateNewRefreshToken(
                publicUserId = user.publicId,
                authorities = user.role.grantedAuthorities,
            ),
            sessionId = session.id,
        )
    }

    @Transactional
    fun invalidateSessionByRefreshToken(refreshToken: String) = getByTokenOrThrow(refreshToken).run {
        Session.invalidateSession(id)
        RefreshToken.invalidateAllTokensBySessionId(id)
    }

    @Transactional
    fun invalidateSessionByPublicId(publicSessionId: String): Unit = Session.findIdByPublicIdOrThrow(
        publicSessionId,
    ).let { id ->
        Session.invalidateSession(id)
        RefreshToken.invalidateAllTokensBySessionId(id)
    }

    @Transactional
    fun invalidateSessionsByUserId(userId: ULong): Unit = Session.findAllByUserId(userId).map {
        it.id
    }.let { id ->
        Session.invalidateSessions(id)
        RefreshToken.invalidateAllTokensBySessionIds(id)
    }

    @Transactional
    fun clearSessionsOlderThan(past: Instant): Int = Session.deleteAllUpdatedAtBefore(past)

    @Transactional
    fun deleteByPublicId(publicSessionId: String) = Session.deleteByPublicId(publicSessionId)

    @Throws(SessionTokenIncorrectException::class)
    fun getByTokenOrThrow(
        refreshToken: String
    ) = Session.findByRefreshToken(refreshToken) ?: throw SessionTokenIncorrectException()

    @Throws(SessionTokenIncorrectException::class)
    fun getJoinUserByTokenOrThrow(
        refreshToken: String
    ) = Session.findJoinUserByRefreshToken(refreshToken) ?: throw SessionTokenIncorrectException()

    private fun createRefreshToken(
        token: String,
        sessionId: ULong
    ): RefreshTokenRecord = RefreshToken.insertAndGetId {
        it[RefreshToken.sessionId] = sessionId
        it[RefreshToken.token] = token
    }.let { id ->
        RefreshToken.findByIdOrThrow(id.value) {
            RefreshToken.rowToRefreshTokenRecord(it)
        }
    }

    fun createSessionForOAuth2(
        user: UserRecord,
        sessionInformation: String,
    ): RefreshTokenRecord {
        val sessionId = Session.insertAndGetId {
            it[Session.userId] = user.id
            it[Session.description] = sessionInformation
        }.value

        return createRefreshToken(
            token = generateNewRefreshToken(user.publicId, user.role.grantedAuthorities),
            sessionId = sessionId,
        )
    }

    @Throws(SessionTokenIncorrectException::class)
    @Transactional
    fun createSessionIfNeeded(
        stayLoggedIn: Boolean?,
        sessionInformation: String?,
        user: UserRecord
    ): RefreshTokenRecord? {
        if (stayLoggedIn != true) {
            return null
        }

        if (sessionInformation.isNullOrBlank()) {
            throw SessionInformationMissingException()
        }

        val sessionId = Session.insertAndGetId {
            it[Session.userId] = user.id
            it[Session.description] = sessionInformation
        }.value

        return createRefreshToken(
            token = generateNewRefreshToken(user.publicId, user.role.grantedAuthorities),
            sessionId = sessionId,
        )
    }

    private fun generateNewRefreshToken(publicUserId: String, authorities: Collection<GrantedAuthority>): String {
        var refreshToken = refreshTokenGenerationService.createToken(publicUserId, authorities)
        while (Session.existsByRefreshToken(refreshToken)) {
            refreshToken = refreshTokenGenerationService.createToken(publicUserId, authorities)
        }
        return refreshToken
    }
}
