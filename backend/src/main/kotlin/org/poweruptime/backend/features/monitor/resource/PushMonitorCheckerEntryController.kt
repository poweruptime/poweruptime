package org.poweruptime.backend.features.monitor.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorCheckerEntry
import org.poweruptime.backend.features.monitor.domain.PushMonitorCheckerEntryRepository
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/v1/public/push")
@Tag(name = "Monitor API")
class PushMonitorCheckerEntryController(
    private val pushMonitorCheckerEntryRepository: PushMonitorCheckerEntryRepository,
) {
    @Operation(summary = "Add push monitor entry")
    @GetMapping("/{pushId}")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @PathVariable("pushId") pushId: String,
        @RequestParam("status") @NotNull status: MonitorStatus,
        @RequestParam("title") @NotBlank @Size(min = 1, max = Database.MAX_TITLE_LENGTH) title: String,
        @RequestParam("message") @Size(min = 1, max = Database.MAX_MESSAGE_LENGTH) message: String?,
        @RequestParam("pingMs") pingMs: Long?,
    ) {
        when (status) {
            MonitorStatus.UP,
            MonitorStatus.DOWN -> {
                pushMonitorCheckerEntryRepository.save(
                    PushMonitorCheckerEntry(
                        pushId = pushId,
                        status = status,
                        title = title,
                        message = message,
                        pingMs = pingMs,
                    ),
                )
            }
            else -> throw BadRequestException("Status has to be UP or DOWN")
        }
    }
}
