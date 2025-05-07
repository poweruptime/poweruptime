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
    fun getByTeamIdAndNames(team: Team, tags: List<TagDto>): List<Tag> {
        val existingTags = tagRepository.findByTeamIdAndNames(team.id, tags.map { it.name })
        val existingTagNames = existingTags.map { it.name }.toSet()
        val notYetExistingTags = tags.filter { !existingTagNames.contains(it.name) }

        return buildList {
            addAll(existingTags)
            addAll(
                saveAll(
                    notYetExistingTags.map { Tag.fromDto(it, team) },
                ),
            )
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
