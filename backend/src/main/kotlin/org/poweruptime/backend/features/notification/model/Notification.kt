package org.poweruptime.backend.features.notification.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.HasPublicId
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.enumerationByCode
import org.poweruptime.backend.core.models.nanoId
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_DEFAULT_LENGTH
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.features.maintenance.model.Maintenance
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.team.model.TeamRecord
import java.time.Instant

object Notification : ULongIdTable("notification"), HasPublicId, HasModifiers {
    override val publicId = nanoId("public_id", NANO_ID_DEFAULT_LENGTH)
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    val checkResultId = ulong("check_result_id").references(CheckResult.id).index().uniqueIndex()
    val monitorId = ulong("monitor_id").references(Monitor.id).index()
    val maintenanceId = ulong("maintenance_id").references(Maintenance.id).nullable().index()
    val publicCheckResultId = varchar("public_check_result_id", NANO_ID_MAX_LENGTH)

    val status = enumerationByCode<MonitorStatus>("status")
    val title = varchar("title", Database.MAX_TITLE_LENGTH)
}

data class NotificationRecord(
    val id: ULong,
    val publicId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val monitorId: ULong,
    val maintenanceId: ULong?,
    val checkResultId: ULong,
    val publicCheckResultId: String,
    var title: String,
    val status: MonitorStatus,
)

fun Notification.rowToNotificationRecord(row: ResultRow): NotificationRecord = NotificationRecord(
    id = row[id].value,
    publicId = row[publicId],
    createdAt = row[createdAt],
    updatedAt = row[updatedAt],
    monitorId = row[monitorId],
    maintenanceId = row[maintenanceId],
    checkResultId = row[checkResultId],
    publicCheckResultId = row[publicCheckResultId],
    title = row[title],
    status = row[status],
)

data class NotificationJoinMonitorAndTeamRecord(
    val notification: NotificationRecord,
    val monitor: MonitorRecord,
    val team: TeamRecord,
)
