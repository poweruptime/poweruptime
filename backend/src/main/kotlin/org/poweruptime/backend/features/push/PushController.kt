package org.poweruptime.backend.features.push

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.security.SecurityRequirement
import io.swagger.v3.oas.annotations.tags.Tag
import org.poweruptime.backend.configuration.BEARER_AUTH
import org.poweruptime.backend.features.authentication.service.userId
import org.poweruptime.backend.features.team.domain.findTeamIdsByUserId
import org.poweruptime.backend.features.team.model.TeamUser
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.security.core.Authentication
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Flux

@RestController
@RequestMapping("/v1/sse")
@Tag(name = "Server Side Events API")
class PushController(private val pushService: PushService) {
    @Operation(
        summary = "Get pushes",
        security = [SecurityRequirement(name = BEARER_AUTH)],
    )
    @GetMapping(produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    @ResponseStatus(HttpStatus.OK)
    @Transactional
    fun get(auth: Authentication): Flux<String> {
        val teamIds = TeamUser.findTeamIdsByUserId(auth.userId())

        if (teamIds.isEmpty()) {
            return Flux.empty()
        }

        return pushService.newSubscription(teamIds)
    }
}
