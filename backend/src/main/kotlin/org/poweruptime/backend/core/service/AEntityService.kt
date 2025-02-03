package org.poweruptime.backend.core.service

import org.poweruptime.backend.core.exceptions.NotFoundException
import org.poweruptime.backend.core.models.IEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.retry.annotation.Backoff
import org.springframework.retry.annotation.Retryable

@Suppress("TooManyFunctions")
abstract class AEntityService<T : IEntity>(
    open val repository: JpaRepository<T, String>
) {
    fun existsById(id: String): Boolean = repository.existsById(id)

    fun existsById(ids: List<String>): Boolean = getById(ids).size == ids.size

    fun existsByIdOrThrow(id: String): String =
        if (!repository.existsById(id)) {
            throw NotFoundException()
        } else {
            id
        }

    fun existsByIdOrThrow(ids: List<String>): List<String> =
        if (!existsById(ids)) {
            throw NotFoundException()
        } else {
            ids
        }

    fun getAll(): List<T> = repository.findAll()

    fun getById(id: String): T? = repository.findById(id).orElse(null)

    fun getById(ids: Collection<String>): List<T> = repository.findAllById(ids)

    fun getByIdOrThrow(id: String): T =
        repository.findById(id).orElseThrow { throw NotFoundException("""${javaClass.simpleName} not found""") }

    fun getByIdOrThrow(ids: List<String>): List<T> {
        val entities = getById(ids)
        if (entities.size != ids.size) {
            throw NotFoundException()
        }
        return entities
    }

    open fun deleteById(id: String) = repository.deleteById(id)

    open fun deleteByIdOrThrow(id: String) = repository.deleteById(existsByIdOrThrow(id))

    fun deleteAll(entities: List<T>) = repository.deleteAll(entities)

    @Retryable(maxAttempts = 3, backoff = Backoff(delay = 100, multiplier = 2.0, maxDelay = 1_000))
    fun save(entity: T): T = repository.save(entity)

    fun saveAll(entity: List<T>): MutableList<T> = repository.saveAll(entity)

    fun flush() = repository.flush()
}
