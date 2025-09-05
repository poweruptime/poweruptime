package org.poweruptime.backend.features.notification.service

import io.github.oshai.kotlinlogging.KotlinLogging
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.deleteById
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.model.NotificationMethodData
import org.poweruptime.backend.features.notification.model.NotificationMethodDataTable
import org.poweruptime.backend.features.notification.model.NotificationMethodRecord
import org.poweruptime.backend.features.notification.notificationMethods.apprise.AppriseNotificationMethodDataRecord
import org.poweruptime.backend.features.notification.notificationMethods.apprise.AppriseNotificationMethodDataTable
import org.poweruptime.backend.features.notification.notificationMethods.discord.DiscordNotificationMethodDataRecord
import org.poweruptime.backend.features.notification.notificationMethods.discord.DiscordNotificationMethodDataTable
import org.poweruptime.backend.features.notification.notificationMethods.email.EmailNotificationMethodDataRecord
import org.poweruptime.backend.features.notification.notificationMethods.email.EmailNotificationMethodDataTable
import org.poweruptime.backend.features.notification.notificationMethods.slack.SlackNotificationMethodDataRecord
import org.poweruptime.backend.features.notification.notificationMethods.slack.SlackNotificationMethodDataTable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class NotificationMethodDataService {
    private final val logger = KotlinLogging.logger {}

    fun getTableByType(type: NotificationMethodType): NotificationMethodDataTable = when (type) {
        NotificationMethodType.APPRISE -> AppriseNotificationMethodDataTable
        NotificationMethodType.DISCORD -> DiscordNotificationMethodDataTable
        NotificationMethodType.EMAIL -> EmailNotificationMethodDataTable
        NotificationMethodType.SLACK -> SlackNotificationMethodDataTable
    }

    fun findByIdAndType(id: ULong, type: NotificationMethodType): NotificationMethodData =
        getTableByType(type).let { table ->
            table.selectAll().where {
                table.id eq id
            }.limit(1)
                .firstOrNull()
                ?.let { table.rowToRecord(it) }
                ?: throw BadRequestException("$type notification method data not found")
        }

    @Transactional
    fun insert(
        notificationMethod: NotificationMethodRecord,
        data: NotificationMethodData
    ): NotificationMethodData = when (data) {
        is AppriseNotificationMethodDataRecord -> AppriseNotificationMethodDataTable.insert {
            it[AppriseNotificationMethodDataTable.id] = notificationMethod.id
            it[AppriseNotificationMethodDataTable.url] = data.url
        }
        is DiscordNotificationMethodDataRecord -> DiscordNotificationMethodDataTable.insert {
            it[DiscordNotificationMethodDataTable.id] = notificationMethod.id
            it[DiscordNotificationMethodDataTable.url] = data.url
            it[DiscordNotificationMethodDataTable.displayName] = data.displayName
        }
        is EmailNotificationMethodDataRecord -> EmailNotificationMethodDataTable.insert {
            it[EmailNotificationMethodDataTable.id] = notificationMethod.id
            it[EmailNotificationMethodDataTable.to] = data.to.toList()
            it[EmailNotificationMethodDataTable.host] = data.host
            it[EmailNotificationMethodDataTable.port] = data.port
            it[EmailNotificationMethodDataTable.username] = data.username
            it[EmailNotificationMethodDataTable.password] = data.password
            it[EmailNotificationMethodDataTable.security] = data.security
            it[EmailNotificationMethodDataTable.ignoreTLSErrors] = data.ignoreTLSErrors
            it[EmailNotificationMethodDataTable.cc] = data.cc?.toList()
            it[EmailNotificationMethodDataTable.bcc] = data.bcc?.toList()
        }
        is SlackNotificationMethodDataRecord -> SlackNotificationMethodDataTable.insert {
            it[SlackNotificationMethodDataTable.id] = notificationMethod.id
            it[SlackNotificationMethodDataTable.url] = data.url
            it[SlackNotificationMethodDataTable.displayName] = data.displayName
        }
        else -> {
            logger.error { "Unknown notification method data class: ${notificationMethod.id} - $data" }
            throw IllegalArgumentException("Unknown notification method data class: ${notificationMethod.id} - $data")
        }
    }.let {
        findByIdAndType(notificationMethod.id, notificationMethod.type)
    }

    @Transactional
    fun update(
        oldNotificationMethod: NotificationMethodRecord,
        updatedNotificationMethod: NotificationMethodRecord,
        data: NotificationMethodData
    ): NotificationMethodData {
        if (oldNotificationMethod.type !== updatedNotificationMethod.type) {
            getTableByType(oldNotificationMethod.type).deleteById(oldNotificationMethod.id)

            return insert(updatedNotificationMethod, data)
        }

        return when (data) {
            is AppriseNotificationMethodDataRecord -> AppriseNotificationMethodDataTable.update(
                { AppriseNotificationMethodDataTable.id eq updatedNotificationMethod.id },
            ) {
                it[AppriseNotificationMethodDataTable.url] = data.url
            }
            is DiscordNotificationMethodDataRecord -> DiscordNotificationMethodDataTable.update(
                { DiscordNotificationMethodDataTable.id eq updatedNotificationMethod.id },
            ) {
                it[DiscordNotificationMethodDataTable.url] = data.url
                it[DiscordNotificationMethodDataTable.displayName] = data.displayName
            }
            is EmailNotificationMethodDataRecord -> EmailNotificationMethodDataTable.update(
                { EmailNotificationMethodDataTable.id eq updatedNotificationMethod.id },
            ) {
                it[EmailNotificationMethodDataTable.to] = data.to.toList()
                it[EmailNotificationMethodDataTable.host] = data.host
                it[EmailNotificationMethodDataTable.port] = data.port
                it[EmailNotificationMethodDataTable.username] = data.username
                it[EmailNotificationMethodDataTable.password] = data.password
                it[EmailNotificationMethodDataTable.security] = data.security
                it[EmailNotificationMethodDataTable.ignoreTLSErrors] = data.ignoreTLSErrors
                it[EmailNotificationMethodDataTable.cc] = data.cc?.toList()
                it[EmailNotificationMethodDataTable.bcc] = data.bcc?.toList()
            }
            is SlackNotificationMethodDataRecord -> SlackNotificationMethodDataTable.update(
                { SlackNotificationMethodDataTable.id eq updatedNotificationMethod.id },
            ) {
                it[SlackNotificationMethodDataTable.url] = data.url
                it[SlackNotificationMethodDataTable.displayName] = data.displayName
            }
            else -> {
                logger.error { "Unknown notification method data class: ${updatedNotificationMethod.id} - $data" }
                throw IllegalArgumentException(
                    "Unknown notification method data class: ${updatedNotificationMethod.id} - $data",
                )
            }
        }.let {
            findByIdAndType(updatedNotificationMethod.id, updatedNotificationMethod.type)
        }
    }
}
