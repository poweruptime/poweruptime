package org.poweruptime.backend.features.tag

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.batchInsert
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.Page
import org.poweruptime.backend.core.domain.findById
import org.poweruptime.backend.core.dto.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class TagService {

    fun getByMonitorId(monitorIds: List<ULong>): Map<ULong, List<TagRecord>> =
        Tag.findByMonitorId(monitorIds)
            .groupBy { it.monitorTag.monitorId }
            .mapValues {
                it.value.map { tagJoinMonitor -> tagJoinMonitor.tag }
            }

    fun getByMonitorId(monitorId: ULong): List<TagRecord> = Tag.findByMonitorId(monitorId)

    @Transactional
    fun getByTeamIdAndNames(
        teamId: ULong,
        unsafeTags: List<TagDto>
    ): List<TagRecord> {
        val tags = unsafeTags.distinctBy { it.name }

        // 1) fetch all existing tags for this team & name set
        val existingByName = Tag.findByTeamIdAndNames(
            teamId,
            tags.map(TagDto::name),
        )
            .associateBy(TagRecord::name)

        // 2) index DTOs by name for quick lookup
        val tagDtosByName = tags.associateBy(TagDto::name)

        // 3) find & mutate only those tags whose variantProperties changed
        val updatedTags = existingByName.values
            .filter { tag ->
                val dto = tagDtosByName[tag.name]!!
                tag.variant != dto.variant
            }
            .onEach { tag ->
                val dto = tagDtosByName[tag.name]!!
                tag.variant = dto.variant
            }.map { tag ->
                Tag.update({ Tag.id eq tag.id }) {
                    it[Tag.variant] = tag.variant
                }
                tag.id
            }.let { tagIds ->
                Tag.findById(tagIds) {
                    Tag.rowToTagRecord(it)
                }
            }

        // 5) build & persist new tags for names that didn’t exist
        val createdTags = tags
            .filter { it.name !in existingByName }
            .let { tags ->
                Tag.batchInsert(tags) { tag ->
                    this[Tag.teamId] = teamId
                    this[Tag.name] = tag.name
                    this[Tag.variant] = tag.variant
                }
            }.map { tag ->
                Tag.rowToTagRecord(tag)
            }

        // 6) return unchanged existing + updated + newly created
        val unchanged = existingByName.values - updatedTags.toSet()

        return buildList {
            addAll(unchanged)
            addAll(updatedTags)
            addAll(createdTags)
        }
    }

    fun getAllPaginated(
        pageable: Pageable,
        teamId: ULong?,
        userId: ULong?,
        name: String?,
        deleted: Boolean = false
    ): Page<TagRecord> = Tag.findAll(
        pageable = pageable,
        teamId = teamId,
        userId = userId,
        name = name,
        deleted = deleted,
    )
}
