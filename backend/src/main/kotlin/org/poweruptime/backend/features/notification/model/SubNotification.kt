package org.poweruptime.backend.features.notification.model

import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.dao.id.ULongIdTable
import org.jetbrains.exposed.v1.javatime.timestamp
import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.HasPublicId
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.nanoId
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import java.time.Instant

object SubNotification : ULongIdTable("sub_notification"), HasPublicId, HasModifiers {
    override val publicId = nanoId("public_id", NANO_ID_MAX_LENGTH)
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    val notificationId = ulong("notification_id").references(Notification.id).index()
    val methodId = ulong("notification_method_id").references(NotificationMethod.id).index()

    val title = varchar("title", Database.MAX_TITLE_LENGTH)
    val message = varchar("message", Database.MAX_MESSAGE_LENGTH).nullable()

    val pickedUpAt = timestamp("picked_up_at").nullable()
    val sentAt = timestamp("sent_at").nullable()

    val error = varchar("error", Database.MAX_MESSAGE_LENGTH).nullable()
}

data class SubNotificationRecord(
    val id: ULong,
    val publicId: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    val notificationId: ULong,
    val methodId: ULong,
    val title: String,
    val message: String?,
    val pickedUpAt: Instant?,
    val sentAt: Instant?,
    val error: String?,
)

fun SubNotification.rowToSubNotificationRecord(row: ResultRow): SubNotificationRecord = SubNotificationRecord(
    id = row[id].value,
    publicId = row[publicId],
    createdAt = row[createdAt],
    updatedAt = row[updatedAt],
    notificationId = row[notificationId],
    methodId = row[methodId],
    title = row[title],
    message = row[message],
    pickedUpAt = row[pickedUpAt],
    sentAt = row[sentAt],
    error = row[error],
)

open class SubNotificationJoinMethodRecord(
    open val subNotification: SubNotificationRecord,
    open val method: NotificationMethodRecord,
)

open class SubNotificationJoinMethodAndNotificationRecord(
    override val subNotification: SubNotificationRecord,
    override val method: NotificationMethodRecord,
    open val notification: NotificationRecord,
) : SubNotificationJoinMethodRecord(subNotification, method)

open class SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord(
    override val subNotification: SubNotificationRecord,
    override val method: NotificationMethodRecord,
    override val notification: NotificationRecord,
    val checkResult: CheckResultRecord,
    val monitor: MonitorRecord,
) : SubNotificationJoinMethodAndNotificationRecord(subNotification, method, notification)
