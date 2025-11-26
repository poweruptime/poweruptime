package org.poweruptime.backend.features.info.dto

data class InfoAdminResponse(
    val javaRuntimeVersion: String,
    val osName: String,
    val osArch: String,
    val osVersion: String,
    val port: String,
    val swaggerEnabled: String,
    val mailEnabled: String,
    val mailHost: String,
    val mailPort: String,
    val logLevel: String,
    val pushEnabled: String,
    val tempNotificationsEnabled: String,
    val rateLimitEnabled: String,
    val rateLimitDurationInSeconds: String,
    val rateLimitTries: String,
    val monitorAutoStartEnabled: String,
)
