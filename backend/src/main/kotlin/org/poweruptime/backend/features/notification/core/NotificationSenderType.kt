package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

object NotificationSenderTypes {
    const val EMAIL = "EMAIL"
    const val DISCORD = "DISCORD"
}

enum class NotificationSenderType : ADatabaseEnumConvertable, NotificationMethodTemplate {
    EMAIL {
        override val code = NotificationSenderTypes.EMAIL
        override val titleTemplate = DEFAULT_TITLE_TEMPLATE
        override val bodyTemplate = DEFAULT_BODY_TEMPLATE
    },
    DISCORD {
        override val code = NotificationSenderTypes.DISCORD
        override val titleTemplate = DEFAULT_TITLE_TEMPLATE
        override val bodyTemplate = DEFAULT_BODY_TEMPLATE
    },
}

interface NotificationMethodTemplate {
    val titleTemplate: String
    val bodyTemplate: String
}

const val DEFAULT_TITLE_TEMPLATE = "[:monitorName] [:status] :title"
val DEFAULT_BODY_TEMPLATE = """
    |[:monitorName] [:status] :title
    |Ping: :pingMsms
    |Check started at: :checkStartedAt
    |More information: :checkResultLink
    |
    |:message
""".trimMargin()
