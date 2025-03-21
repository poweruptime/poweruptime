package org.poweruptime.backend.features.statusPage.dto

import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.fileUpload.FileResponse
import org.poweruptime.backend.features.statusPage.model.StatusPage
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitor
import java.time.Instant

data class PublicStatusPageResponse(
    val id: String,
    val slug: String,
    val name: String,
    val description: String?,
    val footer: String?,
    val image: FileResponse?,
    val groups: List<PublicStatusPageGroupResponse>
) {
    constructor(it: StatusPage) : this(
        it.id,
        it.slug,
        it.name,
        it.description,
        it.footer,
        it.image?.let { FileResponse(it) },
        it.groups.map { group -> PublicStatusPageGroupResponse(group) },
    )
}

data class StatusPageResponse(
    val id: String,
    val name: String,
    val slug: String,
    val description: String?,
    val footer: String?,
    val image: FileResponse?,
    val domainNames: List<String>,
    val deleted: Instant?,
    val groups: List<StatusPageGroupResponse>
) {
    constructor(statusPage: StatusPage, statusPageGroupMonitors: Map<String, List<StatusPageGroupMonitor>>) : this(
        id = statusPage.id,
        name = statusPage.name,
        slug = statusPage.slug,
        description = statusPage.description,
        footer = statusPage.footer,
        image = statusPage.image?.let { FileResponse(it) },
        domainNames = statusPage.domainNames.map { it.name },
        deleted = statusPage.deleted,
        groups = statusPage.groups.map { group ->
            StatusPageGroupResponse(
                group,
                statusPageGroupMonitors[group.id].orEmpty(),
            )
        },
    )
}

data class CreateStatusPageDto(
    @get:NotNull val teamId: String,
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val name: String,
    @get:NotBlank
    @get:Size(min = Database.MIN_SLUG_LENGTH, max = Database.MAX_SLUG_LENGTH)
    @get:Pattern(regexp = Database.SLUG_REGEX)
    val slug: String,
    @get:NotNull @get:Valid val groups: List<StatusPageGroupDto>,
    val description: String?,
    val footer: String?,
    val imageId: String?,
    @get:Valid val domainNames: Set<
        @Size(
            min = Database.MIN_DOMAIN_LENGTH,
            max = Database.MAX_DOMAIN_LENGTH,
        )
        @Pattern(regexp = Database.DOMAIN_REGEX)
        String,
        >,
)

data class UpdateStatusPageDto(
    @get:NotNull val id: String,
    @get:NotBlank @get:Size(min = Database.MIN_NAME_LENGTH, max = Database.MAX_NAME_LENGTH) val name: String,
    @get:NotBlank
    @get:Size(min = Database.MIN_SLUG_LENGTH, max = Database.MAX_SLUG_LENGTH)
    @get:Pattern(regexp = Database.SLUG_REGEX)
    val slug: String,
    @get:NotNull @get:Valid val groups: List<StatusPageGroupDto>,
    val description: String?,
    val footer: String?,
    val imageId: String?,
    @get:Valid val domainNames: Set<
        @Size(
            min = Database.MIN_DOMAIN_LENGTH,
            max = Database.MAX_DOMAIN_LENGTH,
        )
        @Pattern(regexp = Database.DOMAIN_REGEX)
        String,
        >,
)
