package org.poweruptime.backend.configuration

import com.fasterxml.jackson.annotation.JsonInclude
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import tools.jackson.core.JsonParser
import tools.jackson.databind.DeserializationContext
import tools.jackson.databind.ObjectMapper
import tools.jackson.databind.cfg.EnumFeature
import tools.jackson.databind.deser.jdk.StringDeserializer
import tools.jackson.databind.deser.std.StdDeserializer
import tools.jackson.databind.json.JsonMapper
import tools.jackson.databind.module.SimpleModule
import tools.jackson.module.kotlin.jacksonMapperBuilder

private val blankStringToNullDeserializerModule = SimpleModule().apply {
    addDeserializer(
        String::class.java,
        object : StdDeserializer<String>(String::class.java) {
            override fun deserialize(
                p: JsonParser,
                ctxt: DeserializationContext
            ): String? {
                val result = StringDeserializer.instance.deserialize(p, ctxt)
                return if (result.isNullOrBlank()) null else result
            }
        },
    )
}

val puObjectMapper: ObjectMapper = jacksonMapperBuilder()
    .addModule(blankStringToNullDeserializerModule)
    .changeDefaultPropertyInclusion {
        it.withValueInclusion(JsonInclude.Include.ALWAYS)
    }
    // Fail if number is used as enum instead of String name
    .configure(EnumFeature.FAIL_ON_NUMBERS_FOR_ENUMS, true)
    .build()

val puJsonMapper = puObjectMapper as JsonMapper

@Configuration
class JacksonConfiguration {
    @Bean
    fun objectMapper(): ObjectMapper = puObjectMapper

    @Bean
    @Primary
    fun jsonMapper(): JsonMapper = puJsonMapper
}

fun Any.toJSON(): String = puObjectMapper.writeValueAsString(this)
