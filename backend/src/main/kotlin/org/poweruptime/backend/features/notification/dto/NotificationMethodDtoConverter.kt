package org.poweruptime.backend.features.notification.dto

import org.poweruptime.backend.features.notification.core.NotificationMethodData
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.poweruptime.backend.features.team.model.Team
import java.security.MessageDigest

private val md: MessageDigest = MessageDigest.getInstance("SHA-256")

fun String.toSHA256(): String = md.digest(toByteArray()).fold("") { str, byte -> str + "%02x".format(byte) }

fun String.nullIfNoDifference(defaultTemplate: String): String? =
    if (toSHA256() == defaultTemplate.toSHA256()) {
        null
    } else {
        this
    }

fun NotificationMethod.Companion.fromDto(
    dto: CreateNotificationMethodDto,
    team: Team,
    attachedSender: NotificationMethodData
): NotificationMethod = NotificationMethod(
    name = dto.name,
    data = attachedSender,
    team = team,
    useByDefault = dto.useByDefault,
    titleTemplate = dto.titleTemplate?.nullIfNoDifference(dto.sender._type.titleTemplate),
    bodyTemplate = dto.bodyTemplate?.nullIfNoDifference(dto.sender._type.bodyTemplate),
)

fun NotificationMethod.update(
    dto: UpdateNotificationMethodDto,
    attachedSender: NotificationMethodData
): NotificationMethod {
    name = dto.name
    data = dto.sender
    useByDefault = dto.useByDefault
    titleTemplate = dto.titleTemplate?.nullIfNoDifference(dto.sender._type.titleTemplate)
    bodyTemplate = dto.bodyTemplate?.nullIfNoDifference(dto.sender._type.bodyTemplate)
    data = attachedSender

    return this
}
