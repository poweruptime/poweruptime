package org.poweruptime.backend.core

import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import kotlin.reflect.KClass

class ListItemRegexValidator : ConstraintValidator<ListItemRegex, List<String>> {
    private lateinit var regex: Regex

    override fun initialize(constraint: ListItemRegex) {
        // compile once
        regex = constraint.pattern.toRegex()
    }

    override fun isValid(value: List<String>?, context: ConstraintValidatorContext): Boolean {
        // null → leave it to @NotNull if you annotate that too
        if (value == null) return true
        return value.all { regex.matches(it) }
    }
}

/**
 * Validates that each element of a List<String> matches the given regex.
 *
 * Usage:
 *   @get:ListItemRegex("^\\d{3}\\s*-\\s*\\d{3}\$")
 *   val ranges: List<String>
 */
@Target(
    AnnotationTarget.FIELD,
    AnnotationTarget.PROPERTY_GETTER,
    AnnotationTarget.VALUE_PARAMETER,
    AnnotationTarget.ANNOTATION_CLASS,
)
@Retention(AnnotationRetention.RUNTIME)
@MustBeDocumented
@Constraint(validatedBy = [ListItemRegexValidator::class])
annotation class ListItemRegex(
    /**
     * The regex each element must match
     */
    val pattern: String,
    /**
     * Validation message. You can refer to "{pattern}" in your interpolation.
     */
    val message: String = "Each element must match regex \"{pattern}\"",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = [],
)
