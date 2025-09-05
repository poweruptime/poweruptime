package org.poweruptime.backend.configuration

import com.zaxxer.hikari.HikariDataSource
import io.github.oshai.kotlinlogging.KotlinLogging
import org.jetbrains.exposed.v1.spring.transaction.SpringTransactionManager
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.dao.annotation.PersistenceExceptionTranslationPostProcessor
import org.springframework.transaction.annotation.EnableTransactionManagement

private typealias PlatformDataSource = HikariDataSource

@Configuration
@EnableTransactionManagement
class Exposed {

    private final val logger = KotlinLogging.logger {}

    @Bean
    fun transactionManager(dataSource: PlatformDataSource): SpringTransactionManager =
        SpringTransactionManager(dataSource)
            .also {
                logger.info {
                    "=== USE SQL datasource ${dataSource.toDetailsText()}"
                }
            }

    @Bean // PersistenceExceptionTranslationPostProcessor with proxyTargetClass=false, see https://github.com/spring-projects/spring-boot/issues/1844
    fun persistenceExceptionTranslationPostProcessor() = PersistenceExceptionTranslationPostProcessor()
}

private fun PlatformDataSource.toDetailsText(): String =
    "user: $username url: $jdbcUrl pool: $poolName maxPoolSize: $maximumPoolSize minIdle: $minimumIdle"
