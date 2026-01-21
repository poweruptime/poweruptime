package org.poweruptime.backend.core.models

import org.jetbrains.exposed.v1.core.Column
import org.jetbrains.exposed.v1.core.Expression
import org.jetbrains.exposed.v1.core.QueryBuilder
import org.jetbrains.exposed.v1.core.Table
import org.jetbrains.exposed.v1.core.dao.id.EntityID
import org.jetbrains.exposed.v1.core.dao.id.IdTable
import org.jetbrains.exposed.v1.javatime.timestamp
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.RandomGenerator
import java.time.Instant

interface HasId {
    val id: Column<EntityID<ULong>>
}

interface HasName {
    val name: Column<String>
}

interface HasPublicId {
    val publicId: Column<String>
}

interface HasModifiers {
    val createdAt: Column<Instant>
    val updatedAt: Column<Instant>
}

interface HasSoftDelete {
    val deleted: Column<Instant?>
}

interface HasPosition {
    val position: Column<Int?>
}

private val nowExpression = object : Expression<Instant>() {
    override fun toQueryBuilder(queryBuilder: QueryBuilder) {
        queryBuilder.append("NOW()")
    }
}

fun Table.softDelete(name: String = "deleted"): Column<Instant?> = timestamp(name).nullable()

fun Table.createdAt(name: String = "created_at"): Column<Instant> =
    timestamp(name).clientDefault { Instant.now() }.defaultExpression(nowExpression)

fun Table.updatedAt(name: String = "updated_at"): Column<Instant> =
    timestamp(name).clientDefault { Instant.now() }.defaultExpression(nowExpression)

fun Table.nanoId(name: String, length: Int): Column<String> = varchar(name, length)
    .clientDefault { RandomGenerator.nanoId(length) }
    .uniqueIndex()

fun Table.name(
    name: String = "name",
    length: Int = Database.MAX_NAME_LENGTH,
    collation: String = Database.NUMERIC_COLLATION,
): Column<String> = varchar(name, length, collation)

fun Table.position(name: String = "position"): Column<Int?> = integer(name).nullable()

open class NanoIdTable(name: String, length: Int, columnName: String = "id") : IdTable<String>(name) {
    final override val id: Column<EntityID<String>> = varchar(columnName, length)
        .clientDefault { RandomGenerator.nanoId(length) }
        .entityId()
    final override val primaryKey = PrimaryKey(id)
}
