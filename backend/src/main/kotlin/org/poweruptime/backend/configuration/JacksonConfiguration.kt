package org.poweruptime.backend.configuration

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.databind.json.JsonMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.jacksonMapperBuilder
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary

val puObjectMapper: JsonMapper = jacksonMapperBuilder()
    .addModule(JavaTimeModule())
    .serializationInclusion(JsonInclude.Include.NON_NULL)
    // Write instants as string
    .configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)
    // Ignore unknown json properties
    .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
    // Fail if null is passed for int or double value
    .configure(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES, true)
    // Fail if number is used as enum instead of String name
    .configure(DeserializationFeature.FAIL_ON_NUMBERS_FOR_ENUMS, true)
    // Fail if generic subtype can't be deserialized
    .configure(DeserializationFeature.FAIL_ON_INVALID_SUBTYPE, true) // defaults to true
    // Fail if generic subtype can't be deserialized
    .configure(DeserializationFeature.FAIL_ON_MISSING_EXTERNAL_TYPE_ID_PROPERTY, true) // defaults to true
    .build()

@Configuration
open class JacksonConfiguration {
    @Bean
    @Primary
    open fun objectMapper(): ObjectMapper = puObjectMapper
}

fun Any.toJSON(): String = puObjectMapper.writeValueAsString(this)
