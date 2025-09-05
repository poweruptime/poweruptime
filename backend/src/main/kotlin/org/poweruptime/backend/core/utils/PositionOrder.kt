package org.poweruptime.backend.core.utils

import org.poweruptime.backend.core.dto.EntityOrderDto
import org.poweruptime.backend.core.models.IHasPosition

fun <T : IHasPosition> setOrderPosition(entityList: List<T>, orderList: List<EntityOrderDto>): List<T> {
    val orderMap = orderList.associateBy({ it.id }, { it.position })

    entityList.forEach {
        it.position = orderMap[it.id]
    }

    return entityList
}
