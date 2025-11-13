package org.poweruptime.backend.features.monitor.checker.http

import io.github.oshai.kotlinlogging.KotlinLogging
import org.apache.hc.client5.http.config.RequestConfig
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder
import org.apache.hc.client5.http.ssl.NoopHostnameVerifier
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactory
import org.apache.hc.core5.ssl.SSLContexts
import org.apache.hc.core5.util.Timeout
import org.poweruptime.backend.configuration.puRestTemplate
import org.poweruptime.backend.core.utils.addBasicAuthString
import org.poweruptime.backend.features.monitor.checker.ssl.SSLCertificateMonitorChecker
import org.poweruptime.backend.features.monitor.checker.ssl.SSLCertificateMonitorDataRecord
import org.poweruptime.backend.features.monitor.core.*
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.poweruptime.backend.features.team.service.TeamSettingService
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import org.springframework.http.HttpStatusCode
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory
import org.springframework.web.client.HttpClientErrorException
import org.springframework.web.client.HttpServerErrorException
import org.springframework.web.client.ResourceAccessException
import org.springframework.web.client.RestClientException
import org.springframework.web.client.RestClientResponseException
import java.time.Duration

class HttpMonitorChecker(
    private val teamSettingService: TeamSettingService
) : MonitorChecker {
    private final val logger = KotlinLogging.logger {}

    override val type = MonitorType.HTTP

    @Suppress("ReturnCount")
    override fun execute(monitor: MonitorRecord, data: MonitorData): CheckResultDto {
        data as HttpMonitorDataRecord

        if (data.certificateExpiry) {
            val certificateExpiryResult = SSLCertificateMonitorChecker(teamSettingService).execute(
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
            "Sending http request for monitor '${monitor.name}' with id '${monitor.id}', " +
                "url: '${data.url}'"
        }

        val result = MonitoringResultHandler()

        try {
            val httpResponse = makeHttpRequest(data)

            if (!data.getAllowedStatusCodesRanges().isStatusCodeAllowed(httpResponse.statusCode)) {
                return result.error(httpResponse.title, httpResponse.message)
            }

            if (data.searchTerm == null) {
                return result.success(httpResponse.title, httpResponse.message)
            }

            val responseBody = httpResponse.responseBody ?: return result.error("HTTP Body not found")

            if (!(responseBody as String).contains(data.searchTerm)) {
                return result.error("Search term not found in body", responseBody)
            }

            return result.success(httpResponse.title, httpResponse.message)
        } catch (ex: ResourceAccessException) {
            // Handle connection errors (e.g., timeout, unreachable host)
            return result.error("Connection error", ex.message)
        } catch (ex: RestClientException) {
            // Catch-all for other RestTemplate-related exceptions
            return result.error("Unexpected error", ex.message)
        }
    }

    data class HttpResponse(
        val statusCode: HttpStatusCode,
        val title: String,
        val message: String? = null,
        val responseBody: Any? = null,
    )

    @Suppress("LongMethod")
    private fun makeHttpRequest(httpMonitorCheckerData: HttpMonitorDataRecord): HttpResponse {
        val requestConfig = RequestConfig.custom().apply {
            if (httpMonitorCheckerData.maxRedirects == null) {
                setRedirectsEnabled(false)
            } else {
                setRedirectsEnabled(true)
                setMaxRedirects(httpMonitorCheckerData.maxRedirects.toInt())
            }
            setResponseTimeout(Timeout.of(Duration.ofSeconds(8)))
        }.build()

        val httpBuilder = HttpClientBuilder.create()
            .setDefaultRequestConfig(requestConfig)

        if (httpMonitorCheckerData.ignoreTLS) {
            val sslFactory = SSLConnectionSocketFactory(
                SSLContexts.custom()
                    .loadTrustMaterial(null) { _, _ -> true }
                    .build(),
                NoopHostnameVerifier(),
            )
            httpBuilder
                .setConnectionManager(
                    PoolingHttpClientConnectionManagerBuilder.create()
                        .setSSLSocketFactory(sslFactory)
                        .build(),
                )
                .setConnectionManagerShared(true)
        }

        val factory = HttpComponentsClientHttpRequestFactory(httpBuilder.build()).apply {
            setConnectTimeout(4000)
            setReadTimeout(4000)
        }

        try {
            val headers = HttpHeaders().apply {
                add("Accept", "*/*")
            }

            headers.add(
                "Content-Type",
                when (httpMonitorCheckerData.contentType) {
                    HttpMonitorDataContentType.HTML -> "text/html"
                    HttpMonitorDataContentType.JSON -> "application/json"
                    HttpMonitorDataContentType.XML -> "application/xml"
                },
            )

            httpMonitorCheckerData.authType?.let {
                headers.addBasicAuthString(
                    httpMonitorCheckerData.basicAuthDataUsername!!,
                    httpMonitorCheckerData.basicAuthDataPassword!!,
                )
            }

            val restTemplate = puRestTemplate().apply {
                requestFactory = factory
            }

            val responseType: Class<*> = if (httpMonitorCheckerData.searchTerm == null) {
                Void::class.java
            } else {
                String::class.java
            }

            val response = restTemplate.exchange(
                httpMonitorCheckerData.url,
                httpMonitorCheckerData.method.toHttpMethod(),
                HttpEntity(httpMonitorCheckerData.body ?: "", headers),
                responseType,
            )
            val httpStatus = try {
                HttpStatus.valueOf(
                    response.statusCode.value(),
                )
            } catch (_: IllegalArgumentException) {
                HttpStatus.valueOf(200)
            }

            return HttpResponse(
                httpStatus,
                httpStatus.let { "${it.value()} - ${it.reasonPhrase}" },
                responseBody = response.body,
            )
        } catch (ex: HttpClientErrorException) {
            // Handle 4xx errors (e.g., Not Found, Bad Request)
            return HttpResponse(
                HttpStatusCode.valueOf(ex.statusCode.value()),
                "${ex.statusCode.value()} - ${ex.statusText}",
            )
        } catch (ex: HttpServerErrorException) {
            // Handle 5xx errors (e.g., Internal Server Error, Service Unavailable)
            return HttpResponse(
                HttpStatusCode.valueOf(ex.statusCode.value()),
                "${ex.statusCode.value()} - ${ex.statusText}",
            )
        } catch (ex: RestClientResponseException) {
            // Handle other response-related exceptions
            return HttpResponse(
                HttpStatusCode.valueOf(ex.statusCode.value()),
                "${ex.statusCode.value()} - ${ex.statusText}",
                ex.responseBodyAsString,
            )
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
//    private fun getTLSIgnoringRequestFactory2() = HttpComponentsClientHttpRequestFactory(
//        HttpClientBuilder.create()
//            .setConnectionManager(
//                PoolingHttpClientConnectionManager(
//                    RegistryBuilder.create<ConnectionSocketFactory>()
//                        .register(
//                            URIScheme.HTTPS.getId(),
//                            SSLConnectionSocketFactory(
//                                SSLContextBuilder.create()
//                                    .loadTrustMaterial { _: Array<X509Certificate?>?, _: String? -> true }
//                                    .build(),
//                            ),
//                        )
//                        .register(URIScheme.HTTP.getId(), PlainConnectionSocketFactory())
//                        .build(),
//                ),
//            )
//            .setConnectionManagerShared(true)
//            .build(),
//    )

    /**
     * Checks if the given HTTP status code is within any of the allowed ranges.
     *
     * @param statusCode the response status
     * @return true if statusCode is in any of the allowed ranges, false otherwise
     */
    private fun List<IntRange>.isStatusCodeAllowed(
        statusCode: HttpStatusCode,
    ): Boolean {
        val code = statusCode.value()
        for (statusCodeRange in this) {
            if (code in statusCodeRange) {
                return true
            }
        }
        return false
    }
}
