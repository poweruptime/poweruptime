package org.poweruptime.backend.features.push

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Flux

@RestController
@RequestMapping("/v1/public/sse")
@Tag(name = "SSE API")
class PushController(
    private val pushService: PushService,
) {

    @Operation(summary = "Get push")
    @GetMapping("/{teamIds}", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    @ResponseStatus(HttpStatus.OK)
    fun get(@PathVariable("teamIds") teamIdsString: String): Flux<String> {
        val teamIds = teamIdsString.split(",")

        // If no teamIds provided, complete and return
        if (teamIds.isEmpty()) {
            throw BadRequestException("teamIds cannot be empty")
        }

        return pushService.newSubscription(teamIds)
    }
}
