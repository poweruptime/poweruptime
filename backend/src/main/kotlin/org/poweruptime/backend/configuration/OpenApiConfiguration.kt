package org.poweruptime.backend.configuration

import io.swagger.v3.core.jackson.ModelResolver
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType
import io.swagger.v3.oas.annotations.security.SecurityScheme
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Contact
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.servers.Server
import org.springframework.boot.info.BuildProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
@SecurityScheme(
    name = BEARER_AUTH,
    type = SecuritySchemeType.HTTP,
    bearerFormat = "JWT",
    scheme = "bearer",
)
class OpenApiConfiguration(
    private val buildProperties: BuildProperties,
) {
    @Bean
    fun defineOpenApi(): OpenAPI = OpenAPI().info(
        Info().apply {
            title = "poweruptime API"
            version = buildProperties.version
            description = ""
            contact = Contact().apply {
                name = "poweruptime"
                url = "https://poweruptime.org"
            }
        },
    ).servers(
        listOf(
            Server().apply {
                url = "http://localhost:8080/api"
                description = "Development"
            },
        ),
    )

    // Swagger respects jackson object mapper.
    @Bean
    fun modelResolver(): ModelResolver = ModelResolver(puObjectMapperV2)
}

const val BEARER_AUTH = "bearerAuth"
