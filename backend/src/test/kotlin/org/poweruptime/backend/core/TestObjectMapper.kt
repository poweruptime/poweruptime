package org.poweruptime.backend.core

import com.fasterxml.jackson.core.type.TypeReference
import org.poweruptime.backend.configuration.puObjectMapper
import org.poweruptime.backend.core.dto.IdResponse
import org.springframework.test.web.servlet.MvcResult
import java.lang.reflect.Type
import kotlin.reflect.KType
import kotlin.reflect.jvm.javaType
import kotlin.reflect.typeOf

fun MvcResult.toIdResponse(): IdResponse = toDto<IdResponse>()

// Extension function to map the content of MvcResult using the object mapper
inline fun <reified T : Any> MvcResult.toDto(): T = toDto(typeOf<T>())
fun <T : Any> MvcResult.toDto(kType: KType): T =
    puObjectMapper.readValue(this.response.contentAsByteArray, kType.toTypeReference())

/**
 * Converts [KType] (kotlin representation) to [TypeReference] (jackson representation)
 */
private fun <T : Any> KType.toTypeReference(): TypeReference<T> = object : TypeReference<T>() {
    override fun getType(): Type = this@toTypeReference.javaType
}
