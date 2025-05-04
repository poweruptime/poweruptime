package org.poweruptime.backend.features.info

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/changelog")
@Tag(name = "Changelog API")
class ChangelogController(
    private val changelogService: ChangelogService
) {
    @Operation(
        summary = "Get changelog",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @GetMapping(produces = [MediaType.TEXT_MARKDOWN_VALUE])
    fun getChangelog(
        @RequestParam beta: Boolean = false,
        @RequestParam version: String? = null,
    ): ResponseEntity<String> = ResponseEntity.ok()
        .contentType(MediaType.TEXT_MARKDOWN)
        .body(changelogService.fetchChangelog(beta, version))
}
