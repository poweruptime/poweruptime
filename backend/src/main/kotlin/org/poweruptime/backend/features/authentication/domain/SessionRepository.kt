package org.poweruptime.backend.features.authentication.domain

import org.jetbrains.exposed.v1.core.SqlExpressionBuilder.lessEq
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.statements.UpsertSqlExpressionBuilder.eq
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.features.authentication.model.RefreshTokenTable
import org.poweruptime.backend.features.authentication.model.SessionJoinUserRecord
import org.poweruptime.backend.features.authentication.model.SessionRecord
import org.poweruptime.backend.features.authentication.model.SessionTable
import org.poweruptime.backend.features.authentication.model.UserTable
import org.poweruptime.backend.features.authentication.model.rowToSessionRecord
import org.poweruptime.backend.features.authentication.model.rowToUserRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.time.Instant

fun SessionTable.findByRefreshToken(refreshToken: String): SessionRecord? =
    innerJoin(RefreshTokenTable).selectAll().where {
        RefreshTokenTable.token eq refreshToken
    }.firstOrNull()?.let {
        rowToSessionRecord(it)
    }

fun SessionTable.findJoinUserByRefreshToken(refreshToken: String): SessionJoinUserRecord? =
    innerJoin(RefreshTokenTable).innerJoin(UserTable).selectAll().where {
        RefreshTokenTable.token eq refreshToken
    }.firstOrNull()?.let {
        SessionJoinUserRecord(
            session = rowToSessionRecord(it),
            user = UserTable.rowToUserRecord(it),
        )
    }

fun SessionTable.findAllByUserId(
    userId: ULong
): List<SessionRecord> = selectAll().where { SessionTable.userId eq userId }.map {
    rowToSessionRecord(it)
}

fun SessionTable.findAll(
    pageable: Pageable,
    userId: ULong,
    valid: Boolean = true
): Page<SessionRecord> {
    val query = selectAll().where {
        (SessionTable.userId eq userId) and (SessionTable.valid eq valid)
    }

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "createdAt" -> SessionTable.createdAt
                "updatedAt" -> SessionTable.createdAt
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

fun SessionTable.deleteAllUpdatedAtBefore(
    updatedAt: Instant
): Int = deleteWhere {
    SessionTable.updatedAt lessEq updatedAt
}

fun SessionTable.deleteByPublicId(
    publicId: String
): Int = deleteWhere {
    SessionTable.publicId eq publicId
}

fun SessionTable.existsByRefreshToken(refreshToken: String): Boolean =
    innerJoin(RefreshTokenTable).selectAll().where {
        RefreshTokenTable.token eq refreshToken
    }.count() > 0

fun SessionTable.existsByPublicSessionAndUserId(
    publicSessionId: String,
    userId: ULong
): Boolean =
    selectAll().where {
        SessionTable.publicId eq publicSessionId
        SessionTable.userId eq userId
    }.count() > 0

fun SessionTable.invalidateSession(
    sessionId: ULong
) = update({ SessionTable.id eq sessionId }) {
    it[SessionTable.valid] = false
}

fun SessionTable.invalidateSessions(
    sessionIds: List<ULong>
) = update({ SessionTable.id inList sessionIds }) {
    it[SessionTable.valid] = false
}
