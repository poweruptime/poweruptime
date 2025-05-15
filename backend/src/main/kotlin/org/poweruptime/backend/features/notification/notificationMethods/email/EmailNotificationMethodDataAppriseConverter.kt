package org.poweruptime.backend.features.notification.notificationMethods.email

import org.poweruptime.backend.features.mail.EmailSecurity
import org.poweruptime.backend.features.notification.core.NotificationMethodData
import org.poweruptime.backend.features.notification.core.NotificationMethodDataAppriseConverter
import org.poweruptime.backend.features.notification.core.NotificationMethodDataAppriseDto
import org.poweruptime.backend.features.notification.core.NotificationMethodDataType

class EmailNotificationMethodDataAppriseConverter(
    override val type: NotificationMethodDataType = NotificationMethodDataType.EMAIL,
) : NotificationMethodDataAppriseConverter {
    override fun convert(
        notificationMethodData: NotificationMethodData,
    ): NotificationMethodDataAppriseDto {
        val data = notificationMethodData as EmailNotificationMethodData

        val usernameSplit = data.username.split("@")

        return NotificationMethodDataAppriseDto(
            url = "mailto://${notificationMethodData.password}@${
                usernameSplit.last()
            }:${data.port}",
            extras = buildMap {
                set("smtp", data.host)
                set("user", data.username)
                set("from", "poweruptime<${data.username}>")
                set("to", data.to.joinToString(","))
                data.cc?.let {
                    set("cc", it.joinToString(","))
                }
                data.bcc?.let {
                    set("bcc", it.joinToString(","))
                }
                if (!data.ignoreTLSErrors) {
                    set(
                        "mode",
                        when (data.security) {
                            EmailSecurity.NONE_STARTTLS -> "starttls"
                            EmailSecurity.TLS -> "ssl"
                        },
                    )
                }
            },
        )
    }
}
