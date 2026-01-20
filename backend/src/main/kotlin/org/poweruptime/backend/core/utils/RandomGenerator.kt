package org.poweruptime.backend.core.utils

import io.viascom.nanoid.NanoId
import java.security.SecureRandom

/**
 * Contains: a..z A..Z 0..9
 * Removed big letters: I J N O Q V
 * Removed small letters: d i l n q v
 * Removed numbers: 0
 */
private const val NANO_ID_SET = "123456789ABCDEFGHKLMPRSTUWXYZabcefghjkmoprstuwxyz"
private val NANO_ID_BYTES_FACTOR = NanoId.calculateAdditionalBytesFactor(NANO_ID_SET)

const val NANO_ID_MAX_LENGTH = 25
const val NANO_ID_DEFAULT_LENGTH = 21
const val NANO_ID_SMALL_LENGTH = 12

object RandomGenerator {
    private val random: SecureRandom = SecureRandom()

    fun int(min: Int = 0, max: Int = 10): Int = random.nextInt(min, max + 1)

    fun nanoId(size: Int = NANO_ID_SMALL_LENGTH) = NanoId.generate(size, NANO_ID_SET, NANO_ID_BYTES_FACTOR)
}
