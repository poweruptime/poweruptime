package org.poweruptime.backend.configuration

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.DeserializationFeature
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.databind.deser.std.StdDeserializer
import com.fasterxml.jackson.databind.deser.std.StringDeserializer
import com.fasterxml.jackson.databind.module.SimpleModule
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.jacksonMapperBuilder

private val blankStringToNullDeserializerModule = SimpleModule().apply {
    addDeserializer(
        String::class.java,
        object : StdDeserializer<String>(String::class.java) {
            override fun deserialize(p: JsonParser, ctxt: DeserializationContext): String? {
                val result = StringDeserializer.instance.deserialize(p, ctxt)
                return if (result.isNullOrBlank()) null else result
            }
        },
    )
}

@Deprecated("remove on update of io.swagger.v3")
val puObjectMapperV2: ObjectMapper = jacksonMapperBuilder()
    .addModule(JavaTimeModule())
    .addModule(blankStringToNullDeserializerModule)
    .serializationInclusion(JsonInclude.Include.ALWAYS)
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
