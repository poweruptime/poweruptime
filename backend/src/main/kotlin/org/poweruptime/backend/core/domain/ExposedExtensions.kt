package org.poweruptime.backend.core.domain

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import org.jetbrains.exposed.v1.core.Column
import org.jetbrains.exposed.v1.core.Expression
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.isNotNull
import org.jetbrains.exposed.v1.core.isNull
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.jdbc.Query
import org.jetbrains.exposed.v1.jdbc.transactions.suspendTransaction
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.core.exceptions.BadRequestException
import java.time.Instant
import java.util.function.Function
import kotlin.math.ceil

fun Column<Instant?>.deletedFilter(deleted: Boolean) = if (deleted) this.isNotNull() else this.isNull()
fun Column<Instant?>.includeDeleted(
    includeDeleted: Boolean
) = if (includeDeleted) this.isNull() or this.isNotNull() else this.isNull()

typealias RowToRecordConverter<T> = (it: ResultRow) -> T

fun <U : Any> pageQuery(
    query: Query,
    pageable: Pageable,
    sort: (String) -> Column<*>?,
    map: (ResultRow) -> U,
): Page<U> {
    val total = query.count()

    val content = query
        .sortBy(pageable, sort)
        .paginate(pageable)
        .map(map)

    return Page(
        content = content,
        pageable = pageable,
        total = total,
    )
}

suspend fun <U : Any> pageQueryA(
    pageable: Pageable,
    sort: (String) -> Column<*>?,
    map: (ResultRow) -> U,
    queryFn: () -> Query,
): Page<U> = coroutineScope {
    val totalDeferred = async(Dispatchers.IO) {
        suspendTransaction {
            queryFn().count()
        }
    }

    val contentDeferred = async(Dispatchers.IO) {
        suspendTransaction {
            queryFn()
                .sortBy(pageable, sort)
                .paginate(pageable)
                .map(map)
        }
    }

    val total = totalDeferred.await()
    val content = contentDeferred.await()

    Page(
        content = content,
        pageable = pageable,
        total = total,
    )
}

fun Query.paginate(pageable: Pageable): Query {
    return limit(pageable.pageSize).offset(pageable.offset)
}

@Suppress("SpreadOperator")
fun Query.sortBy(
    pageable: Pageable,
    sortMapper: (String) -> Expression<*>?,
): Query {
    val sortOrders = pageable.getSortOrders()

    if (sortOrders.isEmpty()) {
        return this
    }

    return orderBy(
        *sortOrders.map { order ->
            val column = sortMapper(order.property)
                ?: throw BadRequestException(
                    """Sort parameter "${order.property}" not found""",
                )
            column to order.sortOrder
        }.toTypedArray(),
    )
}

class Page<T : Any>(
    val content: List<T>,
    private val pageable: Pageable,
    total: Long
) {
    val totalElements: Long = calculateTotalElements(content, pageable, total)

    fun getTotalPages(): Int =
        if (pageable.pageSize == 0) 1 else ceil(totalElements.toDouble() / pageable.pageSize).toInt()

    fun <U : Any> map(converter: Function<in T, out U>): Page<U> {
        val converted = content.map(converter::apply)
        return Page(
            converted,
            pageable,
            totalElements,
        )
    }

    override fun toString(): String {
        val contentType =
            content.firstOrNull()?.let { it::class.qualifiedName } ?: "UNKNOWN"
        return "Page ${pageable.pageNumber + 1} of ${getTotalPages()} containing $contentType instances"
    }

    override fun equals(other: Any?): Boolean =
        this === other ||
            (
                other is Page<*> &&
                    totalElements == other.totalElements &&
                    content == other.content &&
                    pageable == other.pageable
                )

    override fun hashCode(): Int =
        arrayOf(totalElements, content, pageable).contentDeepHashCode()

    companion object {
        private fun calculateTotalElements(
            content: List<*>,
            pageable: Pageable,
            total: Long,
        ): Long = if (content.isEmpty() || pageable.offset + pageable.pageSize <= total) {
            total
        } else {
            pageable.offset + content.size.toLong()
        }
    }
}
