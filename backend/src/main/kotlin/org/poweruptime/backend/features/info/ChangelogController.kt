package org.poweruptime.backend.features.info

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.springframework.core.io.ClassPathResource
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.io.IOException

@RestController
@RequestMapping("/v1/changelog")
@Tag(name = "Changelog API")
class ChangelogController {
    @Operation(
        summary = "Get changelog",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @GetMapping(produces = [MediaType.TEXT_MARKDOWN_VALUE])
    fun getChangelog(
        @RequestParam version: String
    ): ResponseEntity<String> {
        val resourcePath = if (version.contains("-beta-")) {
            "static/CHANGELOG-beta.md"
        } else {
            "static/CHANGELOG.md"
        }

        return try {
            val resource = ClassPathResource(resourcePath)
            if (!resource.exists()) {
                return ResponseEntity
                    .status(404)
                    .body("Changelog file not found: $resourcePath")
            }

            val lines = resource.inputStream.bufferedReader().readLines()
            val headerRegex = Regex(
                """^##\s+${Regex.escape(version)}(?:\s*-\s*\d{4}-\d{2}-\d{2})?$""",
            )
            val cutIndex = lines.indexOfFirst { headerRegex.containsMatchIn(it) }

            if (cutIndex < 0) {
                ResponseEntity
                    .status(404)
                    .body("Version '$version' not found in changelog.")
            } else {
                val excerpt = lines.subList(0, cutIndex).joinToString("\n")
                ResponseEntity
                    .ok()
                    .contentType(MediaType.TEXT_MARKDOWN)
                    .body(excerpt)
            }
        } catch (e: IOException) {
            ResponseEntity
                .status(500)
                .body("Failed to read changelog: ${e.message}")
        }
    }
}
