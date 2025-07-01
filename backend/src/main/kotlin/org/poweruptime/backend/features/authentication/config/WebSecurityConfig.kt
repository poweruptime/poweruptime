package org.poweruptime.backend.features.authentication.config

import org.poweruptime.backend.Routes
import org.poweruptime.backend.features.authentication.permission.PermissionEvaluator
import org.poweruptime.backend.features.authentication.service.AuthDetailsService
import org.poweruptime.backend.features.authentication.service.OAuth2LoginSuccessHandler
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.annotation.Order
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
    private val oauth2LoginSuccessHandler: OAuth2LoginSuccessHandler,
    private val authDetailsService: AuthDetailsService,
    @param:Qualifier(AuthUtils.JWT_ACCESS_TOKEN_DECODER) private val accessTokenDecoder: JwtDecoder,
) {
    @Bean
    @Order(1)
    fun oauth2LoginFilterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            securityMatcher("/oauth2/**", "/login/**")
            csrf { disable() }
            cors { }
            sessionManagement { sessionCreationPolicy = SessionCreationPolicy.STATELESS }

            authorizeHttpRequests { authorize(anyRequest, permitAll) }

            oauth2Login {
                authenticationSuccessHandler = oauth2LoginSuccessHandler
            }
        }
        return http.build()
    }

    // 2) Your existing resource-server chain
    @Bean
    @Order(2)
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
        @Suppress("UsePropertyAccessSyntax")
        handler.setPermissionEvaluator(permissionEvaluator)
        return handler
    }
}
