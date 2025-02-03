package org.poweruptime.backend.core

import org.poweruptime.backend.configuration.puObjectMapper
import org.poweruptime.backend.core.dto.IdResponse
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.annotation.DirtiesContext
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.test.web.servlet.MvcResult
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.containers.RabbitMQContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.lifecycle.Startables

/***
 * Context and Containers will be reused until one test class in between which inherits from [BaseTest].
 * In this case the context gets "dirtied" and the reusing functionality needs to be recreated as well
 */
@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
)
@AutoConfigureMockMvc
@Testcontainers
abstract class BaseTestWithReusingContainers {
    companion object {
        @JvmStatic
        private val postgresDBContainer = PostgreSQLContainer("postgres:16.2-bookworm")
            .withReuse(true)

        @JvmStatic
        private val rabbitMQContainer = RabbitMQContainer("rabbitmq:3.13.1-management")
            .withReuse(true)

        @DynamicPropertySource
        @JvmStatic
        fun registerDynamicProperties(registry: DynamicPropertyRegistry) {
            Startables.deepStart(postgresDBContainer, rabbitMQContainer).join()

            registry.add("spring.datasource.url", postgresDBContainer::getJdbcUrl)
            registry.add("spring.datasource.username", postgresDBContainer::getUsername)
            registry.add("spring.datasource.password", postgresDBContainer::getUsername)

            registry.add("spring.rabbitmq.host", rabbitMQContainer::getHost)
            registry.add("spring.rabbitmq.port", rabbitMQContainer::getFirstMappedPort)
            registry.add("spring.rabbitmq.username", rabbitMQContainer::getAdminUsername)
            registry.add("spring.rabbitmq.password", rabbitMQContainer::getAdminPassword)
        }
    }

    fun MvcResult.toIdResponse(): IdResponse = toDto(IdResponse::class.java)

    // Extension function to map the content of MvcResult using the object mapper
    fun <T : Any> MvcResult.toDto(clazz: Class<T>): T = puObjectMapper.readValue(response.contentAsByteArray, clazz)
}

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
)
@AutoConfigureMockMvc
@Testcontainers
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
abstract class BaseTest protected constructor() {

    companion object {
        @Container
        @JvmStatic
        private val postgresDBContainer = PostgreSQLContainer("postgres:16.2-bookworm")

        @Container
        @JvmStatic
        private val rabbitMQContainer = RabbitMQContainer("rabbitmq:management")

        @DynamicPropertySource
        @JvmStatic
        fun registerDynamicProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgresDBContainer::getJdbcUrl)
            registry.add("spring.datasource.username", postgresDBContainer::getUsername)
            registry.add("spring.datasource.password", postgresDBContainer::getUsername)

            registry.add("spring.rabbitmq.host", rabbitMQContainer::getHost)
            registry.add("spring.rabbitmq.port", rabbitMQContainer::getFirstMappedPort)
            registry.add("spring.rabbitmq.username", rabbitMQContainer::getAdminUsername)
            registry.add("spring.rabbitmq.password", rabbitMQContainer::getAdminPassword)
        }
    }
}
