package org.poweruptime.backend

object Routes {
    private const val PUBLIC = "/v1/public/**"

    const val USER_AUTH = "/v1/auth/**"

    val rateLimited = buildList {
        add(USER_AUTH)
        add("/v1/profile/email")
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
    }
}
