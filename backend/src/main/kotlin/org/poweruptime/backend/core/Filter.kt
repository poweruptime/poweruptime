package org.poweruptime.backend.core

import jakarta.persistence.criteria.*

enum class FilterCompare {
    EQ,
    NOT_EQUAL_TO,
    IS_NULL,
    NOT_NULL,
    LIKE,
    IN,
}

enum class FilterPredicates {
    AND,
    OR
}

class Filter<T>(
    val columnName: String,
    val columnValue: T?,
    val compareOption: FilterCompare,
)

fun <T> Filter<*>.toPredicate(root: Root<T>, criteriaBuilder: CriteriaBuilder): Predicate {
    val filter = this
    // Get Hibernate ORM path
    val path = filter.columnName.split('.').fold(root as Path<*>) { current, step ->
        current.get<Comparable<*>>(step)
    }

    // This allows to apply multiple filters chained via OR on the same column
    return when (filter.compareOption) {
        FilterCompare.EQ -> criteriaBuilder.equal(path, filter.columnValue)
        FilterCompare.NOT_EQUAL_TO -> criteriaBuilder.notEqual(
            path,
            (filter.columnValue!! as String)
                .split('.')
                .fold(root as Path<*>) { current, step -> current.get<Comparable<*>>(step) },
        )
        FilterCompare.IS_NULL -> criteriaBuilder.isNull(path)
        FilterCompare.NOT_NULL -> criteriaBuilder.isNotNull(path)
        FilterCompare.LIKE -> {
            val pathAsString = path.`as`(String::class.java)
            criteriaBuilder.like(
                criteriaBuilder.lower(pathAsString),
                "%${(filter.columnValue as String).lowercase()}%",
            )
        }
        FilterCompare.IN -> criteriaBuilder.`in`(path).apply {
            (filter.columnValue as List<*>).forEach { value(it) }
        }
    }
}

fun <T> List<Filter<*>>.toPredicate(root: Root<T>, criteriaBuilder: CriteriaBuilder): List<Predicate> =
    map { it.toPredicate(root, criteriaBuilder) }

fun Boolean.toDeletedFilter(): Filter<String> = if (this) {
    Filter("deleted", "", FilterCompare.NOT_NULL)
} else {
    Filter("deleted", "", FilterCompare.IS_NULL)
}
