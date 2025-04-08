package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

object NotificationSenderTypes {
    const val DISCORD = "DISCORD"
    const val EMAIL = "EMAIL"
    const val SLACK = "SLACK"
}

enum class NotificationSenderType : ADatabaseEnumConvertable, NotificationMethodTemplate {
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
        |**Check started at**
        |:checkStartedAt
        |
        |[Link to detailed information](:checkResultLink).
        """.trimMargin()
    },
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
    SLACK {
        override val code = NotificationSenderTypes.SLACK
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
        |**Check started at**
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
