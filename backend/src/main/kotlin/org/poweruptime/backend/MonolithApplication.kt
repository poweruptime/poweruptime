package org.poweruptime.backend

import jakarta.annotation.PostConstruct
import org.poweruptime.backend.configuration.GlobalExceptionHandler
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.cache.annotation.EnableCaching
import org.springframework.context.annotation.Import
import org.springframework.retry.annotation.EnableRetry
import org.springframework.transaction.annotation.EnableTransactionManagement
import java.util.*

@SpringBootApplication
@EnableRetry
@EnableCaching
@EnableTransactionManagement
@Import(GlobalExceptionHandler::class)
class MonolithApplication {
    @PostConstruct
    fun starting() {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"))
    }
}
