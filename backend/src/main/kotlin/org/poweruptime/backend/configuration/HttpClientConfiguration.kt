package org.poweruptime.backend.configuration

import org.apache.hc.client5.http.config.ConnectionConfig
import org.apache.hc.client5.http.config.RequestConfig
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager
import org.apache.hc.core5.util.Timeout
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary
import org.springframework.http.client.ClientHttpRequestFactory
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory
import org.springframework.web.client.RestClient

private fun clientHttpRequestFactory(): ClientHttpRequestFactory {
    val connectionConfig = ConnectionConfig
        .custom()
        .setConnectTimeout(Timeout.ofMilliseconds(4000))
        .setSocketTimeout(Timeout.ofMilliseconds(4000))
        .build()

    val connectionManager = PoolingHttpClientConnectionManager().apply {
        setDefaultConnectionConfig(connectionConfig)
    }

    val httpClient = HttpClientBuilder
        .create()
        .setConnectionManager(connectionManager)
        .setDefaultRequestConfig(
            RequestConfig
                .custom()
                .setConnectionRequestTimeout(Timeout.ofMilliseconds(4000))
                .setResponseTimeout(Timeout.ofMilliseconds(4000))
                .build(),
        ).build()

    return HttpComponentsClientHttpRequestFactory(httpClient)
}

@Configuration
class HttpClientConfiguration {
    @Primary
    @Bean
    fun restClient(): RestClient = RestClient
        .builder()
        .requestFactory(clientHttpRequestFactory())
        .build()
}
