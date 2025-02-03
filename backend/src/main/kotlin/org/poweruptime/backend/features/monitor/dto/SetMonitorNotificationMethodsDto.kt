package org.poweruptime.backend.features.monitor.dto

import jakarta.validation.constraints.NotNull

data class SetMonitorNotificationMethodsDto(
    @get:NotNull
    val ids: List<String>
)
