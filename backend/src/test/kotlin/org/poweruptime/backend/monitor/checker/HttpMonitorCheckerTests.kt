package org.poweruptime.backend.monitor.checker

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.BaseTestWithReusingContainers
import org.poweruptime.backend.core.ModelFactory
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorChecker
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorCheckerData
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorCheckerDataAuthType
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorCheckerDataContentType
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorCheckerDataMethod
import org.testcontainers.containers.GenericContainer
import org.testcontainers.containers.wait.strategy.Wait
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.utility.DockerImageName
import java.time.Duration
import java.time.Instant
import java.util.Locale

class HttpMonitorCheckerTests : BaseTestWithReusingContainers() {
    private fun getHttpBinUrl() = "http://localhost:${httpBin.getMappedPort(80)}"

    private val httpMonitorChecker = HttpMonitorChecker()

    @Test
    fun `test if simple works`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorCheckerData(
                url = "https://dafnik.me",
                method = HttpMonitorCheckerDataMethod.GET,
                contentType = HttpMonitorCheckerDataContentType.JSON,
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if fails if TLS does not work`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorCheckerData(
                url = "https://expired.badssl.com/",
                method = HttpMonitorCheckerDataMethod.GET,
                contentType = HttpMonitorCheckerDataContentType.JSON,
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("Connection error")
    }

    @Test
    fun `test if succeeds if TLS does not work but is ignored`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorCheckerData(
                url = "https://expired.badssl.com/",
                method = HttpMonitorCheckerDataMethod.GET,
                contentType = HttpMonitorCheckerDataContentType.JSON,
                ignoreTLS = true,
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if succeeds for xml`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorCheckerData(
                url = "${getHttpBinUrl()}/xml",
                method = HttpMonitorCheckerDataMethod.GET,
                contentType = HttpMonitorCheckerDataContentType.XML,
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
            HttpMonitorCheckerData(
                url = "${getHttpBinUrl()}/json",
                method = HttpMonitorCheckerDataMethod.GET,
                contentType = HttpMonitorCheckerDataContentType.JSON,
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if succeeds for html`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorCheckerData(
                url = "${getHttpBinUrl()}/html",
                method = HttpMonitorCheckerDataMethod.GET,
                contentType = HttpMonitorCheckerDataContentType.HTML,
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if succeeds for gzip`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorCheckerData(
                url = "${getHttpBinUrl()}/gzip",
                method = HttpMonitorCheckerDataMethod.GET,
                contentType = HttpMonitorCheckerDataContentType.JSON,
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if succeeds for different methods`(): Unit =
        HttpMonitorCheckerDataMethod.entries
            .filter { it != HttpMonitorCheckerDataMethod.HEAD && it != HttpMonitorCheckerDataMethod.OPTIONS }
            .forEach { method ->
                httpMonitorChecker.execute(
                    ModelFactory.getTestMonitor(
                        HttpMonitorCheckerData(
                            url = "${getHttpBinUrl()}/${method.name.lowercase(Locale.getDefault())}",
                            method = method,
                            contentType = HttpMonitorCheckerDataContentType.JSON,
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
            HttpMonitorCheckerData(
                url = "${getHttpBinUrl()}/html",
                method = HttpMonitorCheckerDataMethod.GET,
                contentType = HttpMonitorCheckerDataContentType.HTML,
                searchTerm = "shameful story of his wretched fate",
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if fails for html with search term`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorCheckerData(
                url = "${getHttpBinUrl()}/html",
                method = HttpMonitorCheckerDataMethod.GET,
                contentType = HttpMonitorCheckerDataContentType.HTML,
                searchTerm = "NOT_FOUND_THIS",
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("Search term not found in body")
    }

    @Test
    fun `test if succeeds for json with search term`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorCheckerData(
                url = "${getHttpBinUrl()}/json",
                method = HttpMonitorCheckerDataMethod.GET,
                contentType = HttpMonitorCheckerDataContentType.JSON,
                searchTerm = """"title": "Wake up to WonderWidgets!",""",
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if fails for json with search term`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorCheckerData(
                url = "${getHttpBinUrl()}/json",
                method = HttpMonitorCheckerDataMethod.GET,
                contentType = HttpMonitorCheckerDataContentType.HTML,
                searchTerm = "NOT_FOUND_THIS",
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("Search term not found in body")
    }

    @Test
    fun `test if succeeds for xml with search term`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorCheckerData(
                url = "${getHttpBinUrl()}/xml",
                method = HttpMonitorCheckerDataMethod.GET,
                contentType = HttpMonitorCheckerDataContentType.XML,
                searchTerm = "Sample Slide Show",
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if fails for xml with search term`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorCheckerData(
                url = "${getHttpBinUrl()}/xml",
                method = HttpMonitorCheckerDataMethod.GET,
                contentType = HttpMonitorCheckerDataContentType.XML,
                searchTerm = "NOT_FOUND_THIS",
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("Search term not found in body")
    }

    @Test
    fun `test if succeeds for json with basic auth`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorCheckerData(
                url = "${getHttpBinUrl()}/basic-auth/test_user/test_password",
                method = HttpMonitorCheckerDataMethod.GET,
                contentType = HttpMonitorCheckerDataContentType.JSON,
                authType = HttpMonitorCheckerDataAuthType.BASIC,
                basicAuthDataUsername = "test_user",
                basicAuthDataPassword = "test_password",
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if succeeds for json with basic auth and search`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorCheckerData(
                url = "${getHttpBinUrl()}/basic-auth/test_user/test_password",
                method = HttpMonitorCheckerDataMethod.GET,
                contentType = HttpMonitorCheckerDataContentType.JSON,
                authType = HttpMonitorCheckerDataAuthType.BASIC,
                basicAuthDataUsername = "test_user",
                basicAuthDataPassword = "test_password",
                searchTerm = """"authenticated": true""",
            ),
        ),
    ).let {
        assertThat(it.isUp).isTrue()
        assertThat(it.title).isEqualTo("200 - OK")
    }

    @Test
    fun `test if succeeds for json with basic auth and fails with search`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorCheckerData(
                url = "${getHttpBinUrl()}/basic-auth/test_user/test_password",
                method = HttpMonitorCheckerDataMethod.GET,
                contentType = HttpMonitorCheckerDataContentType.JSON,
                authType = HttpMonitorCheckerDataAuthType.BASIC,
                basicAuthDataUsername = "test_user",
                basicAuthDataPassword = "test_password",
                searchTerm = "NOT_FOUND",
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("Search term not found in body")
    }

    @Test
    fun `test if fails for json with basic auth`(): Unit = httpMonitorChecker.execute(
        ModelFactory.getTestMonitor(
            HttpMonitorCheckerData(
                url = "${getHttpBinUrl()}/basic-auth/test_user/test_password",
                method = HttpMonitorCheckerDataMethod.GET,
                contentType = HttpMonitorCheckerDataContentType.JSON,
                authType = HttpMonitorCheckerDataAuthType.BASIC,
                basicAuthDataUsername = "test_user1",
                basicAuthDataPassword = "test_password1",
            ),
        ),
    ).let {
        assertThat(it.isUp).isFalse()
        assertThat(it.title).isEqualTo("401 - UNAUTHORIZED")
    }

    @Test
    fun `test if fails after timeout`() {
        val now = Instant.now()
        httpMonitorChecker.execute(
            ModelFactory.getTestMonitor(
                HttpMonitorCheckerData(
                    url = "${getHttpBinUrl()}/delay/10",
                    method = HttpMonitorCheckerDataMethod.GET,
                    contentType = HttpMonitorCheckerDataContentType.JSON,
                ),
            ),
        ).let {
            assertThat(it.isUp).isFalse()
            assertThat(it.title).isEqualTo("Connection error")
        }
        assertThat(Duration.between(now, Instant.now()).seconds).isLessThanOrEqualTo(8)
    }

    @Test
    fun `test succeeds for status codes`() {
        val statusCodes = listOf(
            100, 101, 102, 103,
            200, 201, 202, 203, 204, 205, 206, 207, 208, 226,
            300, 301, 302, 303, 304, 305, 306, 307, 308,
            400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418,
            421, 422, 423, 424, 425, 426, 428, 429, 431, 451,
            500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511,
            419, 420, 440, 444, 449, 450, 460, 463, 494, 495, 496, 497, 498, 499,
            520, 521, 522, 523, 524, 525, 526, 527, 530, 561,
        )

        statusCodes.filter { it in 200..399 }.forEach { statusCode ->
            httpMonitorChecker.execute(
                ModelFactory.getTestMonitor(
                    HttpMonitorCheckerData(
                        url = "${getHttpBinUrl()}/status/$statusCode",
                        method = HttpMonitorCheckerDataMethod.GET,
                        contentType = HttpMonitorCheckerDataContentType.JSON,
                    ),
                ),
            ).let {
                assertThat(it.isUp).isTrue()
            }
        }

        statusCodes.filter { it < 200 || it > 399 }.forEach { statusCode ->
            httpMonitorChecker.execute(
                ModelFactory.getTestMonitor(
                    HttpMonitorCheckerData(
                        url = "${getHttpBinUrl()}/status/$statusCode",
                        method = HttpMonitorCheckerDataMethod.GET,
                        contentType = HttpMonitorCheckerDataContentType.JSON,
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
