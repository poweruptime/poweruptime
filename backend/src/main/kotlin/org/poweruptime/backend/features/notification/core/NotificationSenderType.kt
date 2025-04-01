package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

object NotificationSenderTypes {
    const val EMAIL = "EMAIL"
    const val DISCORD = "DISCORD"
}

enum class NotificationSenderType : ADatabaseEnumConvertable, NotificationMethodTemplate {
    EMAIL {
        override val code = NotificationSenderTypes.EMAIL
        override val titleTemplate = "[:monitorName] [:status] :title"
        override val bodyTemplate = """
        |[:monitorName] [:status] :title
        |Ping: :pingMsms
        |Check started at: :checkStartedAt
        |More information: :checkResultLink
        |
        |:message
        """.trimMargin()
    },
    DISCORD {
        override val code = NotificationSenderTypes.DISCORD
        override val titleTemplate = ""
        override val bodyTemplate = """
        |**:status: :monitorName - :title**
        |
        |**Service Name**
        |:monitorName
        |
        |**Ping**
        |:pingMsms
        |
        |**Started at**
        |:checkStartedAt
        |
        |[Link to detailed information](:checkResultLink).
        """.trimMargin()
    },
}

interface NotificationMethodTemplate {
    val titleTemplate: String
    val bodyTemplate: String
}
