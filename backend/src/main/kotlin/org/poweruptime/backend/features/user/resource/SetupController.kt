package org.poweruptime.backend.features.user.resource

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.poweruptime.backend.core.dto.IdResponse
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.exceptions.ForbiddenException
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.features.authentication.SetupDto
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.mail.emails.SetupTestEmail
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.poweruptime.backend.features.user.dto.CreateUserDto
import org.poweruptime.backend.features.user.service.UserService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

open class SetupCompletedException : ForbiddenException(
    "Setup is already completed.",
    "SETUP_COMPLETED",
)

@RestController
@RequestMapping("/v1/public/setup")
@Tag(name = "Setup API")
class SetupController(
    private val userService: UserService,
    private val emailService: SystemEmailService,
) {
    private val setupCode = RandomGenerator.int(111111, 999999).toString()

    @Operation(
        summary = "Setup first user",
    )
    @PostMapping
    @ResponseStatus(HttpStatus.OK)
    fun setup(@Valid @RequestBody request: SetupDto): IdResponse {
        if (!userService.getIsSetup()) {
            throw SetupCompletedException()
        }

        return IdResponse(
            userService.create(
                dto = CreateUserDto(
                    name = request.name,
                    email = request.email,
                    role = SystemRole.ADMIN,
                    sendInvitation = true,
                    password = null,
                    activated = true,
                ),
            ),
        )
    }

    @Operation(
        summary = "Test e-mail setup",
    )
    @PostMapping("/email")
    @ResponseStatus(HttpStatus.OK)
    fun setupEmailTest(@RequestParam("email") email: String) {
        if (!userService.getIsSetup()) {
            throw SetupCompletedException()
        }

        try {
            emailService.sendEmail(SetupTestEmail(email, setupCode))
        } catch (_: Throwable) {
            throw BadRequestException("Failed to send e-mail.", "EMAIL_SEND_FAILED")
        }
    }

    @Operation(
        summary = "Test e-mail setup",
    )
    @GetMapping("/email/verify")
    @ResponseStatus(HttpStatus.OK)
    fun verifyTestEmail(@RequestParam("code") code: String) {
        if (!userService.getIsSetup()) {
            throw SetupCompletedException()
        }

        if (!setupCode.contains(code)) {
            throw BadRequestException("Invalid code.", "INVALID_CODE")
        }
    }
}
