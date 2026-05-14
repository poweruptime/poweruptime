package org.poweruptime.backend.features.authentication.service

import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.features.authentication.model.UserRecord
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

data class OAuthLoginSession(val user: UserRecord, val issuer: String, val createdAt: Instant = Instant.now())

const val MAX_AGE_SECONDS = 180L
const val MAX_SESSIONS_PER_USER = 5

@Service
class OAuthLoginFlowService {
    private val loginSessions = ConcurrentHashMap<String, OAuthLoginSession>()

    fun addSession(session: OAuthLoginSession): String {
        val code = RandomGenerator.nanoId()
        loginSessions[code] = session

        val userSessions = loginSessions.entries
            .filter { it.value.user.id == session.user.id }
            .sortedByDescending { it.value.createdAt }

        userSessions
            .drop(MAX_SESSIONS_PER_USER)
            .forEach { loginSessions.remove(it.key) }

        return code
    }

    /**
     * Consumes the session for this code.
     *
     * Returns null when:
     * - the code does not exist
     * - the session has expired
     */
    fun getSession(code: String, maxAgeSeconds: Long = MAX_AGE_SECONDS): OAuthLoginSession? {
        val session = loginSessions.remove(code) ?: return null

        val expiresAt = session.createdAt.plusSeconds(maxAgeSeconds)
        if (Instant.now().isAfter(expiresAt)) {
            return null
        }

        return session
    }

    fun cleanupExpiredSessions(maxAgeSeconds: Long = MAX_AGE_SECONDS) {
        val cutoff = Instant.now().minusSeconds(maxAgeSeconds)

        loginSessions.entries.removeIf { (_, session) ->
            session.createdAt.isBefore(cutoff)
        }
    }
}
