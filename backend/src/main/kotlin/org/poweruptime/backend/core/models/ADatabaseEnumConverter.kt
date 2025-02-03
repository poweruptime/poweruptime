package org.poweruptime.backend.core.models

import jakarta.persistence.AttributeConverter

interface ADatabaseEnumConvertable {
    val code: String
}

@Suppress("com.haulmont.jpb.ConverterNotAnnotatedInspection")
abstract class ADatabaseEnumConverter<T : ADatabaseEnumConvertable> : AttributeConverter<T, String> {
    abstract fun getKeys(): Array<T>

    override fun convertToDatabaseColumn(it: T?): String? = it?.code

    override fun convertToEntityAttribute(code: String?): T? =
        if (code == null) {
            null
        } else {
            getKeys().firstOrNull { c -> c.code == code }
                ?: throw IllegalArgumentException("Enum does not have member with code '$code'")
        }
}
