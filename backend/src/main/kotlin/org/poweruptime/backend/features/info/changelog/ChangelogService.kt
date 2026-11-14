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
import org.poweruptime.backend.features.info.versionChecker.dto.VersionInfo
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Service
import java.io.IOException
import java.util.concurrent.ConcurrentHashMap

@Service
class ChangelogService {
    private val cache = ConcurrentHashMap<String, List<String>>()
    private val headingPattern = Regex("""^##\s+(\S+)(?:\s+-\s+\d{4}-\d{2}-\d{2})?$""")

    private val markdownRendererOptions = MutableDataSet()
    private val parser = Parser.builder(markdownRendererOptions).build()
    private val renderer = HtmlRenderer
        .builder(
            markdownRendererOptions,
        ).attributeProviderFactory(LinkTargetBlankAttributeProvider.factory())
        .build()

    @Throws(BadRequestException::class, NotFoundException::class)
    fun fetchChangelog(beta: Boolean, version: String?): String {
        val resourcePath = "static/CHANGELOG.md"

        val lines = try {
            cache.computeIfAbsent(resourcePath) {
                loadFileLines(resourcePath) ?: throw IOException("Changelog file not found")
            }
        } catch (_: IOException) {
            throw BadRequestException("Changelog file could not be read")
        }

        val markdown = filterChangelog(lines, beta, version)

        return parser.parse(markdown).let {
            renderer.render(it)
        }
    }

    private fun loadFileLines(path: String): List<String>? {
        val resource = ClassPathResource(path)
        if (!resource.exists()) return null
        return resource.inputStream.bufferedReader().use { it.readLines() }
    }

    internal fun filterChangelog(lines: List<String>, beta: Boolean, version: String?): String {
        val sections = splitSections(lines)
        // Find the previous version before channel filtering. It may be a beta when
        // a user upgrades to production. Unknown versions retain the full history.
        val cutIndex = version?.let { previous ->
            sections.indexOfFirst { it.name == previous }.takeIf { it >= 0 }
        } ?: sections.size
        // A stable release repeats the notes of its betas, which beta users already see.
        val betaNotes = if (beta) betaNotesByBaseVersion(sections) else emptyMap()
        return sections.take(cutIndex).mapNotNull { section ->
            val release = section.release
            when {
                section.name == null -> section.lines
                release == null -> null
                release.isBeta -> section.lines.takeIf { beta }
                else -> withoutNotes(section.lines, betaNotes[release.baseVersion].orEmpty())
            }
        }.flatten().joinToString(System.lineSeparator())
    }

    private fun splitSections(lines: List<String>): List<Section> {
        val sections = mutableListOf(Section(null, mutableListOf()))
        for (line in lines) {
            val name = headingPattern.matchEntire(line)?.groupValues?.get(1)
            if (name != null) {
                sections += Section(name, mutableListOf())
            }
            sections.last().lines += line
        }
        return sections
    }

    private fun betaNotesByBaseVersion(sections: List<Section>): Map<String, Set<String>> = sections
        .mapNotNull { section ->
            section.release?.takeIf { it.isBeta }?.let { release ->
                release.baseVersion to splitBlocks(section.lines.drop(1)).filter { it.isNote }.map { it.key }
            }
        }.groupBy({ it.first }) { it.second }
        .mapValues { (_, notes) -> notes.flatten().toSet() }

    private fun withoutNotes(lines: List<String>, seenNotes: Set<String>): List<String>? {
        val blocks = splitBlocks(lines.drop(1))
        if (seenNotes.isEmpty() || blocks.none { it.isNote }) return lines
        val kept = blocks.filterNot { it.isNote && it.key in seenNotes }
        // Drop subheadings such as "### Patch Changes" whose content was all removed.
        val withoutEmptySubheadings = kept.filterIndexed { index, block ->
            !block.isSubheading ||
                kept.drop(index + 1).takeWhile { !it.isSubheading }.any { it.hasContent }
        }
        // Keep stable-only text, such as upgrade instructions, even when every note repeats a beta.
        if (withoutEmptySubheadings.none { it.hasContent }) return null
        return listOf(lines.first()) + withoutEmptySubheadings.flatMap { it.lines }
    }

    // A note is a list item together with its indented continuation lines.
    private fun splitBlocks(body: List<String>): List<Block> {
        val blocks = mutableListOf<Block>()
        var index = 0
        while (index < body.size) {
            var end = index + 1
            val isNote = notePattern.matches(body[index])
            while (isNote && end < body.size) {
                val next = (end until body.size).firstOrNull { body[it].isNotBlank() }
                if (next == null || !body[next].first().isWhitespace()) break
                end = next + 1
            }
            blocks += Block(body.subList(index, end), isNote)
            index = end
        }
        return blocks
    }

    private class Section(val name: String?, val lines: MutableList<String>) {
        val release: VersionInfo? = name?.let { VersionInfo.fromString(it, "") }
    }

    private class Block(val lines: List<String>, val isNote: Boolean) {
        val key: String get() = lines.joinToString("\n") { it.trimEnd() }
        val isSubheading: Boolean get() = !isNote && lines.single().startsWith("### ")
        val hasContent: Boolean
            get() = !isSubheading && lines.any { it.isNotBlank() && !compareLinkPattern.matches(it.trim()) }
    }

    private val VersionInfo.baseVersion: String get() = "$major.$minor.$patch"

    private companion object {
        val notePattern = Regex("""^[-*]\s.*""")

        // Historical git-cliff sections end with a generated compare link, which is not release text.
        val compareLinkPattern = Regex("""^\[\*\*Full Changelog\*\*]\(\S+\)$""")
    }
}

class LinkTargetBlankAttributeProvider : AttributeProvider {
    override fun setAttributes(node: Node, part: AttributablePart, attributes: MutableAttributes) {
        if (node is Link && part === AttributablePart.LINK) {
            attributes.replaceValue("target", "_blank")
        }
    }

    companion object {
        fun factory(): AttributeProviderFactory = object : IndependentAttributeProviderFactory() {
            override fun apply(context: LinkResolverContext): AttributeProvider = LinkTargetBlankAttributeProvider()
        }
    }
}
