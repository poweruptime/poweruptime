package org.poweruptime.backend.core.service

import org.poweruptime.backend.core.domain.ISoftDeleteRepository
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.poweruptime.backend.core.models.ISoftDeleteEntity

abstract class ASoftDeleteEntityService<T : ISoftDeleteEntity>(
    override val repository: ISoftDeleteRepository<T>
) : AEntityService<T>(repository) {

    fun existsById(id: String, includeDeleted: Boolean): Boolean = repository.existsById(id, includeDeleted)

    fun existsById(ids: List<String>, includeDeleted: Boolean): Boolean =
        getById(ids, includeDeleted).size == ids.size

    fun existsByIdOrThrow(id: String, includeDeleted: Boolean): String =
        if (!repository.existsById(id, includeDeleted)) {
            throw NotFoundException()
        } else {
            id
        }

    fun existsByIdOrThrow(ids: List<String>, includeDeleted: Boolean): List<String> =
        if (!existsById(ids, includeDeleted)) {
            throw NotFoundException()
        } else {
            ids
        }

    fun getAll(includeDeleted: Boolean): List<T> = repository.findAll(includeDeleted)

    fun getById(id: String, includeDeleted: Boolean): T? = repository.findById(id, includeDeleted).orElse(null)

    fun getById(ids: Collection<String>, includeDeleted: Boolean): List<T> = repository.findAllById(
        ids,
        includeDeleted,
    )

    fun getByIdOrThrow(id: String, includeDeleted: Boolean): T =
        repository.findById(
            id,
            includeDeleted,
        ).orElseThrow { throw NotFoundException("""${javaClass.simpleName} not found""") }

    fun getByIdOrThrow(ids: List<String>, includeDeleted: Boolean): List<T> {
        val entities = getById(ids, includeDeleted)
        if (entities.size != ids.size) {
            throw NotFoundException()
        }
        return entities
    }

    open fun undeleteById(id: String): T = repository.undeleteById(id).let {
        repository.flush()
        getByIdOrThrow(id)
    }
}
