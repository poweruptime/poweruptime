package org.poweruptime.backend.features.notification.core

import org.poweruptime.backend.core.models.ADatabaseEnumConvertable

object NotificationMethodDataTypes {
    const val DISCORD = "DISCORD"
    const val EMAIL = "EMAIL"
    const val SLACK = "SLACK"
}

enum class NotificationMethodDataType : ADatabaseEnumConvertable, NotificationMethodTemplate {
    DISCORD {
        override val code = NotificationMethodDataTypes.DISCORD
        override val markdown = true
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
        override val code = NotificationMethodDataTypes.EMAIL
        override val markdown = false
        override val titleTemplate = "!status: !monitorName - !title"
        override val bodyTemplate = """
        |<p><strong>Ping</strong></p>
        |<p>!pingMsms</p>
        |<p><strong>Check started at</strong></p>
        |<p>!checkStartedAt</p>
        |<p><a href="!checkResultLink">Link to detailed information</a>.</p>
        """.trimMargin()
    },
    SLACK {
        override val code = NotificationMethodDataTypes.SLACK
        override val markdown = true
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
    val markdown: Boolean
}
