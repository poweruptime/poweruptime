package org.poweruptime.backend.configuration

import org.apache.hc.client5.http.config.ConnectionConfig
import org.apache.hc.client5.http.config.RequestConfig
import org.apache.hc.client5.http.impl.classic.HttpClientBuilder
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager
import org.apache.hc.core5.util.Timeout
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.client.ClientHttpRequestFactory
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory
import org.springframework.http.converter.HttpMessageConverter
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter
import org.springframework.web.client.RestClient

private fun clientHttpRequestFactory(): ClientHttpRequestFactory {
    val connectionConfig = ConnectionConfig.custom()
        .setConnectTimeout(Timeout.ofMilliseconds(4000))
        .setSocketTimeout(Timeout.ofMilliseconds(4000))
        .build()

    val connectionManager = PoolingHttpClientConnectionManager().apply {
        setDefaultConnectionConfig(connectionConfig)
    }

    val httpClient = HttpClientBuilder.create()
        .setConnectionManager(connectionManager)
        .setDefaultRequestConfig(
            RequestConfig.custom()
                .setConnectionRequestTimeout(Timeout.ofMilliseconds(4000))
                .setResponseTimeout(Timeout.ofMilliseconds(4000))
                .build(),
        )
        .build()

    return HttpComponentsClientHttpRequestFactory(httpClient)
}

fun configureJacksonConverter(
    converters: MutableList<HttpMessageConverter<*>>,
) {
    val jacksonIndex = converters.indexOfFirst {
        it is MappingJackson2HttpMessageConverter
    }

    val customConverter = MappingJackson2HttpMessageConverter().apply {
        objectMapper = puObjectMapper
    }

    when {
        jacksonIndex != -1 -> converters[jacksonIndex] = customConverter
        else -> converters.add(customConverter)
    }
}

@Configuration
class HttpClientConfiguration {
    @Bean
    fun restClientBuilder(): RestClient.Builder = RestClient.builder()
        .requestFactory(clientHttpRequestFactory())

    @Bean
    fun restClient(builder: RestClient.Builder): RestClient = builder
        .messageConverters { converters -> configureJacksonConverter(converters) }
        .build()
}
