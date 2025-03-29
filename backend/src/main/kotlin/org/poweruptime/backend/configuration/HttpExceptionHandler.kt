package org.poweruptime.backend.configuration

import jakarta.servlet.http.HttpServletRequest
import org.poweruptime.backend.core.dto.ErrorResponse
import org.poweruptime.backend.core.exceptions.HttpException
import org.poweruptime.backend.features.authentication.PasswordChangeRequiredException
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.authentication.CredentialsExpiredException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseBody
import java.lang.reflect.InvocationTargetException

@Suppress("LoggingSimilarMessage")
@ControllerAdvice
class HttpExceptionHandler {
    private final val logger: Logger = LoggerFactory.getLogger(HttpExceptionHandler::class.java)
    private final val jsonHeader = HttpHeaders()

    init {
        jsonHeader.contentType = MediaType.APPLICATION_JSON
    }

    @ResponseBody
    @ExceptionHandler(HttpException::class)
    fun handleException(
        servletRequest: HttpServletRequest,
        exception: HttpException
    ): ResponseEntity<HttpException> {
        logger.warn(
            "{}: '{}', Path: '{}' Query: '{}'",
            exception.javaClass.simpleName,
            exception.message,
            servletRequest.servletPath,
            servletRequest.queryString,
        )
        return ResponseEntity(exception, jsonHeader, exception.httpStatus)
    }

    @ExceptionHandler(CredentialsExpiredException::class)
    fun handleException(
        servletRequest: HttpServletRequest,
        exception: CredentialsExpiredException
    ): ResponseEntity<HttpException> {
        logger.warn(
            "{}: '{}', Path: '{}' Query: '{}'",
            exception.javaClass.simpleName,
            exception.message,
            servletRequest.servletPath,
            servletRequest.queryString,
        )

        val httpException = PasswordChangeRequiredException()
        return ResponseEntity(httpException, jsonHeader, httpException.httpStatus)
    }

    @ResponseBody
    @ExceptionHandler(InvocationTargetException::class)
    fun handleInvocationTargetException(
        servletRequest: HttpServletRequest,
        exception: InvocationTargetException
    ): ResponseEntity<ErrorResponse> {
        logger.warn(
            "{}: '{}' Path: '{}' Query: '{}'",
            exception.javaClass.name,
            exception.message,
            servletRequest.servletPath,
            servletRequest.queryString,
        )
        return ResponseEntity(
            ErrorResponse("InvocationTargetException", 404, "invocation_target_exception"),
            jsonHeader,
            HttpStatus.NOT_FOUND,
        )
    }

    @ResponseBody
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(ex: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val error = ex.bindingResult.fieldErrors[0]
        logger.warn(
            "ValidationException: '{}' Field: '{}' Message: '{}' Validation: '{}'",
            error.objectName,
            error.field,
            error.defaultMessage,
            error.code,
        )
        return ResponseEntity(
            ErrorResponse(error.defaultMessage!!, 400, "BAD_REQUEST"),
            jsonHeader,
            HttpStatus.BAD_REQUEST,
        )
    }

    @ResponseBody
    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDeniedException(
        servletRequest: HttpServletRequest,
        exception: AccessDeniedException
    ): ResponseEntity<ErrorResponse> {
        logger.warn(
            "AccessDeniedException: Path: '{}' Query: '{}', Exception: '{}'",
            servletRequest.servletPath,
            servletRequest.queryString,
            exception.message,
        )
        return ResponseEntity(
            ErrorResponse("Insufficient permission", 403, "FORBIDDEN"),
            jsonHeader,
            HttpStatus.FORBIDDEN,
        )
    }
}
