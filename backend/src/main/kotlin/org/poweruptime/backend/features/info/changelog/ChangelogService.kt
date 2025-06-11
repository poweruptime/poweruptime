package org.poweruptime.backend.features.info.changelog

import com.vladsch.flexmark.ast.Link
import com.vladsch.flexmark.html.AttributeProvider
import com.vladsch.flexmark.html.AttributeProviderFactory
import com.vladsch.flexmark.html.HtmlRenderer
import com.vladsch.flexmark.html.IndependentAttributeProviderFactory
import com.vladsch.flexmark.html.renderer.AttributablePart
import com.vladsch.flexmark.html.renderer.LinkResolverContext
import com.vladsch.flexmark.parser.Parser
import com.vladsch.flexmark.util.ast.Node
import com.vladsch.flexmark.util.data.MutableDataSet
import com.vladsch.flexmark.util.html.MutableAttributes
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Service
import java.io.IOException
import java.util.concurrent.ConcurrentHashMap

@Service
class ChangelogService {
    private val cache = ConcurrentHashMap<String, List<String>>()
    private val datePattern = "\\d{4}-\\d{2}-\\d{2}"

    private val markdownRendererOptions = MutableDataSet()
    private val parser = Parser.builder(markdownRendererOptions).build()
    private val renderer = HtmlRenderer.builder(
        markdownRendererOptions,
    ).attributeProviderFactory(LinkTargetBlankAttributeProvider.factory()).build()

    @Throws(BadRequestException::class, NotFoundException::class)
    fun fetchChangelog(
        beta: Boolean,
        version: String?,
    ): String {
        val resourcePath = if (beta) {
            "static/CHANGELOG-beta.md"
        } else {
            "static/CHANGELOG.md"
        }

        val lines = try {
            cache.computeIfAbsent(resourcePath) {
                loadFileLines(resourcePath) ?: throw IOException("Changelog file not found")
            }
        } catch (_: IOException) {
            throw BadRequestException("Changelog file could not be read")
        }

        fun getAll(): String = lines.joinToString(System.lineSeparator())

        val markdown = version?.let {
            excerptForVersion(lines, it) ?: getAll()
        } ?: getAll()

        return parser.parse(markdown).let {
            renderer.render(it)
        }
    }

    private fun loadFileLines(path: String): List<String>? {
        val resource = ClassPathResource(path)
        if (!resource.exists()) return null
        return resource.inputStream.bufferedReader().use { it.readLines() }
    }

    private fun excerptForVersion(
        lines: List<String>,
        version: String
    ): String? {
        val headerRegex = Regex(
            "^##\\s+${Regex.escape(version)}(?:\\s*-\\s*$datePattern)?$",
        )
        val cutIndex = lines.indexOfFirst { headerRegex.containsMatchIn(it) }
        if (cutIndex < 0) {
            return null
        }
        return lines.subList(0, cutIndex).joinToString(System.lineSeparator())
    }
}

class LinkTargetBlankAttributeProvider : AttributeProvider {
    override fun setAttributes(node: Node, part: AttributablePart, attributes: MutableAttributes) {
        if (node is Link && part === AttributablePart.LINK) {
            attributes.replaceValue("target", "_blank")
        }
    }

    companion object {
        fun factory(): AttributeProviderFactory {
            return object : IndependentAttributeProviderFactory() {
                override fun apply(context: LinkResolverContext): AttributeProvider {
                    return LinkTargetBlankAttributeProvider()
                }
            }
        }
    }
}
