package org.poweruptime.backend.features.monitor.checkers.http

import io.github.oshai.kotlinlogging.KotlinLogging
import org.apache.hc.client5.http.config.ConnectionConfig
import org.apache.hc.client5.http.config.RequestConfig
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder
import org.apache.hc.client5.http.ssl.DefaultClientTlsStrategy
import org.apache.hc.client5.http.ssl.NoopHostnameVerifier
import org.apache.hc.core5.ssl.SSLContexts
import org.apache.hc.core5.util.Timeout
import org.poweruptime.backend.core.utils.addBasicAuthString
import org.poweruptime.backend.features.monitor.checkers.CheckResultDto
import org.poweruptime.backend.features.monitor.checkers.MonitorChecker
import org.poweruptime.backend.features.monitor.checkers.MonitoringResultHandler
import org.poweruptime.backend.features.monitor.checkers.ssl.SSLCertificateMonitorChecker
import org.poweruptime.backend.features.monitor.checkers.ssl.SSLCertificateMonitorDataRecord
import org.poweruptime.backend.features.monitor.core.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.poweruptime.backend.features.team.service.TeamSettingService
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import org.springframework.http.HttpStatusCode
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientResponseException

class HttpMonitorChecker(
    private val teamSettingService: TeamSettingService,
) : MonitorChecker(MonitorType.HTTP) {
    private val logger = KotlinLogging.logger {}

    @Suppress("ReturnCount")
    override fun execute(
        monitor: MonitorRecord,
        data: MonitorData,
    ): CheckResultDto {
        data as HttpMonitorDataRecord

        if (data.certificateExpiry) {
            val certificateExpiryResult = SSLCertificateMonitorChecker(
                teamSettingService,
            ).execute(
                monitor,
                data = SSLCertificateMonitorDataRecord(
                    url = data.url,
                    validDaysLeft = data.certificateValidDaysLeft,
                ),
            )
            if (!certificateExpiryResult.isUp) {
                return certificateExpiryResult
            }
        }

        logger.debug {
            "Sending http request for monitor '${monitor.name}' with id " +
                "'${monitor.id}', url: '${data.url}'"
        }

        val result = MonitoringResultHandler()

        return try {
            val httpResponse = makeHttpRequest(data)

            if (!data.getAllowedStatusCodesRanges()
                    .isStatusCodeAllowed(httpResponse.statusCode)
            ) {
                return result.error(
                    httpResponse.title,
                    httpResponse.message,
                )
            }

            if (data.searchTerm == null) {
                return result.success(
                    httpResponse.title,
                    httpResponse.message,
                )
            }

            val responseBody = httpResponse.responseBody
                ?: return result.error("HTTP Body not found")

            if (!(responseBody as String).contains(data.searchTerm)) {
                return result.error(
                    "Search term not found in body",
                    responseBody,
                )
            }

            result.success(httpResponse.title, httpResponse.message)
        } catch (ex: RestClientResponseException) {
            result.error(
                "${ex.statusCode.value()} - ${ex.statusText}",
                ex.responseBodyAsString,
            )
        } catch (ex: Exception) {
            result.error("Connection error", ex.message)
        }
    }

    data class HttpResponse(
        val statusCode: HttpStatusCode,
        val title: String,
        val message: String? = null,
        val responseBody: Any? = null,
    )

    @Suppress("LongMethod")
    private fun makeHttpRequest(
        httpMonitorCheckerData: HttpMonitorDataRecord,
    ): HttpResponse {
        val requestFactory = buildHttpClientRequestFactory(
            httpMonitorCheckerData,
        )

        val customRestClient = RestClient.builder()
            .requestFactory(requestFactory)
            .build()

        val headers = buildHeaders(httpMonitorCheckerData)

        return try {
            val entity = customRestClient
                .method(httpMonitorCheckerData.method.toHttpMethod())
                .uri(httpMonitorCheckerData.url)
                .headers { headersConsumer ->
                    headers.forEach { (key, values) ->
                        headersConsumer[key] = values.first()
                    }
                }
                .body(httpMonitorCheckerData.body ?: "")
                .retrieve()
                .toEntity(String::class.java)

            val httpStatus = try {
                HttpStatus.valueOf(entity.statusCode.value())
            } catch (_: IllegalArgumentException) {
                HttpStatus.valueOf(200)
            }

            HttpResponse(
                httpStatus,
                httpStatus.let { "${it.value()} - ${it.reasonPhrase}" },
                responseBody = entity.body,
            )
        } catch (ex: RestClientResponseException) {
            HttpResponse(
                HttpStatusCode.valueOf(ex.statusCode.value()),
                "${ex.statusCode.value()} - ${ex.statusText}",
                responseBody = ex.responseBodyAsString,
            )
        }
    }

    private fun buildHttpClientRequestFactory(
        httpMonitorCheckerData: HttpMonitorDataRecord,
    ): HttpComponentsClientHttpRequestFactory {
        val connectionConfig = ConnectionConfig.custom()
            .setConnectTimeout(Timeout.ofMilliseconds(4000))
            .setSocketTimeout(Timeout.ofMilliseconds(4000))
            .build()

        val connectionManager = PoolingHttpClientConnectionManagerBuilder.create()
            .setDefaultConnectionConfig(connectionConfig)

        val requestConfig = RequestConfig.custom().apply {
            if (httpMonitorCheckerData.maxRedirects == null) {
                setRedirectsEnabled(false)
            } else {
                setRedirectsEnabled(true)
                setMaxRedirects(
                    httpMonitorCheckerData.maxRedirects.toInt(),
                )
            }

            setConnectionRequestTimeout(Timeout.ofMilliseconds(4000))
            setResponseTimeout(Timeout.ofMilliseconds(4000))
        }.build()

        if (httpMonitorCheckerData.ignoreTLS) {
            connectionManager.setTlsSocketStrategy(
                DefaultClientTlsStrategy(
                    SSLContexts.custom()
                        .loadTrustMaterial(null) { _, _ -> true }
                        .build(),
                    NoopHostnameVerifier.INSTANCE,
                ),
            )
        }

        val httpClient = HttpClientBuilder.create()
            .setDefaultRequestConfig(requestConfig)
            .setConnectionManager(connectionManager.build())
            .addResponseInterceptorFirst { response, _, _ ->
                response.removeHeaders("Content-Encoding")
            }
            .build()

        return HttpComponentsClientHttpRequestFactory(httpClient)
    }

    private fun buildHeaders(
        httpMonitorCheckerData: HttpMonitorDataRecord,
    ): HttpHeaders {
        return HttpHeaders().apply {
            add("Accept", "*/*")
            add(
                "Content-Type",
                when (httpMonitorCheckerData.contentType) {
                    HttpMonitorDataContentType.HTML -> "text/html"
                    HttpMonitorDataContentType.JSON ->
                        "application/json"
                    HttpMonitorDataContentType.XML -> "application/xml"
                },
            )

            httpMonitorCheckerData.authType?.let {
                when (it) {
                    HttpMonitorDataAuthType.BASIC -> addBasicAuthString(
                        httpMonitorCheckerData.basicAuthDataUsername!!,
                        httpMonitorCheckerData.basicAuthDataPassword!!,
                    )
                }
            }
        }
    }

    private fun HttpMonitorDataMethod.toHttpMethod() = when (this) {
        HttpMonitorDataMethod.GET -> HttpMethod.GET
        HttpMonitorDataMethod.POST -> HttpMethod.POST
        HttpMonitorDataMethod.PUT -> HttpMethod.PUT
        HttpMonitorDataMethod.PATCH -> HttpMethod.PATCH
        HttpMonitorDataMethod.DELETE -> HttpMethod.DELETE
        HttpMonitorDataMethod.HEAD -> HttpMethod.HEAD
        HttpMonitorDataMethod.OPTIONS -> HttpMethod.OPTIONS
    }

    private fun List<IntRange>.isStatusCodeAllowed(
        statusCode: HttpStatusCode,
    ): Boolean {
        val code = statusCode.value()
        return any { code in it }
    }
}
