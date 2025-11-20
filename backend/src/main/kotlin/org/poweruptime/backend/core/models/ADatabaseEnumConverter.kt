package org.poweruptime.backend.core.models

import org.jetbrains.exposed.v1.core.Column
import org.jetbrains.exposed.v1.core.ColumnType
import org.jetbrains.exposed.v1.core.Table

interface ADatabaseEnumConvertable {
    val code: String
}

inline fun <reified T> maxCodeLength(): Int
    where T : Enum<T>, T : ADatabaseEnumConvertable =
    enumValues<T>().maxOf { it.code.length }

inline fun <reified T> Table.enumerationByCode(
    name: String,
    maxCodeLength: Int = maxCodeLength<T>()
): Column<T>
    where T : Enum<T>, T : ADatabaseEnumConvertable {
    return registerColumn(name, EnumColumnType(maxCodeLength, enumValues<T>()))
}

/**
 * ColumnType implementation that handles enums implementing [ADatabaseEnumConvertable].
 */
class EnumColumnType<T>(
    private val length: Int,
    private val enumValues: Array<T>
) : ColumnType<T>()
    where T : Enum<T>, T : ADatabaseEnumConvertable {

    override fun sqlType(): String = "VARCHAR($length)"

    override fun notNullValueToDB(value: T): Any = value.code

    override fun valueFromDB(value: Any): T = when (value) {
        is String -> enumValues.firstOrNull { it.code == value }
            ?: error("Unknown enum code '$value'")
        else -> error(
            "Cannot convert ${value::class.qualifiedName} to enum",
        )
    }
}
