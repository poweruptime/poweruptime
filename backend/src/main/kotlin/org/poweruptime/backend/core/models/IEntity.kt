package org.poweruptime.backend.core.models

import java.time.Instant

interface IHasID {
    var id: String
}

interface IEntity : ITimestamp, IHasID {
    var version: Long
    override fun hashCode(): Int
    override fun equals(other: Any?): Boolean
    fun touch()
}

interface ITimestamp {
    var createdAt: Instant
    var updatedAt: Instant
}

interface EntityWithName : IEntity {
    var name: String
}

interface ISoftDeleteEntity : IEntity {
    var deleted: Instant?
    fun isDeleted(): Boolean
}

interface HasPosition : IHasID {
    var position: Int?
}
