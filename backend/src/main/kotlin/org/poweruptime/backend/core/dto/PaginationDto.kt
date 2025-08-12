package org.poweruptime.backend.core.dto

import org.poweruptime.backend.core.exceptions.BadRequestException
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

data class PaginatedResponse<T>(
    val numberOfItems: Long,
    val numberOfPages: Int,
    val data: List<T>
)

object PageableValidator {
    fun validateSort(pageable: Pageable, allowedSortParameter: List<String>): Pageable {
        val sortPropertiesNotInAllowedSortParameter = pageable.sort.filter { it.property !in allowedSortParameter }
        if (!sortPropertiesNotInAllowedSortParameter.isEmpty) {
            throw BadRequestException(
                """Sort parameter(s) "${sortPropertiesNotInAllowedSortParameter.joinToString(", ")}" not found""",
            )
        }

        return pageable
    }
}

fun Pageable.validateSort(vararg allowedSortParameters: String): Pageable {
    val allowed = allowedSortParameters.toList()
    val sortParametersNotAllowed = sort.filter { it.property !in allowed }

    if (!sortParametersNotAllowed.isEmpty) {
        throw BadRequestException(
            """Sort parameter(s) "${sortParametersNotAllowed.joinToString(", ")}" not found""",
        )
    }

    return this
}

fun <T, U> Page<T>.toDto(map: (it: T) -> U) = PaginatedResponse(
    numberOfItems = totalElements,
    numberOfPages = totalPages,
    data = content.map(map),
)
