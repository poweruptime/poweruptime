package org.poweruptime.backend.features.notification.htmlConverter

import org.jsoup.Jsoup
import org.jsoup.nodes.Element
import org.jsoup.nodes.Node
import org.jsoup.nodes.TextNode

class HtmlToMrkdwnConverter : HtmlConverter {
    /**
     * Converts HTML to Slack mrkdwn format
     */
    override fun convert(html: String): String {
        // Clean up any unnecessary whitespace
        val cleanHtml = html.trim()
        if (cleanHtml.isEmpty()) {
            return ""
        }

        // Parse the HTML
        val document = Jsoup.parse(cleanHtml)

        // Process the body element to get the mrkdwn content
        return processNode(document.body())
            .replace(Regex("\n\n\n+"), "\n\n") // Remove excessive newlines
            .trim()
    }

    /**
     * Recursively processes nodes in the HTML document
     */
    @Suppress("LongMethod")
    private fun processNode(node: Node): String {
        return when (node) {
            is TextNode -> {
                // Escape special characters in text nodes
                escapeSpecialCharacters(node.text())
            }

            is Element -> {
                when (node.tagName().lowercase()) {
                    "br" -> "\n"

                    "p" -> {
                        val content = processChildNodes(node)
                        "$content\n\n"
                    }

                    "strong", "b" -> {
                        val content = processChildNodes(node)
                        "*$content*"
                    }

                    "em", "i" -> {
                        val content = processChildNodes(node)
                        "_${content}_"
                    }

                    "del", "s" -> {
                        val content = processChildNodes(node)
                        "~$content~"
                    }

                    "code" -> {
                        val content = processChildNodes(node)
                        "`$content`"
                    }

                    "pre" -> {
                        val content = processChildNodes(node)
                        "```$content```"
                    }

                    "blockquote" -> {
                        val content = processChildNodes(node)
                            .split("\n")
                            .joinToString("\n") { "> $it" }
                        "$content\n\n"
                    }

                    "a" -> {
                        val href = node.attr("href")
                        val text = processChildNodes(node)

                        "<$href|$text>"
                    }

                    "ul" -> {
                        val items = node.children()
                            .filter { it.tagName().equals("li", ignoreCase = true) }
                            .joinToString("\n") { "- ${processChildNodes(it)}" }
                        "$items\n\n"
                    }

                    "ol" -> {
                        val items = node.children()
                            .filter { it.tagName().equals("li", ignoreCase = true) }
                            .mapIndexed { index, element ->
                                "${index + 1}. ${processChildNodes(element)}"
                            }
                            .joinToString("\n")
                        "$items\n\n"
                    }

                    "div", "span" -> {
                        // For generic containers, just process their children
                        processChildNodes(node)
                    }

                    "h1", "h2", "h3", "h4", "h5", "h6" -> {
                        // Headers in Slack are just bold text
                        val content = processChildNodes(node)
                        "*$content*\n\n"
                    }

                    else -> {
                        // For unhandled tags, just process their children
                        processChildNodes(node)
                    }
                }
            }

            else -> {
                // Process child nodes for any other type
                processChildNodes(node)
            }
        }
    }

    /**
     * Process all child nodes of a parent node
     */
    private fun processChildNodes(node: Node): String {
        return node.childNodes().joinToString("") { processNode(it) }
    }

    /**
     * Escape special characters that have meaning in mrkdwn
     */
    private fun escapeSpecialCharacters(text: String): String {
        return text
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            // Preventing accidental formatting in plain text
            .replace(Regex("(?<![*_~`])[*](?![*_~`])"), "\\*")
            .replace(Regex("(?<![*_~`])[_](?![*_~`])"), "\\_")
            .replace(Regex("(?<![*_~`])[~](?![*_~`])"), "\\~")
            .replace(Regex("(?<![*_~`])[`](?![*_~`])"), "\\`")
    }
}
