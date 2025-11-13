package org.poweruptime.backend.features.notification.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.HasPublicId
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.nanoId
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_DEFAULT_LENGTH
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.CheckResultTable
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.team.model.TeamRecord
import java.time.Instant

object NotificationTable : ULongIdTable("notification"), HasPublicId, HasModifiers {
    override val publicId = nanoId("public_id", NANO_ID_DEFAULT_LENGTH)
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    val checkResultId = ulong("check_result_id").references(CheckResultTable.id).index().uniqueIndex()

    val title = varchar("title", Database.MAX_TITLE_LENGTH)
}

data class NotificationRecord(
    val id: ULong,
    val publicId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val checkResultId: ULong,
    var title: String,
)

fun NotificationTable.rowToNotificationRecord(row: ResultRow): NotificationRecord =
    NotificationRecord(
        id = row[id].value,
        publicId = row[publicId],
        createdAt = row[createdAt],
        updatedAt = row[updatedAt],
        checkResultId = row[checkResultId],
        title = row[title],
    )

data class NotificationJoinCheckResultMonitorAndTeamRecord(
    val notification: NotificationRecord,
    val checkResult: CheckResultRecord,
    val monitor: MonitorRecord,
    val team: TeamRecord,
)
