package org.poweruptime.backend.core.dto

data class ErrorPayload(
    val message: String,
    val code: Int,
    val codeName: String
)
data class ValidationErrorPayload(
    val message: String,
    val code: Int,
    val codeName: String,
    val violations: List<String>
)
