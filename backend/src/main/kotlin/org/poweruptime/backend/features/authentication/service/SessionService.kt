package org.poweruptime.backend.features.authentication.service

import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.findByIdOrThrow
import org.poweruptime.backend.core.domain.findIdByPublicIdOrThrow
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
import org.poweruptime.backend.features.authentication.model.RefreshTokenRecord
import org.poweruptime.backend.features.authentication.model.RefreshTokenTable
import org.poweruptime.backend.features.authentication.model.SessionRecord
import org.poweruptime.backend.features.authentication.model.SessionTable
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.authentication.model.rowToRefreshTokenRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
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
        SessionTable.existsByPublicSessionAndUserId(sessionId, userId)

    fun getAllPaginated(
        pageable: Pageable,
        userId: ULong,
        valid: Boolean = true
    ): Page<SessionRecord> = SessionTable.findAll(
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
        val refreshToken = RefreshTokenTable.findByToken(token) ?: throw SessionTokenIncorrectException()

        // If refresh token was already used once, it can't be reused again
        // The whole session will be deactivated because it may be malicious
        if (!refreshToken.valid) {
            SessionTable.invalidateSession(session.id)
            throw SessionTokenIncorrectException()
        }

        if (!session.valid) {
            throw SessionTokenIncorrectException()
        }

        // Update session to mark as active
        SessionTable.update({ SessionTable.id eq session.id }) {
            it[SessionTable.description] = description
        }

        // invalidate all previous tokens for this session
        RefreshTokenTable.invalidateAllTokensBySessionId(session.id)

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
        SessionTable.invalidateSession(id)
        RefreshTokenTable.invalidateAllTokensBySessionId(id)
    }

    @Transactional
    fun invalidateSessionByPublicId(publicSessionId: String): Unit = SessionTable.findIdByPublicIdOrThrow(
        publicSessionId,
    ).let { id ->
        SessionTable.invalidateSession(id)
        RefreshTokenTable.invalidateAllTokensBySessionId(id)
    }

    @Transactional
    fun invalidateSessionsByUserId(userId: ULong): Unit = SessionTable.findAllByUserId(userId).map {
        it.id
    }.let { id ->
        SessionTable.invalidateSessions(id)
        RefreshTokenTable.invalidateAllTokensBySessionIds(id)
    }

    @Transactional
    fun clearSessionsOlderThan(past: Instant): Int = SessionTable.deleteAllUpdatedAtBefore(past)

    @Transactional
    fun deleteByPublicId(publicSessionId: String) = SessionTable.deleteByPublicId(publicSessionId)

    @Throws(SessionTokenIncorrectException::class)
    fun getByTokenOrThrow(
        refreshToken: String
    ) = SessionTable.findByRefreshToken(refreshToken) ?: throw SessionTokenIncorrectException()

    @Throws(SessionTokenIncorrectException::class)
    fun getJoinUserByTokenOrThrow(
        refreshToken: String
    ) = SessionTable.findJoinUserByRefreshToken(refreshToken) ?: throw SessionTokenIncorrectException()

    private fun createRefreshToken(
        token: String,
        sessionId: ULong
    ): RefreshTokenRecord = RefreshTokenTable.insertAndGetId {
        it[RefreshTokenTable.sessionId] = sessionId
        it[RefreshTokenTable.token] = token
    }.let { id ->
        RefreshTokenTable.findByIdOrThrow(id.value) {
            RefreshTokenTable.rowToRefreshTokenRecord(it)
        }
    }

    fun createSessionForOAuth2(
        user: UserRecord,
        sessionInformation: String,
    ): RefreshTokenRecord {
        val sessionId = SessionTable.insertAndGetId {
            it[SessionTable.userId] = user.id
            it[SessionTable.description] = sessionInformation
        }.value

        return createRefreshToken(
            token = generateNewRefreshToken(user.publicId, SystemRole.USER.grantedAuthorities),
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

        val sessionId = SessionTable.insertAndGetId {
            it[SessionTable.userId] = user.id
            it[SessionTable.description] = sessionInformation
        }.value

        return createRefreshToken(
            token = generateNewRefreshToken(user.publicId, user.role.grantedAuthorities),
            sessionId = sessionId,
        )
    }

    private fun generateNewRefreshToken(publicUserId: String, authorities: Collection<GrantedAuthority>): String {
        var refreshToken = refreshTokenGenerationService.createToken(publicUserId, authorities)
        while (SessionTable.existsByRefreshToken(refreshToken)) {
            refreshToken = refreshTokenGenerationService.createToken(publicUserId, authorities)
        }
        return refreshToken
    }
}
