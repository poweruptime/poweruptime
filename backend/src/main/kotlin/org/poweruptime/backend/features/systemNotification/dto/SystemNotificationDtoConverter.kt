package org.poweruptime.backend.features.systemNotification.dto

import org.poweruptime.backend.features.systemNotification.model.SystemNotification

fun SystemNotification.Companion.fromDto(it: CreateSystemNotificationDto) =
    SystemNotification(
        title = it.title,
        description = it.description,
        active = it.active,
        type = it.type,
        starts = it.starts,
        ends = it.ends,
    )

fun SystemNotification.update(it: UpdateSystemNotificationDto): SystemNotification {
    title = it.title
    description = it.description
    active = it.active
    type = it.type
    starts = it.starts
    ends = it.ends

    return this
}
