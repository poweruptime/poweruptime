package org.poweruptime.backend.configuration

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.thymeleaf.TemplateEngine
import org.thymeleaf.spring6.SpringTemplateEngine
import org.thymeleaf.templatemode.TemplateMode
import org.thymeleaf.templateresolver.StringTemplateResolver

@Configuration
class ThymeleafConfiguration {
    @Bean
    fun templateEngine(): TemplateEngine = SpringTemplateEngine()

    @Bean
    fun textTemplateEngine(): TemplateEngine = SpringTemplateEngine().apply {
        setTemplateResolver(
            StringTemplateResolver().apply {
                templateMode = TemplateMode.TEXT
                order = 1
            },
        )
    }
}
