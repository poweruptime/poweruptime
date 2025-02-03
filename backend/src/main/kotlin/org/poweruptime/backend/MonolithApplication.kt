package org.poweruptime.backend

import org.poweruptime.backend.configuration.HttpExceptionHandler
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.domain.EntityScan
import org.springframework.boot.runApplication
import org.springframework.context.annotation.Import
import org.springframework.data.jpa.repository.config.EnableJpaRepositories
import org.springframework.retry.annotation.EnableRetry
import java.util.*

@Suppress("UtilityClassWithPublicConstructor")
@SpringBootApplication
@EntityScan("org.poweruptime.backend.*")
@EnableJpaRepositories("org.poweruptime.backend.*")
@EnableRetry
@Import(HttpExceptionHandler::class)
open class MonolithApplication {
    companion object {
        @JvmStatic
        @Suppress("SpreadOperator")
        fun main(args: Array<String>) {
            TimeZone.setDefault(TimeZone.getTimeZone("UTC"))
            runApplication<MonolithApplication>(*args)
        }
    }
}
