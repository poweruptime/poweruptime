package org.poweruptime.backend.core.models

import com.fasterxml.jackson.annotation.JsonIgnore
import jakarta.persistence.Column
import jakarta.persistence.EntityListeners
import jakarta.persistence.MappedSuperclass
import jakarta.persistence.Version
import org.hibernate.Hibernate
import org.hibernate.annotations.ColumnDefault
import org.hibernate.annotations.CreationTimestamp
import org.hibernate.annotations.UpdateTimestamp
import org.poweruptime.backend.core.domain.SoftDeleteEntityListener
import java.time.Instant
import java.util.*

@MappedSuperclass
abstract class AEntity : Timestamps(), IEntity {
    @JsonIgnore
    @ColumnDefault("0")
    @Version
    override var version: Long = 0

    override fun hashCode(): Int {
        return Objects.hash(id)
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other == null || Hibernate.getClass(this) != Hibernate.getClass(other)) return false
        other as IEntity

        return id == other.id
    }

    /**
     * Update an entity without changing its data
     */
    override fun touch() {
        updatedAt = Instant.now()
    }

    override fun toString(): String {
        return """Id: "$id""""
    }
}

@MappedSuperclass
abstract class Timestamps : ITimestamp {
    @JsonIgnore
    @CreationTimestamp
    @ColumnDefault("now()")
    @Column(name = "created_at", columnDefinition = "timestamptz", nullable = false, updatable = false)
    override lateinit var createdAt: Instant

    @JsonIgnore
    @UpdateTimestamp
    @ColumnDefault("now()")
    @Column(name = "updated_at", columnDefinition = "timestamptz", nullable = false)
    override lateinit var updatedAt: Instant
}

@MappedSuperclass
@EntityListeners(SoftDeleteEntityListener::class)
abstract class ASoftDeleteEntity : AEntity(), ISoftDeleteEntity {
    @JsonIgnore
    @Column(name = "deleted", columnDefinition = "timestamptz", nullable = true)
    override var deleted: Instant? = null

    @JsonIgnore
    override fun isDeleted() = deleted != null
}
