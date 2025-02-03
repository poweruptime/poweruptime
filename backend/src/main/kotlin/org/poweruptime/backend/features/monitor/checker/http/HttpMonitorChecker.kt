package org.poweruptime.backend.features.monitor.checker.http

import org.apache.hc.client5.http.impl.classic.HttpClientBuilder
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder
import org.apache.hc.client5.http.ssl.NoopHostnameVerifier
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactory
import org.apache.hc.core5.ssl.SSLContexts
import org.poweruptime.backend.configuration.puRestTemplate
import org.poweruptime.backend.features.monitor.core.*
import org.poweruptime.backend.features.monitor.model.Monitor
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory
import org.springframework.web.client.HttpClientErrorException
import org.springframework.web.client.HttpServerErrorException
import org.springframework.web.client.ResourceAccessException
import org.springframework.web.client.RestClientException
import org.springframework.web.client.RestClientResponseException
import kotlin.io.encoding.Base64
import kotlin.io.encoding.ExperimentalEncodingApi

class HttpMonitorChecker : MonitorChecker {
    private val logger: Logger = LoggerFactory.getLogger(HttpMonitorChecker::class.java)

    override val type = MonitorCheckerType.HTTP

    @OptIn(ExperimentalEncodingApi::class)
    @Suppress("ReturnCount", "DestructuringDeclarationWithTooManyEntries", "CyclomaticComplexMethod", "LongMethod")
    override fun execute(monitor: Monitor): CheckResultDto {
        val httpMonitorCheckerData = monitor.checker as HttpMonitorCheckerData

        val restTemplate = puRestTemplate()

        val headers = HttpHeaders().apply {
            add("Accept", "*/*")
        }

        headers.add(
            "Content-Type",
            when (httpMonitorCheckerData.contentType) {
                HttpMonitorCheckerDataContentType.HTML -> "text/html"
                HttpMonitorCheckerDataContentType.JSON -> "application/json"
                HttpMonitorCheckerDataContentType.XML -> "application/xml"
            },
        )

        httpMonitorCheckerData.authType?.let {
            headers.add(
                "Authorization",
                when (it) {
                    HttpMonitorCheckerDataAuthType.BASIC -> {
                        val auth = """${
                            httpMonitorCheckerData.basicAuthDataUsername
                        }:${httpMonitorCheckerData.basicAuthDataPassword}"""
                        "Basic " + String(Base64.encodeToByteArray(auth.toByteArray()))
                    }
                },
            )
        }

        if (httpMonitorCheckerData.ignoreTLS) {
            restTemplate.requestFactory = getTLSIgnoringRequestFactory()
        }

        logger.debug(
            """Sending http request for monitor "{}" with id "{}", url: "{}"""",
            monitor.name,
            monitor.id,
            httpMonitorCheckerData.url,
        )

        val result = MonitoringResultHandler()
        @Suppress("TooGenericExceptionCaught")
        try {
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

            val successMessage = try {
                HttpStatus.valueOf(
                    response.statusCode.value(),
                )
            } catch (e: IllegalArgumentException) {
                if (response.statusCode.value() == 306) {
                    HttpStatus.valueOf(305)
                } else {
                    HttpStatus.valueOf(200)
                }
            }.let { "${it.value()} - ${it.reasonPhrase}" }

            if (httpMonitorCheckerData.searchTerm == null) {
                return result.success(successMessage)
            }

            val responseBody = response.body ?: return result.error("HTTP Body not found")

            if (!(responseBody as String).contains(httpMonitorCheckerData.searchTerm)) {
                return result.error("Search term not found in body", responseBody)
            }

            return result.success(successMessage)
        } catch (ex: HttpClientErrorException) {
            // Handle 4xx errors (e.g., Not Found, Bad Request)
            return result.error(
                "${ex.statusCode.value()} - ${ex.statusText}",
                ex.responseBodyAsString,
            )
        } catch (ex: HttpServerErrorException) {
            // Handle 5xx errors (e.g., Internal Server Error, Service Unavailable)
            return result.error(
                "${ex.statusCode.value()} - ${ex.statusText}",
                ex.responseBodyAsString,
            )
        } catch (ex: RestClientResponseException) {
            // Handle other response-related exceptions
            return result.error(
                "${ex.statusText} - HTTP error",
                ex.responseBodyAsString,
            )
        } catch (ex: ResourceAccessException) {
            // Handle connection errors (e.g., timeout, unreachable host)
            return result.error("Connection error", ex.message)
        } catch (ex: RestClientException) {
            // Catch-all for other RestTemplate-related exceptions
            return result.error("Unexpected error", ex.message)
        }
    }

    private fun getTLSIgnoringRequestFactory() = HttpComponentsClientHttpRequestFactory(
        HttpClientBuilder.create()
            .setConnectionManager(
                PoolingHttpClientConnectionManagerBuilder
                    .create()
                    .setSSLSocketFactory(
                        SSLConnectionSocketFactory(
                            SSLContexts.custom().loadTrustMaterial(null) { _, _ -> true }.build(),
                            NoopHostnameVerifier(),
                        ),
                    )
                    .build(),
            )
            .setConnectionManagerShared(true)
            .build(),
    )

    private fun HttpMonitorCheckerDataMethod.toHttpMethod() = when (this) {
        HttpMonitorCheckerDataMethod.GET -> HttpMethod.GET
        HttpMonitorCheckerDataMethod.POST -> HttpMethod.POST
        HttpMonitorCheckerDataMethod.PUT -> HttpMethod.PUT
        HttpMonitorCheckerDataMethod.PATCH -> HttpMethod.PATCH
        HttpMonitorCheckerDataMethod.DELETE -> HttpMethod.DELETE
        HttpMonitorCheckerDataMethod.HEAD -> HttpMethod.HEAD
        HttpMonitorCheckerDataMethod.OPTIONS -> HttpMethod.OPTIONS
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
}
