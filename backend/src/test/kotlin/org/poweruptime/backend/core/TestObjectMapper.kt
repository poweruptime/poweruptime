package org.poweruptime.backend.core

import org.poweruptime.backend.configuration.puJsonMapper
import org.springframework.test.web.servlet.MvcResult
import tools.jackson.core.type.TypeReference
import java.lang.reflect.Type
import kotlin.reflect.KType
import kotlin.reflect.jvm.javaType
import kotlin.reflect.typeOf

// Extension function to map the content of MvcResult using the object mapper
inline fun <reified T : Any> MvcResult.toDto(): T = toDto(typeOf<T>())
fun <T : Any> MvcResult.toDto(kType: KType): T =
    puJsonMapper.readValue(this.response.contentAsByteArray, kType.toTypeReference())

/**
 * Converts [KType] (kotlin representation) to [TypeReference] (jackson representation)
 */
private fun <T : Any> KType.toTypeReference(): TypeReference<T> = object : TypeReference<T>() {
    override fun getType(): Type = this@toTypeReference.javaType
}
