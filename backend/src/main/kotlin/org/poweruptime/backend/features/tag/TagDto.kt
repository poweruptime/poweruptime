package org.poweruptime.backend.features.tag

import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database

data class TagDto(
    @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val name: String,
    @get:NotNull val variant: TagVariant,
) {
    constructor(it: TagRecord) : this(it.name, it.variant)
}
