package org.poweruptime.backend.features.monitor.domain

import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.greaterEq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorCheckerEntryRecord
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorCheckerEntryTable
import org.poweruptime.backend.features.monitor.checker.push.rowToPushMonitorCheckerEntryRecord
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
        PushMonitorCheckerEntryTable.selectAll().where {
            (PushMonitorCheckerEntryTable.publicId eq pushId) and
                (PushMonitorCheckerEntryTable.createdAt greaterEq then)
        }
            .orderBy(PushMonitorCheckerEntryTable.createdAt, SortOrder.DESC)
            .limit(1)
            .firstOrNull()
            ?.let {
                PushMonitorCheckerEntryTable.rowToPushMonitorCheckerEntryRecord(it)
            }
}
