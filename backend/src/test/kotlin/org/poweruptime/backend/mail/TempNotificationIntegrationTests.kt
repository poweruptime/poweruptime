package org.poweruptime.backend.mail

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.features.tempNotification.TempNotification
import org.poweruptime.backend.features.tempNotification.TempNotificationService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import java.time.Instant

class TempNotificationIntegrationTests(
    @Autowired val mockMvc: MockMvc,
) : BaseTestWithReusingContainers() {

    @Test
    fun `test auto removal success`() {
        val tempNotificationService = TempNotificationService()
        tempNotificationService.addNotification(
            TempNotification(
                to = "test",
                subject = "test",
                body = "test",
                bodyHTML = "<div>test</div>",
                createdAt = Instant.now().minusSeconds(60 * 60).minusSeconds(5 * 60),
            ),
        )

        tempNotificationService.addNotification(
            TempNotification(
                to = "test",
                subject = "test",
                body = "test",
                createdAt = Instant.now(),
            ),
        )

        assertThat(tempNotificationService.tempNotifications.size).isEqualTo(2)

        tempNotificationService.removeOldTempNotifications()

        assertThat(tempNotificationService.tempNotifications.size).isEqualTo(1)
    }

    @Test
    fun `test get`() {
        mockMvc.get("/v1/public/temp-notification").andExpect {
            status { isOk() }
            content {
                contentType(MediaType.APPLICATION_JSON)
                jsonPath("$") { isArray() }
                jsonPath("$[0].to") { exists() }
                jsonPath("$[0].subject") { exists() }
                jsonPath("$[0].body") { exists() }
                jsonPath("$[0].bodyHTML") { exists() }
                jsonPath("$[0].createdAt") { exists() }
            }
        }
    }
}

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = [
        "poweruptime.notification-temp.enabled=false",
    ],
)
class TempNotificationsDisabledIntegrationTest(
    @Autowired val mockMvc: MockMvc,
) : BaseTestWithReusingContainers() {
    @Test
    fun `check if disabled is working`() {
        mockMvc.get("/v1/public/temp-tempNotification").andExpect {
            status { isNotFound() }
        }
    }
}
