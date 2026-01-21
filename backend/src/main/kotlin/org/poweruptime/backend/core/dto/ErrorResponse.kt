package org.poweruptime.backend.core.dto

import org.poweruptime.backend.core.exceptions.HttpException

data class ErrorPayload(val message: String, val code: Int, val codeName: String) {
    constructor(httpException: HttpException) : this(
        message = httpException.message,
        code = httpException.httpCode,
        codeName = httpException.codeName,
    )
}

data class ValidationErrorPayload(
    val message: String,
    val code: Int,
    val codeName: String,
    val violations: List<String>,
)
