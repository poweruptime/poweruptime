package org.poweruptime.backend

object Routes {
    private const val ACTUATOR = "/actuator/**"
    private const val PUBLIC = "/v1/public/**"
    private const val USER_AUTH = "/v1/auth/**"

    val ipRateLimited = buildList {
        add(USER_AUTH)
        add("/v1/profile/email")
    }

    val userIdRateLimited = buildList {
        add("/v1/profile/email")
        add("/v1/file")
    }

    private val SWAGGER = buildList {
        add("/swagger/**")
        add("/swagger-ui/**")
        add("/v3/api-docs/**")
    }

    val USER_UNSECURED = buildList {
        addAll(SWAGGER)
        add(USER_AUTH)
        add(PUBLIC)
        add(ACTUATOR)
    }
}
