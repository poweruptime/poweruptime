package org.poweruptime.backend.features.tag

import me.dafnik.JpaSpecificationBuilder.buildSpecification
import org.poweruptime.backend.core.colDeleted
import org.poweruptime.backend.core.dto.validateSort
import org.poweruptime.backend.core.service.ASoftDeleteEntityService
import org.poweruptime.backend.features.team.model.Team
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service

@Service
class TagService(
    private val tagRepository: TagRepository,
) : ASoftDeleteEntityService<Tag>(tagRepository) {
    fun getByTeamIdAndNames(
        team: Team,
        unsafeTags: List<TagDto>
    ): List<Tag> {
        val tags = unsafeTags.distinctBy { it.name }

        // 1) fetch all existing tags for this team & name set
        val existingByName = tagRepository
            .findByTeamIdAndNames(
                team.id,
                tags.map(TagDto::name),
            )
            .associateBy(Tag::name)

        // 2) index DTOs by name for quick lookup
        val tagDtosByName = tags.associateBy(TagDto::name)

        // 3) find & mutate only those tags whose variantProperties changed
        val toUpdate = existingByName.values
            .filter { tag ->
                val dto = tagDtosByName[tag.name]!!
                tag.variant != dto.variant
            }
            .onEach { tag ->
                val dto = tagDtosByName[tag.name]!!
                tag.variant = dto.variant
            }

        // 4) persist the updates (if any)
        val updatedTags = if (toUpdate.isNotEmpty()) {
            tagRepository.saveAll(toUpdate)
        } else {
            emptyList()
        }

        // 5) build & persist new tags for names that didn’t exist
        val toCreate = tags
            .filter { it.name !in existingByName }
            .map { Tag.fromDto(it, team) }

        val createdTags = if (toCreate.isNotEmpty()) {
            tagRepository.saveAll(toCreate)
        } else {
            emptyList()
        }

        // 6) return unchanged existing + updated + newly created
        val unchanged = existingByName.values - toUpdate.toSet()

        return buildList {
            addAll(unchanged)
            addAll(updatedTags)
            addAll(createdTags)
        }
    }

    fun getAllPaginated(
        pageable: Pageable,
        teamId: String?,
        userId: String?,
        name: String?,
        deleted: Boolean = false
    ): Page<Tag> = tagRepository.findAll(
        buildSpecification {
            where {
                and {
                    require(teamId != null || userId != null) { "teamId or userId needs to be provided" }
                    and {
                        teamId?.let { col("team.id") eq it }
                        userId?.let { col("team.teamUsers.id.user.id") eq it }
                    }

                    and {
                        colDeleted(deleted)
                        name?.let { col(Tag::name) lowercaseLike "%$it%" }
                    }
                }
            }
        },
        pageable.validateSort("name", "variant"),
    )
}
