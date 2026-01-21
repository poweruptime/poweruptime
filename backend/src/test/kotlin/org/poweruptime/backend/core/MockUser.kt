package org.poweruptime.backend.core

import org.poweruptime.backend.features.authentication.config.AuthUtils
import org.springframework.core.annotation.AliasFor
import org.springframework.security.test.context.support.WithUserDetails

@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.FUNCTION, AnnotationTarget.TYPE)
@WithUserDetails
annotation class MockUser(
    @get:AliasFor(annotation = WithUserDetails::class)
    val value: String = MockUsers.USER1,
    @get:AliasFor(annotation = WithUserDetails::class, attribute = "userDetailsServiceBeanName")
    val userDetailsServiceBeanName: String = AuthUtils.AUTH_DETAILS_SERVICE,
)

@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.FUNCTION, AnnotationTarget.TYPE)
@WithUserDetails
annotation class MockAdmin(
    @get:AliasFor(annotation = WithUserDetails::class)
    val value: String = MockUsers.ADMIN,
    @get:AliasFor(annotation = WithUserDetails::class, attribute = "userDetailsServiceBeanName")
    val userDetailsServiceBeanName: String = AuthUtils.AUTH_DETAILS_SERVICE,
)

object MockUsers {
    const val ADMIN = "ZD5CjpPYSPEk" // admin@admin.org

    const val USER1 = "ccYmAsus39gG" // test1@test.org
    const val USER2 = "8BS4AaxuYG9h" // test2@test.org
    const val USER3 = "2XxpcofD6Ubg" // test3@test.org
    const val USER4 = "phECfcYSejyt" // test4@test.org
}
