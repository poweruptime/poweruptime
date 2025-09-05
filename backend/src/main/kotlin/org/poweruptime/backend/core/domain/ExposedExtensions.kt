package org.poweruptime.backend.core.domain

import org.jetbrains.exposed.v1.core.Column
import org.jetbrains.exposed.v1.core.Expression
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.SortOrder
import org.jetbrains.exposed.v1.core.SqlExpressionBuilder.isNotNull
import org.jetbrains.exposed.v1.core.SqlExpressionBuilder.isNull
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.jdbc.Query
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort
import java.time.Instant
import kotlin.math.ceil

fun Column<Instant?>.deletedFilter(deleted: Boolean) = if (deleted) this.isNotNull() else this.isNull()
fun Column<Instant?>.includeDeleted(
    includeDeleted: Boolean
) = if (includeDeleted) this.isNull() or this.isNotNull() else this.isNull()

typealias RowToRecordConverter<T> = (it: ResultRow) -> T

fun <U> pageQuery(
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

    return PageImpl(
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
    return orderBy(
        *pageable.sort.mapNotNull { order ->
            (
                sortMapper(order.property) ?: throw BadRequestException(
                    """Sort parameter "${order.property}" not found""",
                )
                ).let { col ->
                col to if (order.isAscending) SortOrder.ASC else SortOrder.DESC
            }
        }.toTypedArray(),
    )
}

@Suppress("TooManyFunctions")
class PageImpl<T>(
    private val content: List<T>,
    private val pageable: Pageable = Pageable.unpaged(),
    total: Long
) : Page<T> {
    private val totalElements: Long = calculateTotalElements(content, pageable, total)

    override fun getTotalPages(): Int =
        if (size == 0) 1 else ceil(totalElements.toDouble() / size).toInt()

    override fun getTotalElements(): Long = totalElements

    override fun <U : Any?> map(converter: java.util.function.Function<in T, out U?>): Page<U?> {
        val converted = content.map(converter::apply)
        return PageImpl(
            converted,
            pageable,
            totalElements,
        )
    }

    override fun hasNext(): Boolean = number + 1 < totalPages

    override fun hasPrevious(): Boolean = number > 0

    override fun nextPageable(): Pageable =
        if (hasNext()) pageable.next() else Pageable.unpaged()

    override fun previousPageable(): Pageable =
        if (hasPrevious()) pageable.previousOrFirst() else Pageable.unpaged()

    override fun getNumber(): Int = pageable.pageNumber

    override fun getSize(): Int = pageable.pageSize

    override fun getNumberOfElements(): Int = content.size

    override fun getContent(): List<T> = content

    override fun hasContent(): Boolean = content.isNotEmpty()

    override fun getSort(): Sort = pageable.sort

    override fun isFirst(): Boolean = !hasPrevious()

    override fun isLast(): Boolean = !hasNext()

    override fun iterator(): MutableIterator<T> = content.toMutableList().iterator()

    override fun toString(): String {
        val contentType =
            content.firstOrNull()?.let { it::class.qualifiedName } ?: "UNKNOWN"
        return "Page ${number + 1} of $totalPages containing $contentType instances"
    }

    override fun equals(other: Any?): Boolean =
        this === other ||
            (
                other is PageImpl<*> &&
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
        ): Long =
            pageable.toOptional()
                .filter { content.isNotEmpty() }
                .filter { it.offset + it.pageSize > total }
                .map { it.offset + content.size.toLong() }
                .orElse(total)
    }
}
