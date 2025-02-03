package org.poweruptime.backend.core.dto

import jakarta.validation.constraints.Min
import org.jetbrains.annotations.NotNull

data class EntityOrderDto(
    @get:NotNull val id: String,
    @get:Min(0) val position: Int? = null
)
