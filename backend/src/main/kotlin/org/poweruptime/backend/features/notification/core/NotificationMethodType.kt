package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

object NotificationMethodTypes {
    const val APPRISE = "APPRISE"
    const val DISCORD = "DISCORD"
    const val EMAIL = "EMAIL"
    const val SLACK = "SLACK"
}

enum class NotificationMethodType : ADatabaseEnumConvertable, NotificationMethodTemplate {
    APPRISE {
        override val code = NotificationMethodTypes.APPRISE
        override val bodyType = NotificationMethodTemplateType.PLAIN
        override val features: List<NotificationMethodTemplateFeatures>? = listOf(
            NotificationMethodTemplateFeatures.TITLE,
        )
        override val titleTemplate = ""
        override val bodyTemplate = """
        |!status: !monitorName - !title
        |Service Name
        |!monitorName
        |Ping
        |!pingMsms
        |Check started at
        |!checkStartedAt
        |Link to detailed information: !checkResultLink.
        """.trimMargin()
    },
    DISCORD {
        override val code = NotificationMethodTypes.DISCORD
        override val bodyType = NotificationMethodTemplateType.MARKDOWN
        override val features: List<NotificationMethodTemplateFeatures>? = null
        override val titleTemplate = ""
        override val bodyTemplate = """
        |<p><strong>!status: !monitorName - !title</strong></p>
        |<p><strong>Service Name</strong></p>
        |<p>!monitorName</p>
        |<p><strong>Ping</strong></p>
        |<p>!pingMsms</p>
        |<p><strong>Check started at</strong></p>
        |<p>!checkStartedAt</p>
        |<p><a href="!checkResultLink">Link to detailed information</a>.</p>
        """.trimMargin()
    },
    EMAIL {
        override val code = NotificationMethodTypes.EMAIL
        override val bodyType = NotificationMethodTemplateType.HTML
        override val features: List<NotificationMethodTemplateFeatures>? =
            listOf(NotificationMethodTemplateFeatures.TITLE)
        override val titleTemplate = "!status: !monitorName - !title"
        override val bodyTemplate = """
        |<p><strong>Service Name</strong></p>
        |<p>!monitorName</p>
        |<p><strong>Ping</strong></p>
        |<p>!pingMsms</p>
        |<p><strong>Check started at</strong></p>
        |<p>!checkStartedAt</p>
        |<p><a href="!checkResultLink">Link to detailed information</a>.</p>
        """.trimMargin()
    },
    SLACK {
        override val code = NotificationMethodTypes.SLACK
        override val bodyType = NotificationMethodTemplateType.MRKDWN
        override val features: List<NotificationMethodTemplateFeatures>? = null
        override val titleTemplate = ""
        override val bodyTemplate = """
        |<p><strong>!status: !monitorName - !title</strong></p>
        |<p><strong>Service Name</strong></p>
        |<p>!monitorName</p>
        |<p><strong>Ping</strong></p>
        |<p>!pingMsms</p>
        |<p><strong>Check started at</strong></p>
        |<p>!checkStartedAt</p>
        |<p><a href="!checkResultLink">Link to detailed information</a>.</p>
        """.trimMargin()
    },
}

interface NotificationMethodTemplate {
    val titleTemplate: String
    val bodyTemplate: String
    val bodyType: NotificationMethodTemplateType
    val features: List<NotificationMethodTemplateFeatures>?
}

enum class NotificationMethodTemplateFeatures {
    TITLE
}

enum class NotificationMethodTemplateType {
    PLAIN, HTML, MARKDOWN, MRKDWN
}
