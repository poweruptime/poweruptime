package org.poweruptime.backend.core.domain

import jakarta.persistence.PreUpdate
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.poweruptime.backend.core.models.ISoftDeleteEntity
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.NoRepositoryBean
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.*

@NoRepositoryBean
interface ISoftDeleteRepository<T : ISoftDeleteEntity> : Repository<T> {

    @Transactional(readOnly = true)
    @Query(
        """
        select
            CASE WHEN COUNT(e) > 0 THEN true ELSE false END
        from #{#entityName} e where
            e.id = ?1 and (e.deleted is null or ?2 = true)
        """,
    )
    fun existsById(id: String, includeDeleted: Boolean): Boolean

    @Transactional(readOnly = true)
    override fun existsById(id: String): Boolean = existsById(id, includeDeleted = false)

    @Transactional(readOnly = true)
    @Query("select e from #{#entityName} e where (e.deleted is null or ?1 = true)")
    fun findAll(includeDeleted: Boolean): MutableList<T>

    @Transactional(readOnly = true)
    override fun findAll(): MutableList<T> = findAll(includeDeleted = false)

    @Transactional(readOnly = true)
    @Query(
        """
        select e from #{#entityName} e where
            e.id in ?1 and (e.deleted is null or ?2 = true)
        """,
    )
    fun findAllById(ids: Iterable<String?>, includeDeleted: Boolean): MutableList<T>

    @Transactional(readOnly = true)
    override fun findAllById(ids: Iterable<String?>): MutableList<T> = findAllById(ids, includeDeleted = false)

    @Transactional(readOnly = true)
    @Query("select e from #{#entityName} e where e.id = ?1 and (e.deleted is null or ?2 = true)")
    fun findById(id: String, includeDeleted: Boolean): Optional<T>

    @Transactional(readOnly = true)
    override fun findById(id: String): Optional<T> = findById(id, includeDeleted = false)

    @Query("select e from #{#entityName} e where e.deleted is not null")
    @Transactional(readOnly = true)
    fun findDeleted(): List<T>

    @Transactional(readOnly = true)
    @Query("select count(e) from #{#entityName} e where (e.deleted is null or ?1 = true)")
    fun count(includeDeleted: Boolean = false): Long

    @Transactional(readOnly = true)
    override fun count(): Long = count(includeDeleted = false)

    @Query(
        """
        delete from #{#entityName} e where e.id = ?1
        """,
    )
    @Transactional
    @Modifying
    fun finalDeleteById(id: String)

    @Query(
        """
        update #{#entityName} e set e.deleted=?2 where e.id = ?1 and e.deleted is null
        """,
    )
    @Transactional
    @Modifying
    fun deleteById(id: String, now: Instant = Instant.now())

    @Transactional
    override fun deleteById(id: String) {
        deleteById(id, Instant.now())
    }

    @Transactional
    override fun delete(entity: T) {
        deleteById(entity.id)
    }

    @Query(
        """
        update #{#entityName} e set e.deleted=?2 where e.id in ?1 and e.deleted is null
        """,
    )
    @Transactional
    @Modifying
    fun deleteAllById(ids: Iterable<String>, now: Instant = Instant.now())

    @Query("update #{#entityName} e set e.deleted=?1 where e.deleted is null")
    @Transactional
    @Modifying
    fun deleteAll(now: Instant = Instant.now())

    @Query("update #{#entityName} e set e.deleted=null where e.id = ?1 and e.deleted is not null")
    @Transactional
    @Modifying
    fun undeleteById(id: String)
}

class SoftDeleteEntityListener {
    @PreUpdate
    fun preUpdate(entity: Any) {
        if ((entity as ISoftDeleteEntity).deleted != null) {
            throw NotFoundException("Entity deleted")
        }
    }
}
