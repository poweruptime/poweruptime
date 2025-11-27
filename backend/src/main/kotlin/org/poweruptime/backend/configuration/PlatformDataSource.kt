package org.poweruptime.backend.configuration

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.github.oshai.kotlinlogging.KotlinLogging
import org.jetbrains.exposed.v1.spring.transaction.SpringTransactionManager
import org.poweruptime.backend.core.utils.Config
import org.springframework.beans.factory.annotation.Value
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
    fun dataSource(
        @Value(Config.DATASOURCE_DRIVER_CLASS_NAME) dataSourceDriverClassName: String?,
        @Value(Config.DATASOURCE_URL) url: String,
        @Value(Config.DATASOURCE_USERNAME) dataSourceUsername: String,
        @Value(Config.DATASOURCE_PASSWORD) dataSourcePassword: String,
    ): PlatformDataSource = HikariDataSource(
        HikariConfig().apply {
            jdbcUrl = url
            username = dataSourceUsername
            password = dataSourcePassword
            driverClassName = dataSourceDriverClassName
            poolName = "poweruptimePool"
            maximumPoolSize = 10
            minimumIdle = 5
        },
    )

    @Bean
    fun transactionManager(dataSource: PlatformDataSource): SpringTransactionManager =
        SpringTransactionManager(dataSource)
            .also {
                logger.info {
                    """SQL datasource: "${dataSource.toDetailsText()}""""
                }
            }

    @Bean // PersistenceExceptionTranslationPostProcessor with proxyTargetClass=false, see https://github.com/spring-projects/spring-boot/issues/1844
    fun persistenceExceptionTranslationPostProcessor() = PersistenceExceptionTranslationPostProcessor()
}

private fun PlatformDataSource.toDetailsText(): String =
    "user: $username url: $jdbcUrl pool: $poolName maxPoolSize: $maximumPoolSize minIdle: $minimumIdle"
