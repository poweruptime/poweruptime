package org.poweruptime.backend.features.notification.service

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.batchInsert
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.Page
import org.poweruptime.backend.core.domain.deleteById
import org.poweruptime.backend.core.domain.findByIdOrThrow
import org.poweruptime.backend.core.domain.findByPublicId
import org.poweruptime.backend.core.domain.findByPublicIdOrThrow
import org.poweruptime.backend.core.domain.findIdByPublicIdOrThrow
import org.poweruptime.backend.core.domain.findIdsByPublicIdsOrThrow
import org.poweruptime.backend.core.domain.undeleteById
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.core.utils.NANO_ID_DEFAULT_LENGTH
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.features.authentication.domain.ensureAllInTeam
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.poweruptime.backend.features.monitor.service.MonitorService
import org.poweruptime.backend.features.notification.AppriseSender
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.domain.findAll
import org.poweruptime.backend.features.notification.domain.findByMonitorId
import org.poweruptime.backend.features.notification.dto.CreateNotificationMethodDto
import org.poweruptime.backend.features.notification.dto.UpdateNotificationMethodDto
import org.poweruptime.backend.features.notification.model.MonitorNotificationMethod
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.poweruptime.backend.features.notification.model.NotificationMethodRecord
import org.poweruptime.backend.features.notification.model.NotificationMethodWithDataRecord
import org.poweruptime.backend.features.notification.model.NotificationRecord
import org.poweruptime.backend.features.notification.model.SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord
import org.poweruptime.backend.features.notification.model.SubNotificationRecord
import org.poweruptime.backend.features.notification.model.rowToNotificationMethodRecord
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.model.TeamRecord
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.MessageDigest
import java.time.Instant

@Service
@Transactional(readOnly = true)
class NotificationMethodService(
    private val notificationMethodDataService: NotificationMethodDataService,
    private val monitorService: MonitorService,
    private val appriseSender: AppriseSender,
) {
    fun getIdByPublicId(publicId: String, includeDeleted: Boolean = false): ULong =
        NotificationMethod.findIdByPublicIdOrThrow(publicId, includeDeleted)
    fun getIdsByPublicIds(publicIds: List<String>): List<ULong> = NotificationMethod.findIdsByPublicIdsOrThrow(
        publicIds,
    )

    fun getById(id: ULong): NotificationMethodRecord = NotificationMethod.findByIdOrThrow(id) {
        NotificationMethod.rowToNotificationMethodRecord(it)
    }
    fun getByPublicId(publicIds: List<String>): List<NotificationMethodRecord> = NotificationMethod.findByPublicId(
        publicIds,
    ) {
        NotificationMethod.rowToNotificationMethodRecord(it)
    }

    fun getByMonitorId(monitorId: ULong): List<NotificationMethodRecord> =
        NotificationMethod.findByMonitorId(monitorId)

    fun getAllPaginated(
        pageable: Pageable,
        teamId: ULong,
        name: String?,
        types: List<NotificationMethodType>?,
        useByDefault: Boolean?,
        deleted: Boolean = false,
    ): Page<NotificationMethodRecord> = NotificationMethod.findAll(
        pageable = pageable,
        teamId = teamId,
        name = name,
        types = types,
        useByDefault = useByDefault,
        deleted = deleted,
    )

    @Transactional
    fun create(dto: CreateNotificationMethodDto): NotificationMethodWithDataRecord {
        val teamId = Team.findIdByPublicIdOrThrow(dto.teamId)

        val monitorIds = monitorService.getByPublicId(dto.monitorIds)
            .ensureAllInTeam(teamId) { monitor -> monitor.teamId }
            .map { monitor -> monitor.id }

        return NotificationMethod.insertAndGetId {
            it[NotificationMethod.teamId] = teamId
            it[NotificationMethod.type] = dto.data._type
            it[NotificationMethod.name] = dto.name
            it[NotificationMethod.useByDefault] = dto.useByDefault
            it[NotificationMethod.titleTemplate] =
                dto.titleTemplate?.nullIfNoDifference(dto.data._type.titleTemplate)
            it[NotificationMethod.bodyTemplate] =
                dto.bodyTemplate?.nullIfNoDifference(dto.data._type.bodyTemplate)
        }.let {
            getById(it.value)
        }.let {
            NotificationMethodWithDataRecord(
                notificationMethod = it,
                data = notificationMethodDataService.insert(it, dto.data),
            )
        }.also {
            MonitorNotificationMethod.batchInsert(monitorIds) { monitorId ->
                this[MonitorNotificationMethod.notificationMethodId] = it.notificationMethod.id
                this[MonitorNotificationMethod.monitorId] = monitorId
            }

            if (dto.testSend) {
                appriseSender.send(it.notificationMethod.getTestSubNotification())
            }
        }
    }

    @Transactional
    fun update(dto: UpdateNotificationMethodDto): NotificationMethodWithDataRecord =
        NotificationMethod.findByPublicIdOrThrow(dto.id) {
            NotificationMethod.rowToNotificationMethodRecord(it)
        }.let { notificationMethod ->
            val monitorIds = monitorService.getByPublicId(dto.monitorIds)
                .ensureAllInTeam(notificationMethod.teamId) { monitor -> monitor.teamId }
                .map { monitor -> monitor.id }
            MonitorNotificationMethod.deleteWhere {
                MonitorNotificationMethod.notificationMethodId eq notificationMethod.id
            }

            MonitorNotificationMethod.batchInsert(monitorIds) { monitorId ->
                this[MonitorNotificationMethod.notificationMethodId] = notificationMethod.id
                this[MonitorNotificationMethod.monitorId] = monitorId
            }

            NotificationMethod.update({ NotificationMethod.id eq notificationMethod.id }) {
                it[NotificationMethod.name] = dto.name
                it[NotificationMethod.type] = dto.data._type
                it[NotificationMethod.useByDefault] = dto.useByDefault
                it[NotificationMethod.titleTemplate] = dto
                    .titleTemplate
                    ?.nullIfNoDifference(dto.data._type.titleTemplate)

                it[NotificationMethod.bodyTemplate] = dto
                    .bodyTemplate
                    ?.nullIfNoDifference(dto.data._type.bodyTemplate)
            }.let {
                getById(notificationMethod.id)
            }.let {
                NotificationMethodWithDataRecord(
                    notificationMethod = it,
                    data = notificationMethodDataService.update(
                        oldNotificationMethod = notificationMethod,
                        updatedNotificationMethod = it,
                        data = dto.data,
                    ),
                )
            }.also {
                if (dto.testSend) {
                    appriseSender.send(it.notificationMethod.getTestSubNotification())
                }
            }
        }

    @Transactional
    fun clone(publicNotificationMethodId: String, teamId: ULong? = null): NotificationMethodWithDataRecord =
        NotificationMethod.findByPublicIdOrThrow(publicNotificationMethodId) {
            NotificationMethod.rowToNotificationMethodRecord(it)
        }.let { notificationMethod ->
            val data = notificationMethodDataService.findByIdAndType(notificationMethod.id, notificationMethod.type)

            NotificationMethod.insertAndGetId {
                it[NotificationMethod.teamId] = teamId ?: notificationMethod.teamId
                it[NotificationMethod.type] = data._type
                it[NotificationMethod.name] = "${notificationMethod.name} (Copy)"
                it[NotificationMethod.useByDefault] = notificationMethod.useByDefault
                it[NotificationMethod.titleTemplate] =
                    notificationMethod.titleTemplate?.nullIfNoDifference(data._type.titleTemplate)
                it[NotificationMethod.bodyTemplate] =
                    notificationMethod.bodyTemplate?.nullIfNoDifference(data._type.bodyTemplate)
            }.let {
                getById(notificationMethod.id)
            }.let {
                NotificationMethodWithDataRecord(
                    notificationMethod = it,
                    data = notificationMethodDataService.insert(
                        notificationMethod = notificationMethod,
                        data = data,
                    ),
                )
            }.also { (updatedNotificationMethod) ->
                if (teamId == null) {
                    MonitorNotificationMethod.batchInsert(
                        monitorService.getByNotificationMethodId(notificationMethod.id),
                    ) { monitor ->
                        this[MonitorNotificationMethod.monitorId] = monitor.id
                        this[MonitorNotificationMethod.notificationMethodId] = updatedNotificationMethod.id
                    }
                }
            }
        }

    @Transactional
    fun deleteById(id: ULong): Int = NotificationMethod.deleteById(id)

    @Transactional
    fun undeleteById(id: ULong): NotificationMethodRecord = NotificationMethod.undeleteById(id).let {
        getById(id)
    }
}

