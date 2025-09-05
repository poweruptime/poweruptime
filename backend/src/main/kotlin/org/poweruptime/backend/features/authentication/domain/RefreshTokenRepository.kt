package org.poweruptime.backend.features.authentication.domain

import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.features.authentication.model.RefreshTokenRecord
import org.poweruptime.backend.features.authentication.model.RefreshTokenTable
import org.poweruptime.backend.features.authentication.model.rowToRefreshTokenRecord

fun RefreshTokenTable.findByToken(token: String): RefreshTokenRecord? =
    RefreshTokenTable.selectAll().where { RefreshTokenTable.token eq token }.firstOrNull()?.let {
        RefreshTokenTable.rowToRefreshTokenRecord(it)
    }

fun RefreshTokenTable.invalidateAllTokensBySessionId(sessionId: ULong) =
    RefreshTokenTable.update({ RefreshTokenTable.sessionId eq sessionId }) {
        it[valid] = false
    }

fun RefreshTokenTable.invalidateAllTokensBySessionIds(sessionIds: List<ULong>) =
    RefreshTokenTable.update({ RefreshTokenTable.sessionId inList sessionIds }) {
        it[valid] = false
    }
