package org.poweruptime.backend.features.info.versionChecker.dto

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test

class VersionInfoTest {
    private fun parse(version: String) = requireNotNull(VersionInfo.fromString(version, "commit-url"))

    @Test
    fun `parse stable and both beta formats`() {
        assertThat(parse("0.6.1").isBeta).isFalse()
        assertThat(parse("0.6.1-beta.0").betaNumber).isZero()
        assertThat(parse("0.6.0-beta-1794308547").betaNumber).isEqualTo(1794308547L)
        assertThat(parse("0.6.1-beta.0").originalVersion).isEqualTo("0.6.1-beta.0")
    }

    @Test
    fun `order migrated beta releases and stable promotion`() {
        val versions = listOf("0.6.0-beta-1794308547", "0.6.1-beta.0", "0.6.1-beta.2", "0.6.1-beta.10", "0.6.1")
        assertThat(versions.map(::parse).reversed().sorted().map { it.originalVersion }).isEqualTo(versions)
    }

    @Test
    fun `reject invalid and overflowing versions without throwing`() {
        listOf(
            "local",
            "0.6.1-beta",
            "0.6.1-beta.x",
            "0.6.1-beta.-1",
            "0.6.1-beta.1.extra",
            "999999999999.0.0",
            "0.6.1-beta.999999999999999999999",
        ).forEach {
            assertThat(VersionInfo.fromString(it, "")).isNull()
        }
    }
}
