package org.poweruptime.backend.features.authentication.domain

import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.lessEq
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.Page
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.features.authentication.model.RefreshToken
import org.poweruptime.backend.features.authentication.model.Session
import org.poweruptime.backend.features.authentication.model.SessionJoinUserRecord
import org.poweruptime.backend.features.authentication.model.SessionRecord
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.authentication.model.rowToSessionRecord
import org.poweruptime.backend.features.authentication.model.rowToUserRecord
import java.time.Instant

fun Session.findByRefreshToken(refreshToken: String): SessionRecord? = innerJoin(RefreshToken)
    .selectAll()
    .where {
        RefreshToken.token eq refreshToken
    }.firstOrNull()
    ?.let {
        rowToSessionRecord(it)
    }

fun Session.findJoinUserByRefreshToken(refreshToken: String): SessionJoinUserRecord? = innerJoin(RefreshToken)
    .innerJoin(User)
    .selectAll()
    .where {
        RefreshToken.token eq refreshToken
    }.firstOrNull()
    ?.let {
        SessionJoinUserRecord(
            session = rowToSessionRecord(it),
            user = User.rowToUserRecord(it),
        )
    }

fun Session.findAllByUserId(userId: ULong): List<SessionRecord> = selectAll().where { Session.userId eq userId }.map {
    rowToSessionRecord(it)
}

fun Session.findAll(pageable: Pageable, userId: ULong, valid: Boolean = true): Page<SessionRecord> {
    val query = selectAll().where {
        (Session.userId eq userId) and (Session.valid eq valid)
    }

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "createdAt" -> Session.createdAt

                "updatedAt" -> Session.createdAt

                else -> throw BadRequestException(
                    """Sort parameter "$it" not found""",
                )
            }
        },
        map = {
            rowToSessionRecord(it)
        },
    )
}

fun Session.deleteAllUpdatedAtBefore(updatedAt: Instant): Int = deleteWhere {
    Session.updatedAt lessEq updatedAt
}

fun Session.deleteByPublicId(publicId: String): Int = deleteWhere {
    Session.publicId eq publicId
}

fun Session.existsByRefreshToken(refreshToken: String): Boolean = innerJoin(RefreshToken)
    .selectAll()
    .where {
        RefreshToken.token eq refreshToken
    }.limit(1)
    .count() > 0

fun Session.existsByPublicSessionAndUserId(publicSessionId: String, userId: ULong): Boolean = selectAll()
    .where {
        Session.publicId eq publicSessionId
        Session.userId eq userId
    }.limit(1)
    .count() > 0

fun Session.invalidateSession(sessionId: ULong) = update({ Session.id eq sessionId }) {
    it[valid] = false
}

fun Session.invalidateSessions(sessionIds: List<ULong>) = update({ id inList sessionIds }) {
    it[valid] = false
}
