package org.poweruptime.backend.features.authentication.domain

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.features.authentication.model.RefreshTokenRecord
import org.poweruptime.backend.features.authentication.model.RefreshTokenTable
import org.poweruptime.backend.features.authentication.model.rowToRefreshTokenRecord

fun RefreshTokenTable.findByToken(token: String): RefreshTokenRecord? =
    selectAll().where { RefreshTokenTable.token eq token }.limit(1).firstOrNull()?.let {
        RefreshTokenTable.rowToRefreshTokenRecord(it)
    }

fun RefreshTokenTable.invalidateAllTokensBySessionId(sessionId: ULong) =
    update({ RefreshTokenTable.sessionId eq sessionId }) {
        it[valid] = false
    }

fun RefreshTokenTable.invalidateAllTokensBySessionIds(sessionIds: List<ULong>) =
    update({ RefreshTokenTable.sessionId inList sessionIds }) {
        it[valid] = false
    }
