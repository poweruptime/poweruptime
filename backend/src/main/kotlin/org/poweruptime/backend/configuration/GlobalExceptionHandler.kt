package org.poweruptime.backend.configuration

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.core.dto.ErrorPayload
import org.poweruptime.backend.core.dto.ValidationErrorPayload
import org.poweruptime.backend.core.exceptions.HttpException
import org.poweruptime.backend.features.authentication.AccountNotActivatedException
import org.poweruptime.backend.features.authentication.PasswordChangeRequiredException
import org.springframework.core.Ordered
import org.springframework.core.annotation.Order
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.HttpStatusCode
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.CredentialsExpiredException
import org.springframework.security.authentication.LockedException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.context.request.ServletWebRequest
import org.springframework.web.context.request.WebRequest
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler
import java.lang.reflect.InvocationTargetException

@Suppress("LoggingSimilarMessage")
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
class GlobalExceptionHandler : ResponseEntityExceptionHandler() {
    private final val puLogger = KotlinLogging.logger {}

    @ExceptionHandler(HttpException::class)
    fun handleHttpException(
        ex: HttpException,
        request: WebRequest
    ): ResponseEntity<ErrorPayload> {
        val payload = ErrorPayload(
            message = ex.message,
            code = ex.httpCode,
            codeName = ex.codeName,
        )
        return buildResponse(ex, ex.httpStatus, payload, request)
    }

    @Suppress("UnusedParameter")
    @ExceptionHandler(BadCredentialsException::class)
    fun handleBadCredentialsException(
        ex: BadCredentialsException,
        request: WebRequest
    ): ResponseEntity<ErrorPayload> {
        val payload = ErrorPayload(
            message = ex.message ?: ex.cause?.message ?: "Bad credentials",
            code = HttpStatus.UNAUTHORIZED.value(),
            codeName = "BAD_CREDENTIALS",
        )
        return buildResponse(ex, HttpStatus.UNAUTHORIZED, payload, request)
    }

    @Suppress("UnusedParameter")
    @ExceptionHandler(CredentialsExpiredException::class)
    fun handleCredentialsExpired(
        ex: CredentialsExpiredException,
        request: WebRequest
    ): ResponseEntity<ErrorPayload> {
        return buildResponse(PasswordChangeRequiredException(), request)
    }

    @Suppress("UnusedParameter")
    @ExceptionHandler(LockedException::class)
    fun handleAccountLocked(
        ex: LockedException,
        request: WebRequest
    ): ResponseEntity<ErrorPayload> {
        return buildResponse(AccountNotActivatedException(), request)
    }

    @ExceptionHandler(InvocationTargetException::class)
    fun handleInvocationTarget(
        ex: InvocationTargetException,
        request: WebRequest
    ): ResponseEntity<ErrorPayload> {
        val payload = ErrorPayload(
            message = ex.message ?: ex.cause?.message ?: "Invocation failure",
            code = HttpStatus.NOT_FOUND.value(),
            codeName = "INVOCATION_TARGET_EXCEPTION",
        )
        return buildResponse(ex, HttpStatus.NOT_FOUND, payload, request)
    }

    override fun handleMethodArgumentNotValid(
        ex: MethodArgumentNotValidException,
        headers: HttpHeaders,
        status: HttpStatusCode,
        request: WebRequest
    ): ResponseEntity<Any> {
        val violations = ex.bindingResult.fieldErrors.mapNotNull { it.defaultMessage }
        val payload = ValidationErrorPayload(
            message = "Validation errors occurred",
            code = status.value(),
            codeName = "VALIDATION_FAILED",
            violations = violations,
        )
        return buildResponse(ex, status, payload, request)
    }

    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(
        ex: AccessDeniedException,
        request: WebRequest
    ): ResponseEntity<ErrorPayload> {
        val payload = ErrorPayload(
            message = "Insufficient permission",
            code = HttpStatus.FORBIDDEN.value(),
            codeName = "FORBIDDEN",
        )
        return buildResponse(ex, HttpStatus.FORBIDDEN, payload, request)
    }

    @ExceptionHandler(Exception::class)
    fun handleAny(ex: Exception, request: WebRequest): ResponseEntity<ErrorPayload> {
        val payload = ErrorPayload(
            message = "An unexpected error occurred",
            code = HttpStatus.INTERNAL_SERVER_ERROR.value(),
            codeName = "INTERNAL_ERROR",
        )
        return buildResponse(ex, HttpStatus.INTERNAL_SERVER_ERROR, payload, request)
    }

    private fun buildResponse(
        httpException: HttpException,
        webRequest: WebRequest
    ): ResponseEntity<ErrorPayload> = buildResponse(
        httpException,
        httpException.httpStatus,
        ErrorPayload(httpException),
        webRequest,
    )

    private fun <T : Any> buildResponse(
        ex: Exception,
        status: HttpStatusCode,
        body: T,
        webRequest: WebRequest
    ): ResponseEntity<T> {
        val servletReq = (webRequest as ServletWebRequest).request
        puLogger.warn {
            "Handled ${ex.javaClass.simpleName} → $status at ${servletReq.servletPath}?${servletReq.queryString}: " +
                "${ex.message}"
        }
        puLogger.debug(ex) {
            "Exception:"
        }
        return ResponseEntity.status(status).body(body)
    }
}
