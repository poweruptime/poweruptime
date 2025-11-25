package org.poweruptime.backend.features.monitor.domain

import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.features.monitor.checkers.push.PushMonitorCheckerEntry
import org.poweruptime.backend.features.monitor.checkers.push.PushMonitorCheckerEntryRecord
import org.poweruptime.backend.features.monitor.checkers.push.rowToPushMonitorCheckerEntryRecord
import java.time.Instant

interface IPushMonitorCheckerEntryRepository {
    fun getLatestByPushIdAndBetweenNowAndThen(
        pushId: String,
        then: Instant
    ): PushMonitorCheckerEntryRecord?
}

class PushMonitorCheckerEntryRepository : IPushMonitorCheckerEntryRepository {
    override fun getLatestByPushIdAndBetweenNowAndThen(
        pushId: String,
        then: Instant
    ): PushMonitorCheckerEntryRecord? =
        PushMonitorCheckerEntry.selectAll().where {
            (PushMonitorCheckerEntry.publicId eq pushId) and
                (PushMonitorCheckerEntry.createdAt greaterEq then)
        }
            .orderBy(PushMonitorCheckerEntry.createdAt, SortOrder.DESC)
            .limit(1)
            .firstOrNull()
            ?.let {
                PushMonitorCheckerEntry.rowToPushMonitorCheckerEntryRecord(it)
            }
}
