package org.poweruptime.backend.monitor.checker

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.core.ModelFactory
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorChecker
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorData
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorDataAuthType
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorDataContentType
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorDataMethod
import org.poweruptime.backend.features.team.service.TeamSettingService
import org.springframework.beans.factory.annotation.Autowired
import org.testcontainers.containers.GenericContainer
import org.testcontainers.containers.wait.strategy.Wait
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.utility.DockerImageName
import java.time.Duration
import java.time.Instant
import java.util.Locale

class HttpMonitorCheckerTests(
    @Autowired teamSettingService: TeamSettingService,
) : BaseTestWithReusingContainers() {
    private fun getHttpBinUrl() = "http://localhost:${httpBin.getMappedPort(80)}"

    private val httpMonitorChecker = HttpMonitorChecker(teamSettingService)

    @Test
    fun `test if simple works`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorData(
                url = "https://dafnik.me",
                method = HttpMonitorDataMethod.GET,
                contentType = HttpMonitorDataContentType.JSON,
                allowedStatusCodeRanges = listOf("200 - 299"),
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if fails if TLS does not work`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorData(
                url = "https://expired.badssl.com/",
                method = HttpMonitorDataMethod.GET,
                contentType = HttpMonitorDataContentType.JSON,
                allowedStatusCodeRanges = listOf("200 - 299"),
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("Connection error")
    }

    @Test
    fun `test if succeeds if TLS does not work but is ignored`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorData(
                url = "https://expired.badssl.com/",
                method = HttpMonitorDataMethod.GET,
                contentType = HttpMonitorDataContentType.JSON,
                ignoreTLS = true,
                allowedStatusCodeRanges = listOf("200 - 299"),
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if succeeds for xml`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorData(
                url = "${getHttpBinUrl()}/xml",
                method = HttpMonitorDataMethod.GET,
                contentType = HttpMonitorDataContentType.XML,
                allowedStatusCodeRanges = listOf("200 - 299"),
            ),
        ),
    ).let {
        println("localhost:${httpBin.getMappedPort(80)}/xml: ${it.title} ${it.message}")
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if succeeds for json`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorData(
                url = "${getHttpBinUrl()}/json",
                method = HttpMonitorDataMethod.GET,
                contentType = HttpMonitorDataContentType.JSON,
                allowedStatusCodeRanges = listOf("200 - 299"),
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if succeeds for html`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorData(
                url = "${getHttpBinUrl()}/html",
                method = HttpMonitorDataMethod.GET,
                contentType = HttpMonitorDataContentType.HTML,
                allowedStatusCodeRanges = listOf("200 - 299"),
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if succeeds for gzip`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorData(
                url = "${getHttpBinUrl()}/gzip",
                method = HttpMonitorDataMethod.GET,
                contentType = HttpMonitorDataContentType.JSON,
                allowedStatusCodeRanges = listOf("200 - 299"),
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if succeeds for different methods`(): Unit =
        HttpMonitorDataMethod.entries
            .filter { it != HttpMonitorDataMethod.HEAD && it != HttpMonitorDataMethod.OPTIONS }
            .forEach { method ->
                httpMonitorChecker.execute(
                    ModelFactory.getTestMonitor(
                        HttpMonitorData(
                            url = "${getHttpBinUrl()}/${method.name.lowercase(Locale.getDefault())}",
                            method = method,
                            contentType = HttpMonitorDataContentType.JSON,
                            allowedStatusCodeRanges = listOf("200 - 299"),
                        ),
                    ),
                ).let {
                    assertThat(it.isUp).isTrue()
                    assertThat(it.title).isEqualTo("200 - OK")
                }
            }

    @Test
    fun `test if succeeds for html with search term`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorData(
                url = "${getHttpBinUrl()}/html",
                method = HttpMonitorDataMethod.GET,
                contentType = HttpMonitorDataContentType.HTML,
                searchTerm = "shameful story of his wretched fate",
                allowedStatusCodeRanges = listOf("200 - 299"),
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if fails for html with search term`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorData(
                url = "${getHttpBinUrl()}/html",
                method = HttpMonitorDataMethod.GET,
                contentType = HttpMonitorDataContentType.HTML,
                searchTerm = "NOT_FOUND_THIS",
                allowedStatusCodeRanges = listOf("200 - 299"),
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("Search term not found in body")
    }

    @Test
    fun `test if succeeds for json with search term`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorData(
                url = "${getHttpBinUrl()}/json",
                method = HttpMonitorDataMethod.GET,
                contentType = HttpMonitorDataContentType.JSON,
                searchTerm = """"title": "Wake up to WonderWidgets!",""",
                allowedStatusCodeRanges = listOf("200 - 299"),
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if fails for json with search term`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorData(
                url = "${getHttpBinUrl()}/json",
                method = HttpMonitorDataMethod.GET,
                contentType = HttpMonitorDataContentType.HTML,
                searchTerm = "NOT_FOUND_THIS",
                allowedStatusCodeRanges = listOf("200 - 299"),
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("Search term not found in body")
    }

    @Test
    fun `test if succeeds for xml with search term`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorData(
                url = "${getHttpBinUrl()}/xml",
                method = HttpMonitorDataMethod.GET,
                contentType = HttpMonitorDataContentType.XML,
                searchTerm = "Sample Slide Show",
                allowedStatusCodeRanges = listOf("200 - 299"),
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if fails for xml with search term`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorData(
                url = "${getHttpBinUrl()}/xml",
                method = HttpMonitorDataMethod.GET,
                contentType = HttpMonitorDataContentType.XML,
                searchTerm = "NOT_FOUND_THIS",
                allowedStatusCodeRanges = listOf("200 - 299"),
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("Search term not found in body")
    }

    @Test
    fun `test if succeeds for json with basic auth`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorData(
                url = "${getHttpBinUrl()}/basic-auth/test_user/test_password",
                method = HttpMonitorDataMethod.GET,
                contentType = HttpMonitorDataContentType.JSON,
                authType = HttpMonitorDataAuthType.BASIC,
                basicAuthDataUsername = "test_user",
                basicAuthDataPassword = "test_password",
                allowedStatusCodeRanges = listOf("200 - 299"),
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if succeeds for json with basic auth and search`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorData(
                url = "${getHttpBinUrl()}/basic-auth/test_user/test_password",
                method = HttpMonitorDataMethod.GET,
                contentType = HttpMonitorDataContentType.JSON,
                authType = HttpMonitorDataAuthType.BASIC,
                basicAuthDataUsername = "test_user",
                basicAuthDataPassword = "test_password",
                searchTerm = """"authenticated": true""",
                allowedStatusCodeRanges = listOf("200 - 299"),
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if succeeds for json with basic auth and fails with search`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorData(
                url = "${getHttpBinUrl()}/basic-auth/test_user/test_password",
                method = HttpMonitorDataMethod.GET,
                contentType = HttpMonitorDataContentType.JSON,
                authType = HttpMonitorDataAuthType.BASIC,
                basicAuthDataUsername = "test_user",
                basicAuthDataPassword = "test_password",
                searchTerm = "NOT_FOUND",
                allowedStatusCodeRanges = listOf("200 - 299"),
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("Search term not found in body")
    }

    @Test
    fun `test if fails for json with basic auth with`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorData(
                url = "${getHttpBinUrl()}/basic-auth/test_user/test_password",
                method = HttpMonitorDataMethod.GET,
                contentType = HttpMonitorDataContentType.JSON,
                authType = HttpMonitorDataAuthType.BASIC,
                basicAuthDataUsername = "test_user1",
                basicAuthDataPassword = "test_password1",
                allowedStatusCodeRanges = listOf("200 - 299"),
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("401 - UNAUTHORIZED")
    }

    @Test
    fun `test if succeeds for json with basic auth with expected status code`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorData(
                url = "${getHttpBinUrl()}/basic-auth/test_user/test_password",
                method = HttpMonitorDataMethod.GET,
                contentType = HttpMonitorDataContentType.JSON,
                authType = HttpMonitorDataAuthType.BASIC,
                basicAuthDataUsername = "test_user1",
                basicAuthDataPassword = "test_password1",
                allowedStatusCodeRanges = listOf("401 - 401"),
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("401 - UNAUTHORIZED")
    }

    @Test
    fun `test if fails after timeout`() {
        val now = Instant.now()
        httpMonitorChecker.execute(
            ModelFactory.getTestMonitor(
                HttpMonitorData(
                    url = "${getHttpBinUrl()}/delay/10",
                    method = HttpMonitorDataMethod.GET,
                    contentType = HttpMonitorDataContentType.JSON,
                    allowedStatusCodeRanges = listOf("200 - 299"),
                ),
            ),
        ).let {
            assertThat(it.isUp).isFalse()
            assertThat(it.title).isEqualTo("Connection error")
        }
        assertThat(Duration.between(now, Instant.now()).seconds).isLessThanOrEqualTo(8)
    }

    @Test
    fun `test max redirects disallowed`() {
        httpMonitorChecker.execute(
            ModelFactory.getTestMonitor(
                HttpMonitorData(
                    url = "${getHttpBinUrl()}/redirect/3",
                    method = HttpMonitorDataMethod.GET,
                    contentType = HttpMonitorDataContentType.JSON,
                    allowedStatusCodeRanges = listOf("200 - 299"),
                ),
            ),
        ).let {
            assertThat(it.isUp).isFalse()
        }
    }

    @Test
    fun `test max redirects`() {
        httpMonitorChecker.execute(
            ModelFactory.getTestMonitor(
                HttpMonitorData(
                    url = "${getHttpBinUrl()}/redirect/3",
                    method = HttpMonitorDataMethod.GET,
                    contentType = HttpMonitorDataContentType.JSON,
                    allowedStatusCodeRanges = listOf("200 - 299"),
                    maxRedirects = 5,
                ),
            ),
        ).let {
            assertThat(it.isUp).isTrue()
        }
    }

    @Test
    fun `test fail max redirects`() {
        httpMonitorChecker.execute(
            ModelFactory.getTestMonitor(
                HttpMonitorData(
                    url = "${getHttpBinUrl()}/redirect/10",
                    method = HttpMonitorDataMethod.GET,
                    contentType = HttpMonitorDataContentType.JSON,
                    allowedStatusCodeRanges = listOf("200 - 299"),
                    maxRedirects = 5,
                ),
            ),
        ).let {
            assertThat(it.isUp).isFalse()
        }
    }

    @Test
    fun `test succeeds for status codes`() {
        val statusCodes = listOf(
            200, 201, 202, 203, 204, 205, 206, 207, 208, 226,
            300, 301, 302, 303, 304, 305, 307, 308, // 306,
            400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418,
            421, 422, 423, 424, 425, 426, 428, 429, 431, 451,
            500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511,
            419, 420, 440, 444, 449, 450, 460, 463, 494, 495, 496, 497, 498, 499,
            520, 521, 522, 523, 524, 525, 526, 527, 530, 561,
        )

        statusCodes.forEach { statusCode ->
            httpMonitorChecker.execute(
                ModelFactory.getTestMonitor(
                    HttpMonitorData(
                        url = "${getHttpBinUrl()}/status/$statusCode",
                        method = HttpMonitorDataMethod.GET,
                        contentType = HttpMonitorDataContentType.JSON,
                        allowedStatusCodeRanges = listOf("$statusCode - $statusCode"),
                    ),
                ),
            ).let {
                assertThat(it.isUp).isTrue()
            }
        }

        statusCodes.forEach { statusCode ->
            httpMonitorChecker.execute(
                ModelFactory.getTestMonitor(
                    HttpMonitorData(
                        url = "${getHttpBinUrl()}/status/$statusCode",
                        method = HttpMonitorDataMethod.GET,
                        contentType = HttpMonitorDataContentType.JSON,
                        allowedStatusCodeRanges = listOf("000 - 000"),
                    ),
                ),
            ).let {
                assertThat(it.isUp).isFalse()
            }
        }
    }

    companion object {
        private val httpBinImageName: DockerImageName = DockerImageName.parse("kennethreitz/httpbin:latest")

        @Container
        @JvmStatic
        val httpBin: GenericContainer<*> = GenericContainer(httpBinImageName)
            .withExposedPorts(80)
            .waitingFor(Wait.forHttp("/").forStatusCode(200))
    }
}
