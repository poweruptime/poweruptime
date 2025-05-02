package org.poweruptime.backend.features.info

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

    @Throws(BadRequestException::class, NotFoundException::class)
    fun fetchChangelog(
        version: String,
        includeAll: Boolean
    ): String {
        val resourcePath = if (version.contains("-beta-")) {
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

        val content = if (includeAll) {
            lines.joinToString(System.lineSeparator())
        } else {
            excerptForVersion(lines, version)
        }

        return content
    }

    private fun loadFileLines(path: String): List<String>? {
        val resource = ClassPathResource(path)
        if (!resource.exists()) return null
        return resource.inputStream.bufferedReader().use { it.readLines() }
    }

    private fun excerptForVersion(
        lines: List<String>,
        version: String
    ): String {
        val headerRegex = Regex(
            "^##\\s+${Regex.escape(version)}(?:\\s*-\\s*$datePattern)?$",
        )
        val cutIndex = lines.indexOfFirst { headerRegex.containsMatchIn(it) }
        if (cutIndex < 0) {
            throw NotFoundException("Version '$version' not found in changelog.")
        }
        return lines.subList(0, cutIndex).joinToString(System.lineSeparator())
    }
}
