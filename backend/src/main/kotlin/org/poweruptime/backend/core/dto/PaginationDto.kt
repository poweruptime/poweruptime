package org.poweruptime.backend.core.dto

import com.fasterxml.jackson.annotation.JsonIgnore
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.Validator
import jakarta.validation.constraints.Min
import org.jetbrains.exposed.v1.core.SortOrder
import org.poweruptime.backend.core.domain.Page
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.springframework.core.MethodParameter
import org.springframework.stereotype.Component
import org.springframework.web.bind.support.WebDataBinderFactory
import org.springframework.web.context.request.NativeWebRequest
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.method.support.ModelAndViewContainer

@Component
class PageableArgumentResolver(private val validator: Validator) : HandlerMethodArgumentResolver {
    override fun supportsParameter(parameter: MethodParameter): Boolean =
        parameter.parameterType == Pageable::class.java

    override fun resolveArgument(
        parameter: MethodParameter,
        mavContainer: ModelAndViewContainer?,
        webRequest: NativeWebRequest,
        binderFactory: WebDataBinderFactory?,
    ): Pageable {
        val pageNumber = webRequest.getParameter("page")?.toIntOrNull() ?: 0
        val pageSize = webRequest.getParameter("size")?.toIntOrNull() ?: 10
        val sort = webRequest.getParameterValues("sort")?.toList()

        val pageable = Pageable(pageNumber, pageSize, sort)

        // Validate
        val violations = validator.validate(pageable)

        require(violations.isEmpty()) {
            violations.joinToString(", ") { it.message }
        }

        return pageable
    }
}

data class Pageable(
    @Schema(
        name = "page",
        description = " Zero-based page index (0..N)",
        example = "0",
        defaultValue = "0",
    )
    @get:Min(0)
    val pageNumber: Int = 0,
    @Schema(
        name = "size",
        description = "The size of the page to be returned",
        example = "10",
        defaultValue = "10",
    )
    @get:Min(1)
    val pageSize: Int = 10,
    @Schema(
        name = "sort",
        description = "Sorting criteria in the format: property,(asc|desc). Default sort order is ascending. " +
            "Multiple sort criteria are supported.",
    )
    val sort: List<String>? = null,
) {
    @JsonIgnore
    val offset: Long = (pageNumber.toLong()) * pageSize.toLong()

    @JsonIgnore
    fun getSortOrders(): List<Sort> = sort
        ?.mapNotNull { sortString ->
            try {
                Sort.parse(sortString)
            } catch (e: BadRequestException) {
                throw BadRequestException(
                    "Invalid sort parameter: '$sortString'. " +
                        "Expected format: 'property_direction' (e.g., 'name_asc'). " +
                        "Original error: ${e.message}",
                )
            }
        }.orEmpty()
}

data class Sort(val property: String, val sortOrder: SortOrder) {
    companion object {
        private val VALID_DIRECTIONS = setOf("asc", "desc")

        fun parse(sortString: String): Sort? {
            if (sortString.isBlank()) return null

            val parts = sortString.split("_").map { it.trim() }

            // Validate format
            if (parts.size > 2) {
                throw BadRequestException(
                    "Invalid sort format: '$sortString'. " +
                        "Expected format: 'property' or 'property_direction'",
                )
            }

            val property = parts[0]
            if (property.isBlank()) {
                throw BadRequestException(
                    "Sort property cannot be empty",
                )
            }

            // Check if property looks like a direction (common mistake)
            if (property.lowercase() in VALID_DIRECTIONS) {
                throw BadRequestException(
                    "Invalid sort format. Did you mean to use 'propertyName,$property'? " +
                        "Each sort parameter must be in format 'property,direction'",
                )
            }

            val direction = parts.getOrNull(1)?.lowercase() ?: "asc"

            if (direction !in VALID_DIRECTIONS) {
                throw BadRequestException(
                    "Invalid sort direction: '$direction'. Must be 'asc' or 'desc'",
                )
            }

            return Sort(
                property = property,
                sortOrder = when (direction) {
                    "asc" -> SortOrder.ASC
                    "desc" -> SortOrder.DESC
                    else -> throw BadRequestException(
                        "Invalid sort direction: '$direction'. Must be 'asc' or 'desc'",
                    )
                },
            )
        }
    }
}

data class PaginatedResponse<T>(val numberOfItems: Long, val numberOfPages: Int, val data: List<T>)

fun <T : Any, U> Page<T>.toDto(map: (it: T) -> U) = PaginatedResponse(
    numberOfItems = totalElements,
    numberOfPages = getTotalPages(),
    data = content.map(map),
)
