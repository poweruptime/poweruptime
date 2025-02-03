package org.poweruptime.backend.core

import org.springframework.boot.SpringApplication
import org.springframework.boot.test.context.SpringBootContextLoader

class NonHeadlessSpringBootContextLoader : SpringBootContextLoader() {
    override fun getSpringApplication(): SpringApplication {
        val application = super.getSpringApplication()
        application.setHeadless(false)
        return application
    }
}
