package org.poweruptime.backend.configuration

import org.apache.hc.client5.http.impl.classic.HttpClientBuilder
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter
import org.springframework.web.client.RestTemplate

fun puRestTemplate() = RestTemplate().apply {
    requestFactory = HttpComponentsClientHttpRequestFactory(
        HttpClientBuilder.create().build(),
    ).apply {
        setConnectTimeout(4000)
        setReadTimeout(4000)
    }

    // Now modify the default Jackson converter (if present) instead of adding a new one
    val converters = messageConverters
    val jacksonConverterIndex = converters.indexOfFirst { it is MappingJackson2HttpMessageConverter }

    if (jacksonConverterIndex != -1) {
        // Replace or update the existing converter
        converters[jacksonConverterIndex] = MappingJackson2HttpMessageConverter().apply {
            // Use your custom ObjectMapper here
            objectMapper = puObjectMapper
        }
    } else {
        // If, for some reason, there's no Jackson converter at all, add your own
        converters.add(
            MappingJackson2HttpMessageConverter().apply {
                objectMapper = puObjectMapper
            },
        )
    }
}

@Configuration
open class HttpClientConfiguration {
    @Bean
    open fun restTemplate(): RestTemplate = puRestTemplate()
}
