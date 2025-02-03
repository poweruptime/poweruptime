package org.poweruptime.backend.features.deadLetter

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.core.REQUIRED_AUTH
import org.poweruptime.backend.core.SYSTEM_ROLE_ADMIN
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/dead-letter")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Dead letter API")
class DeadLetterController(
    private val deadLetterRepository: DeadLetterRepository
) {
    @Operation(
        summary = "Get all dead letters",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    fun getAll() = deadLetterRepository.findAll().map { DeadLetterResponse(it) }

    @Operation(
        summary = "Delete dead letter",
        security = [SecurityRequirement(name = BEARER_AUTH)],
        description = "$REQUIRED_AUTH $SYSTEM_ROLE_ADMIN",
    )
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.OK)
    fun delete(@PathVariable("id") id: String): Unit = deadLetterRepository.deleteById(id)
}
