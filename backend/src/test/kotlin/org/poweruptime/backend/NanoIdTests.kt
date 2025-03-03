package org.poweruptime.backend

import org.junit.jupiter.api.Test
import org.poweruptime.backend.core.utils.NANO_ID_DEFAULT_LENGTH
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.core.utils.RandomGenerator

class NanoIdTests {
    @Test
    fun `test nano id`() {
        println("\nMax")
        repeat(10) {
            println(RandomGenerator.nanoId(NANO_ID_MAX_LENGTH))
        }
        println("\nSmall")
        repeat(10) {
            println(RandomGenerator.nanoId(NANO_ID_SMALL_LENGTH))
        }

        println("\nDefault")
        repeat(10) {
            println(RandomGenerator.nanoId(NANO_ID_DEFAULT_LENGTH))
        }
    }
}
