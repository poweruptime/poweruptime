package org.poweruptime.backend.features.tag

import jakarta.persistence.criteria.CriteriaBuilder
import jakarta.persistence.criteria.CriteriaQuery
import jakarta.persistence.criteria.Root
import org.poweruptime.backend.core.Filter
import org.poweruptime.backend.core.FilterCompare
import org.poweruptime.backend.core.dto.PageableValidator
import org.poweruptime.backend.core.service.ASoftDeleteEntityService
import org.poweruptime.backend.core.toDeletedFilter
import org.poweruptime.backend.core.toPredicate
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
        tags: List<TagDto>
    ): List<Tag> {
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
        teamId: String,
        name: String? = null,
        deleted: Boolean = false
    ): Page<Tag> = tagRepository.findAll(
        { root: Root<Tag>, _: CriteriaQuery<*>?, criteriaBuilder: CriteriaBuilder ->
            criteriaBuilder.and(
                *buildList {
                    Filter("team.id", teamId, FilterCompare.EQ)
                    add(deleted.toDeletedFilter())
                    name?.let { add(Filter("name", it, FilterCompare.LIKE)) }
                }.toPredicate(root, criteriaBuilder).toTypedArray(),
            )
        },
        PageableValidator.validateSort(
            pageable,
            listOf(
                "name",
                "variant",
            ),
        ),
    )
}
