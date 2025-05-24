package org.poweruptime.backend.features.statusPage.dto

import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.statusPage.model.StatusPageGroup
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitor

data class PublicStatusPageGroupResponse(
    val id: String,
    val name: String?,
    val description: String?
) {
    constructor(it: StatusPageGroup) : this(it.id, it.name, it.description)
}

data class StatusPageGroupResponse(
    val id: String,
    val name: String?,
    val description: String?,
    val position: Int?,
    val monitors: List<StatusPageGroupMonitorResponse>
) {
    constructor(group: StatusPageGroup, groupMonitors: List<StatusPageGroupMonitor>) : this(
        id = group.id,
        name = group.name,
        description = group.description,
        position = group.position,
        monitors = groupMonitors.map { StatusPageGroupMonitorResponse(it) },
    )
}

data class StatusPageGroupDto(
    @get:Size(max = Database.MAX_NAME_LENGTH) val name: String?,
    @get:NotNull val monitorIds: List<String>,
    val description: String?,
)
