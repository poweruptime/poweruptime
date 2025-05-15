package org.poweruptime.backend.notification.sender

import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.features.notification.service.NotificationTemplateService
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.web.client.RestTemplate

class DiscordNotificationSenderTest(
    @Autowired private val notificationTemplateService: NotificationTemplateService,
    @Autowired private val restTemplate: RestTemplate,
) : BaseTestWithReusingContainers() {
//    private val discordNotificationSender = DiscordNotificationMethodDataAppriseConverter(restTemplate)
//
//    companion object {
//        @JvmStatic
//        @Container
//        val mockServerContainer = MockServerContainer()
//    }
//
//    private val client = MockServerClient(mockServerContainer.host, mockServerContainer.serverPort)
//
//    @BeforeEach
//    fun setupExpectations() {
//        client
//            .`when`(
//                request()
//                    .withMethod("POST")
//                    .withPath("/services/.+/.+/.+"),
//            )
//            .respond {
//                HttpResponse.response()
//                    .withStatusCode(200)
//                    .withBody("ok")
//            }
//    }
//
//    private val notification = ModelFactory.getTestNotification(
//        title = """this is a "test"""",
//        sender = DiscordNotificationMethodData(
//            "http://${mockServerContainer.host}:${mockServerContainer.serverPort}/services/T000/B000/FAK",
//            "testAuthor",
//        ),
//    )
//
//    private val template = notificationTemplateService.getRenderedNotification(notification)
//
//    @Test
//    fun `test success discord`() {
//        discordNotificationSender.send(notification, template).let {
//            assertThat(it).isNull()
//        }
//
//        val recorded = client
//            .retrieveRecordedRequests(
//                request()
//                    .withMethod("POST")
//                    .withPath("/services/.+/.+/.+"),
//            )
//
//        assertThat(recorded).hasSize(1)
//        assertThat(
//            recorded[0].body.toString(),
//        ).contains(
//            """**✅ UP: Test - this is a \"test\"**\n\n**Service Name**\nTest\n\n**Ping**\n1000ms\n\n**Check started""",
//        )
//        assertThat(recorded[0].body.toString()).contains(""""username":"testAuthor",""")
//    }
}
