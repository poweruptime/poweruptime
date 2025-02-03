package org.poweruptime.backend.core.dto

import org.poweruptime.backend.core.models.EntityWithName
import org.poweruptime.backend.core.models.IEntity

data class IdResponse(val id: String) {
    constructor(entity: IEntity) : this(entity.id)
}

data class IdAndNameResponse(
    var id: String,
    var name: String
) {
    constructor(entity: EntityWithName) : this(entity.id, entity.name)
}
