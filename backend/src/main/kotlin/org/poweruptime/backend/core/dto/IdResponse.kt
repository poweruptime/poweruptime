package org.poweruptime.backend.core.dto

import org.poweruptime.backend.core.models.IEntity

data class IdResponse(val id: String) {
    constructor(entity: IEntity) : this(entity.id)
}
