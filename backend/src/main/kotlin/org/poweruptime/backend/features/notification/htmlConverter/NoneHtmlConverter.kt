package org.poweruptime.backend.features.notification.htmlConverter

class NoneHtmlConverter : HtmlConverter {
    override fun convert(html: String): String = html
}
