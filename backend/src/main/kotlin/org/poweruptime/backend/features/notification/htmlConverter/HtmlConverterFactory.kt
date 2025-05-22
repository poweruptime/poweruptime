package org.poweruptime.backend.features.notification.htmlConverter

import org.poweruptime.backend.features.notification.core.NotificationMethodTemplateType

class HtmlConverterFactory {
    fun getConverter(type: NotificationMethodTemplateType): HtmlConverter = when (type) {
        NotificationMethodTemplateType.PLAIN,
        NotificationMethodTemplateType.HTML -> NoneHtmlConverter()
        NotificationMethodTemplateType.MARKDOWN -> HtmlToCommonMarkdownConverter()
        NotificationMethodTemplateType.MRKDWN -> HtmlToMrkdwnConverter()
    }
}
