package org.poweruptime.backend.features.notification.htmlConverter

import com.vladsch.flexmark.html.HtmlRenderer
import com.vladsch.flexmark.html2md.converter.FlexmarkHtmlConverter
import com.vladsch.flexmark.util.data.MutableDataSet

class HtmlToCommonMarkdownConverter : HtmlConverter {
    private val htmlToMarkdownConverter = FlexmarkHtmlConverter.builder(
        MutableDataSet().apply {
            // Ensure hard line breaks become "\n" in Markdown
            set(HtmlRenderer.SOFT_BREAK, "\n")
        },
    ).build()

    override fun convert(html: String): String = htmlToMarkdownConverter.convert(html)
}
