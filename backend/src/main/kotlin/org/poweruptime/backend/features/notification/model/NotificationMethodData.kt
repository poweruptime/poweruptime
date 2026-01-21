package org.poweruptime.backend.features.notification.model

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import org.poweruptime.backend.features.notification.core.NotificationMethodType
import org.poweruptime.backend.features.notification.core.NotificationMethodTypes
import org.poweruptime.backend.features.notification.notificationMethods.apprise.AppriseNotificationMethodDataRecord
import org.poweruptime.backend.features.notification.notificationMethods.discord.DiscordNotificationMethodDataRecord
import org.poweruptime.backend.features.notification.notificationMethods.email.EmailNotificationMethodDataRecord
import org.poweruptime.backend.features.notification.notificationMethods.slack.SlackNotificationMethodDataRecord

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "_type")
@JsonSubTypes(
    JsonSubTypes.Type(value = AppriseNotificationMethodDataRecord::class, name = NotificationMethodTypes.APPRISE),
    JsonSubTypes.Type(value = DiscordNotificationMethodDataRecord::class, name = NotificationMethodTypes.DISCORD),
    JsonSubTypes.Type(value = EmailNotificationMethodDataRecord::class, name = NotificationMethodTypes.EMAIL),
    JsonSubTypes.Type(value = SlackNotificationMethodDataRecord::class, name = NotificationMethodTypes.SLACK),
)
@Suppress("AbstractClassCanBeConcreteClass")
abstract class NotificationMethodData(
    @Suppress("PropertyName", "ConstructorParameterNaming")
    @JsonProperty("_type")
    val _type: NotificationMethodType,
)
