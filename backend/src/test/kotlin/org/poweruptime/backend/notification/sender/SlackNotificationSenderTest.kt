package org.poweruptime.backend.notification.sender

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.core.ModelFactory
import org.poweruptime.backend.features.notification.notificationSenders.slack.SlackNotificationSender
import org.poweruptime.backend.features.notification.notificationSenders.slack.SlackNotificationSenderData
import org.poweruptime.backend.features.notification.service.NotificationTemplateService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.client.RestTemplate
import org.testcontainers.junit.jupiter.Container
import software.xdev.mockserver.client.MockServerClient
import software.xdev.mockserver.model.HttpRequest.request
import software.xdev.mockserver.model.HttpResponse
import software.xdev.testcontainers.mockserver.containers.MockServerContainer

class SlackNotificationSenderTest(
    @Autowired private val notificationTemplateService: NotificationTemplateService,
    @Autowired private val restTemplate: RestTemplate,
) : BaseTestWithReusingContainers() {
    private val slackNotificationSender = SlackNotificationSender(restTemplate)

    companion object {
        @JvmStatic
        @Container
        val mockServerContainer = MockServerContainer()
    }

    private val client = MockServerClient(mockServerContainer.host, mockServerContainer.serverPort)

    @BeforeEach
    fun setupExpectations() {
        client
            .`when`(
                request()
                    .withMethod("POST")
                    .withPath("/services/.+/.+/.+"),
            )
            .respond {
                HttpResponse.response()
                    .withStatusCode(200)
                    .withBody("ok")
            }
    }

    private val notification = ModelFactory.getTestNotification(
        title = """this is a "test"""",
        sender = SlackNotificationSenderData(
            "http://${mockServerContainer.host}:${mockServerContainer.serverPort}/services/T000/B000/FAK",
            "testAuthor",
        ),
    )

    private val template = notificationTemplateService.getRenderedNotification(notification)

    @Test
    fun `test success slack`() {
        slackNotificationSender.send(notification, template).let {
            assertThat(it).isNull()
        }

        val recorded = client
            .retrieveRecordedRequests(
                request()
                    .withMethod("POST")
                    .withPath("/services/.+/.+/.+"),
            )

        assertThat(recorded).hasSize(1)
        assertThat(
            recorded[0].body.toString(),
        ).contains(
            """**✅ UP: Test - this is a \"test\"**\n\n**Service Name**\nTest\n\n**Ping**\n1000ms\n\n**Check""",
        )
        assertThat(recorded[0].body.toString()).contains(""""author_name":"testAuthor"""")
    }
}
