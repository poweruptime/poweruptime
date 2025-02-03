package org.poweruptime.backend.features.authentication.config

import org.poweruptime.backend.Routes
import org.poweruptime.backend.features.authentication.permission.PermissionEvaluator
import org.poweruptime.backend.features.authentication.service.AuthDetailsService
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.annotation.web.invoke
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.HttpStatusEntryPoint

@Configuration
@EnableMethodSecurity
@EnableWebSecurity
class WebSecurityConfig(
    val authDetailsService: AuthDetailsService,
    @Qualifier(AuthUtils.JWT_ACCESS_TOKEN_DECODER) val accessTokenDecoder: JwtDecoder,
) {

    /**
     * SecurityFilterChain for user authentication
     */
    @Bean
    fun filterChainUser(http: HttpSecurity): SecurityFilterChain {
        http {
            cors { }
            csrf { disable() }

            sessionManagement {
                sessionCreationPolicy = SessionCreationPolicy.STATELESS
            }

            securityMatcher("/**")

            authorizeHttpRequests {
                Routes.USER_UNSECURED.forEach {
                    authorize(it, permitAll)
                }

                authorize(anyRequest, authenticated)
            }

            oauth2ResourceServer {
                jwt {
                    val jwtGrantedAuthoritiesConverter = JwtGrantedAuthoritiesConverter()
                    jwtGrantedAuthoritiesConverter.setAuthoritiesClaimName("scope")
                    jwtGrantedAuthoritiesConverter.setAuthorityPrefix("")

                    val customJwtAuthenticationConverter = JwtAuthenticationConverter()
                    customJwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter)

                    jwtAuthenticationConverter = customJwtAuthenticationConverter
                    jwtDecoder = accessTokenDecoder
                }
            }

            exceptionHandling {
                authenticationEntryPoint = HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)
            }
        }

        http.userDetailsService(authDetailsService)

        return http.build()
    }

    @Bean
    fun methodSecurityExpressionHandler(permissionEvaluator: PermissionEvaluator): MethodSecurityExpressionHandler {
        val handler = DefaultMethodSecurityExpressionHandler()
        handler.setPermissionEvaluator(permissionEvaluator)
        return handler
    }
}
