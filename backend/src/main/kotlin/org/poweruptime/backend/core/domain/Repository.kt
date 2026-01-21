@file:Suppress("TooManyFunctions")

package org.poweruptime.backend.core.domain

import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.dao.id.IdTable
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.inList
import org.jetbrains.exposed.v1.jdbc.deleteAll
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.poweruptime.backend.core.models.HasPublicId
import kotlin.jvm.javaClass

fun <IdType : Any> IdTable<IdType>.existsById(idValue: IdType): Boolean =
    !selectAll().where { id eq idValue }.limit(1).empty()

fun <IdType : Any> IdTable<IdType>.existsByIdOrThrow(idValue: IdType): IdType {
    if (selectAll().where { id eq idValue }.limit(1).empty()) {
        throw NotFoundException("${javaClass.simpleName} not found")
    }

    return idValue
}

fun <IdType : Any, X> IdTable<IdType>.findAll(rowToRecordConverter: RowToRecordConverter<X>): List<X> =
    selectAll().map { rowToRecordConverter(it) }

fun <IdType : Any, X> IdTable<IdType>.findById(
    ids: Iterable<IdType>,
    rowToRecordConverter: RowToRecordConverter<X>,
): List<X> = selectAll().where { id inList ids }.map { rowToRecordConverter(it) }

fun <IdType : Any, X> IdTable<IdType>.findById(idValue: IdType, rowToRecordConverter: RowToRecordConverter<X>): X? =
    selectAll().where { id eq idValue }.limit(1).firstOrNull()?.let {
        rowToRecordConverter(it)
    }

fun <IdType : Any, X> IdTable<IdType>.findByIdOrThrow(
    idValue: IdType,
    rowToRecordConverter: RowToRecordConverter<X>,
): X = findById(idValue, rowToRecordConverter) ?: throw NotFoundException("${javaClass.simpleName} not found")

fun <IdType : Any, X> IdTable<IdType>.findByIdOrThrow(
    ids: List<IdType>,
    rowToRecordConverter: RowToRecordConverter<X>,
): List<X> {
    val entities = findById(ids, rowToRecordConverter)
    if (entities.size != ids.size) {
        throw NotFoundException("${javaClass.simpleName} not found")
    }
    return entities
}

fun <IdType : Any> IdTable<IdType>.count(): Long = selectAll().count()

fun <IdType : Any> IdTable<IdType>.deleteById(idValue: IdType): Int = deleteWhere { id eq idValue }

fun <IdType : Any> IdTable<IdType>.deleteById(ids: Iterable<IdType>): Int = deleteWhere { id inList ids }

fun <IdType : Any> IdTable<IdType>.deleteAll(): Int = deleteAll()

// Public ID
fun <TableType, X> TableType.findByPublicId(
    publicIdValue: String,
    rowToRecordConverter: RowToRecordConverter<X>,
): X? where TableType : Table, TableType : HasPublicId = selectAll()
    .where {
        publicId eq publicIdValue
    }.limit(1)
    .firstOrNull()
    ?.let {
        rowToRecordConverter(it)
    }

fun <TableType, X> TableType.findByPublicId(
    publicIdValue: List<String>,
    rowToRecordConverter: RowToRecordConverter<X>,
): List<X> where TableType : Table, TableType : HasPublicId = selectAll()
    .where {
        publicId inList publicIdValue
    }.map {
        rowToRecordConverter(it)
    }

fun <TableType, X> TableType.findByPublicIdOrThrow(
    publicId: String,
    rowToRecordConverter: RowToRecordConverter<X>,
): X where TableType : Table, TableType : HasPublicId =
    findByPublicId(publicId, rowToRecordConverter) ?: throw NotFoundException("""${javaClass.simpleName} not found""")

fun <TableType, X> TableType.findIdByPublicId(
    publicIdValue: String,
): X? where TableType : IdTable<X>, TableType : HasPublicId = select(id)
    .where {
        publicId eq publicIdValue
    }.limit(1)
    .firstOrNull()
    ?.let {
        it[id].value
    }

fun <TableType, X> TableType.findIdByPublicIdOrThrow(
    publicId: String,
): X where TableType : IdTable<X>, TableType : HasPublicId =
    findIdByPublicId(publicId) ?: throw NotFoundException("""${javaClass.simpleName} not found""")

fun <TableType, X> TableType.findIdsByPublicIds(
    publicIds: Iterable<String>,
): List<X> where TableType : IdTable<X>, TableType : HasPublicId = select(id)
    .where {
        publicId inList publicIds
    }.map {
        it[id].value
    }

fun <TableType, X> TableType.findIdsByPublicIdsOrThrow(
    publicIds: List<String>,
): List<X> where TableType : IdTable<X>, TableType : HasPublicId {
    val ids = findIdsByPublicIds(publicIds)

    if (ids.size != publicIds.size) {
        throw NotFoundException("${javaClass.simpleName} not found")
    }
    return ids
}
