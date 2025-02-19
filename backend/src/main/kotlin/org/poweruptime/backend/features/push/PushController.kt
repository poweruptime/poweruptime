package org.poweruptime.backend.features.push

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Flux

@RestController
@RequestMapping("/v1/public/sse")
@Tag(name = "SSE API")
class PushController(
    private val pushService: PushService
) {

    @Operation(summary = "Get push notifications")
    @GetMapping(produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    @ResponseStatus(HttpStatus.OK)
    fun get(authentication: Authentication): Flux<String> = pushService.newSubscription(authentication.name)
}
