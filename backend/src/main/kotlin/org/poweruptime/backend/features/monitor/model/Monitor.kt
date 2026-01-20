package org.poweruptime.backend.features.monitor.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.HasName
import org.poweruptime.backend.core.models.HasPublicId
import org.poweruptime.backend.core.models.HasSoftDelete
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.enumerationByCode
import org.poweruptime.backend.core.models.name
import org.poweruptime.backend.core.models.nanoId
import org.poweruptime.backend.core.models.softDelete
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.features.monitor.core.MonitorData
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.model.TeamRecord
import java.time.Instant

object Monitor : ULongIdTable("monitor"), HasPublicId, HasModifiers, HasSoftDelete, HasName {
    override val publicId = nanoId("public_id", NANO_ID_SMALL_LENGTH)
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()
    override val deleted = softDelete()
    override val name = name()

    val teamId = ulong("team_id").references(Team.id).index()

    val type = enumerationByCode<MonitorType>("type")

    val testIntervalSeconds = long("test_interval_seconds")
    val upsideDown = bool("upside_down")
    val retries = long("retries").nullable()
    val resendAfter = long("resend_after").nullable()
    val description = text("description").nullable()

    val status = enumerationByCode<MonitorStatus>("status").clientDefault {
        MonitorStatus.PENDING
    }
}

data class MonitorRecord(
    val id: ULong,
    val publicId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val deleted: Instant?,
    val name: String,
    val teamId: ULong,
    val type: MonitorType,
    val testIntervalSeconds: Long,
    val upsideDown: Boolean,
    val retries: Long?,
    val resendAfter: Long?,
    val description: String?,
    var status: MonitorStatus,
)

fun Monitor.rowToMonitorRecord(row: ResultRow): MonitorRecord = MonitorRecord(
    id = row[id].value,
    publicId = row[publicId],
    createdAt = row[createdAt],
    updatedAt = row[updatedAt],
    deleted = row[deleted],
    name = row[name],
    teamId = row[teamId],
    type = row[type],
    testIntervalSeconds = row[testIntervalSeconds],
    upsideDown = row[upsideDown],
    retries = row[retries],
    resendAfter = row[resendAfter],
    description = row[description],
    status = row[status],
)

open class MonitorRecordJoinTeamRecord(open val monitor: MonitorRecord, open val team: TeamRecord)

data class MonitorRecordWithDataJoinTeamRecord(
    override val monitor: MonitorRecord,
    override val team: TeamRecord,
    val data: MonitorData,
) : MonitorRecordJoinTeamRecord(monitor, team)
