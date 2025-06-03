package org.poweruptime.backend.notification

import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.testcontainers.containers.GenericContainer
import org.testcontainers.containers.wait.strategy.Wait
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.utility.DockerImageName

class AppriseIntegrationTests : BaseTestWithReusingContainers() {

    companion object {
        private val appriseImageName: DockerImageName = DockerImageName.parse("caronc/apprise:latest")

        @Container
        @JvmStatic
        val apprise: GenericContainer<*> = GenericContainer(appriseImageName)
            .withExposedPorts(8000)
            .waitingFor(Wait.forHttp("/").forStatusCode(200))
    }
}