@Suppress("LongMethod")
private fun NotificationMethodRecord.getTestSubNotification():
    SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord {
    val title = "Notification method test"
    val message = "Detailed message :)"
    val status = MonitorStatus.UP
    val teamName = "Demo Team"
    val monitorName = "Demo Monitor"
    val now = Instant.now()

    val team = TeamRecord(
        id = 1UL,
        publicId = RandomGenerator.nanoId(NANO_ID_SMALL_LENGTH),
        createdAt = now,
        updatedAt = now,
        deleted = null,
        personalUserId = null,
        name = teamName,
    )

    val monitor = MonitorRecord(
        id = 1UL,
        publicId = RandomGenerator.nanoId(NANO_ID_SMALL_LENGTH),
        createdAt = now,
        updatedAt = now,
        deleted = null,
        name = monitorName,
        teamId = team.id,
        type = MonitorType.PING,
        testIntervalSeconds = 30,
        upsideDown = false,
        retries = 3,
        resendAfter = null,
        description = null,
        status = status,
    )

    val checkResult = CheckResultRecord(
        id = 1UL,
        publicId = RandomGenerator.nanoId(NANO_ID_MAX_LENGTH),
        createdAt = now,
        updatedAt = now,
        monitorId = monitor.id,
        status = status,
        timesRetried = null,
        previousStatus = status,
        pickedUpAt = now,
        checkedAt = now,
        pingMs = 420,
        title = title,
        message = message,
    )

    return SubNotificationJoinMethodNotificationCheckResultAndMonitorRecord(
        method = this,
        subNotification = SubNotificationRecord(
            id = 1UL,
            publicId = RandomGenerator.nanoId(NANO_ID_MAX_LENGTH),
            createdAt = now,
            updatedAt = now,
            notificationId = 1UL,
            methodId = this.id,
            title = title,
            message = message,
            pickedUpAt = now,
            sentAt = null,
            error = null,
        ),
        notification = NotificationRecord(
            id = 1UL,
            publicId = RandomGenerator.nanoId(NANO_ID_DEFAULT_LENGTH),
            createdAt = now,
            updatedAt = now,
            checkResultId = checkResult.id,
            title = title,
        ),
        checkResult = checkResult,
        monitor = monitor,
    )
}

private val md: MessageDigest = MessageDigest.getInstance("SHA-256")

private fun String.toSHA256(): String = md.digest(toByteArray()).fold("") { str, byte -> str + "%02x".format(byte) }

private fun String.nullIfNoDifference(defaultTemplate: String): String? =
    if (toSHA256() == defaultTemplate.toSHA256()) {
        null
    } else {
        this
    }
