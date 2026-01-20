@file:Suppress("TooManyFunctions")

package org.poweruptime.backend.core.domain

import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.dao.id.IdTable
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.core.isNotNull
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.poweruptime.backend.core.models.HasPublicId
import org.poweruptime.backend.core.models.HasSoftDelete
import java.time.Instant
import kotlin.jvm.javaClass

fun <IdType : Any, TableType> TableType.existsById(
    idValue: IdType,
    includeDeleted: Boolean = false,
): Boolean where TableType : IdTable<IdType>, TableType : HasSoftDelete = !selectAll()
    .where {
        id eq idValue and if (includeDeleted) {
            deleted.isNotNull()
        } else {
            deleted.isNull()
        }
    }.empty()

fun <IdType : Any, TableType, X> TableType.findAll(
    includeDeleted: Boolean = false,
    rowToRecordConverter: RowToRecordConverter<X>,
): List<X> where TableType : IdTable<IdType>, TableType : HasSoftDelete = selectAll()
    .where {
        if (includeDeleted) {
            deleted.isNotNull()
        } else {
            deleted.isNull()
        }
    }.map { rowToRecordConverter(it) }

fun <IdType : Any, TableType, X> TableType.findById(
    ids: Iterable<IdType>,
    includeDeleted: Boolean = false,
    rowToRecordConverter: RowToRecordConverter<X>,
): List<X> where TableType : IdTable<IdType>, TableType : HasSoftDelete = selectAll()
    .where {
        id inList ids and
            if (includeDeleted) {
                deleted.isNotNull()
            } else {
                deleted.isNull()
            }
    }.map { rowToRecordConverter(it) }

fun <IdType : Any, TableType, X> TableType.findById(
    idValue: IdType,
    includeDeleted: Boolean = false,
    rowToRecordConverter: RowToRecordConverter<X>,
): X? where TableType : IdTable<IdType>, TableType : HasSoftDelete = selectAll()
    .where {
        id eq idValue and if (includeDeleted) {
            deleted.isNotNull()
        } else {
            deleted.isNull()
        }
    }.limit(1)
    .firstOrNull()
    ?.let {
        rowToRecordConverter(it)
    }

fun <IdType : Any, TableType> TableType.count(
    includeDeleted: Boolean = false,
): Long where TableType : IdTable<IdType>, TableType : HasSoftDelete = selectAll()
    .where {
        if (includeDeleted) {
            deleted.isNotNull()
        } else {
            deleted.isNull()
        }
    }.count()

fun <IdType : Any, TableType> TableType.deleteById(
    idValue: IdType,
    now: Instant = Instant.now(),
): Int where TableType : IdTable<IdType>, TableType : HasSoftDelete = update({ id eq idValue and deleted.isNull() }) {
    it[deleted] = now
}

fun <IdType : Any, TableType> TableType.deleteById(
    ids: Iterable<IdType>,
    now: Instant = Instant.now(),
): Int where TableType : IdTable<IdType>, TableType : HasSoftDelete = update({ id inList ids and deleted.isNull() }) {
    it[deleted] = now
}

fun <IdType : Any, TableType> TableType.deleteAll(
    now: Instant = Instant.now(),
): Int where TableType : IdTable<IdType>, TableType : HasSoftDelete = update({
    deleted.isNull()
}) {
    it[deleted] = now
}

fun <IdType : Any, TableType, X> TableType.findByIdOrThrow(
    id: IdType,
    includeDeleted: Boolean = false,
    rowToRecordConverter: RowToRecordConverter<X>,
): X where TableType : IdTable<IdType>, TableType : HasSoftDelete = findById(id, includeDeleted, rowToRecordConverter)
    ?: throw NotFoundException("""${javaClass.simpleName} not found""")

