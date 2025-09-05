package org.poweruptime.backend.features.statusPage.dto

import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitorJoinMonitorRecord
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupRecord

data class PublicStatusPageGroupResponse(
    val id: String,
    val name: String?,
    val description: String?
) {
    constructor(it: StatusPageGroupRecord) : this(it.publicId, it.name, it.description)
}

data class StatusPageGroupResponse(
    val id: String,
    val name: String?,
    val description: String?,
    val position: Int?,
    val monitors: List<StatusPageGroupMonitorResponse>
) {
    constructor(group: StatusPageGroupRecord, groupMonitors: List<StatusPageGroupMonitorJoinMonitorRecord>) : this(
        id = group.publicId,
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