fun <IdType : Any, TableType, X> TableType.findByIdOrThrow(
    ids: List<IdType>,
    rowToRecordConverter: RowToRecordConverter<X>,
    includeDeleted: Boolean = false,
): List<X> where TableType : IdTable<IdType>, TableType : HasSoftDelete {
    val entities = findById(ids, includeDeleted, rowToRecordConverter)
    if (entities.size != ids.size) {
        throw NotFoundException()
    }
    return entities
}

fun <IdType : Any, TableType> TableType.finalDeleteById(
    idValue: IdType,
): Int where TableType : IdTable<IdType>, TableType : HasSoftDelete = deleteWhere {
    id eq idValue
}

fun <IdType : Any, TableType> TableType.undeleteById(
    idValue: IdType,
): Int where TableType : IdTable<IdType>, TableType : HasSoftDelete = update(
    { id eq idValue and deleted.isNotNull() },
) {
    it[deleted] = null
}

// Public ID
fun <TableType, X> TableType.findByPublicId(
    publicIdValue: String,
    includeDeleted: Boolean = false,
    rowToRecordConverter: RowToRecordConverter<X>,
): X? where TableType : Table, TableType : HasPublicId, TableType : HasSoftDelete = selectAll()
    .where {
        publicId eq publicIdValue and if (includeDeleted) {
            deleted.isNotNull()
        } else {
            deleted.isNull()
        }
    }.limit(1)
    .firstOrNull()
    ?.let {
        rowToRecordConverter(it)
    }

fun <TableType, X> TableType.findByPublicId(
    publicIdValue: List<String>,
    includeDeleted: Boolean = false,
    rowToRecordConverter: RowToRecordConverter<X>,
): List<X> where TableType : Table, TableType : HasPublicId, TableType : HasSoftDelete = selectAll()
    .where {
        publicId inList publicIdValue and if (includeDeleted) {
            deleted.isNotNull()
        } else {
            deleted.isNull()
        }
    }.map {
        rowToRecordConverter(it)
    }

fun <TableType, X> TableType.findByPublicIdOrThrow(
    publicId: String,
    includeDeleted: Boolean = false,
    rowToRecordConverter: RowToRecordConverter<X>,
): X where TableType : Table, TableType : HasPublicId, TableType : HasSoftDelete = findByPublicId(
    publicId,
    includeDeleted,
    rowToRecordConverter,
) ?: throw NotFoundException("""${javaClass.simpleName} not found""")

fun <TableType, X> TableType.findIdByPublicId(
    publicIdValue: String,
    includeDeleted: Boolean = false,
): X? where TableType : IdTable<X>, TableType : HasPublicId, TableType : HasSoftDelete = select(id)
    .where {
        publicId eq publicIdValue and if (includeDeleted) {
            deleted.isNotNull()
        } else {
            deleted.isNull()
        }
    }.limit(1)
    .firstOrNull()
    ?.let {
        it[id].value
    }

fun <TableType, X> TableType.findIdByPublicIdOrThrow(
    publicId: String,
    includeDeleted: Boolean = false,
): X where TableType : IdTable<X>, TableType : HasPublicId, TableType : HasSoftDelete =
    findIdByPublicId(publicId, includeDeleted) ?: throw NotFoundException("""${javaClass.simpleName} not found""")

fun <TableType, X> TableType.findIdsByPublicIds(
    publicIds: Iterable<String>,
    includeDeleted: Boolean = false,
): List<X> where TableType : IdTable<X>, TableType : HasPublicId, TableType : HasSoftDelete = select(id)
    .where {
        publicId inList publicIds and if (includeDeleted) {
            deleted.isNotNull()
        } else {
            deleted.isNull()
        }
    }.map {
        it[id].value
    }

fun <TableType, X> TableType.findIdsByPublicIdsOrThrow(
    publicIds: List<String>,
    includeDeleted: Boolean = false,
): List<X> where TableType : IdTable<X>, TableType : HasPublicId, TableType : HasSoftDelete {
    val ids = findIdsByPublicIds(publicIds, includeDeleted)

    if (ids.size != publicIds.size) {
        throw NotFoundException("${javaClass.simpleName} not found")
    }
    return ids
}
