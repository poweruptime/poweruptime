package org.poweruptime.backend.core.utils

import org.apache.commons.codec.binary.Base32
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.springframework.http.HttpHeaders
import java.util.Base64

fun String?.emptyToNull(): String? = if (isNullOrEmpty()) null else this

fun String.toBase32EncodedString(): String = Base32().encodeToString(this.toByteArray(Charsets.UTF_8))
fun String.toBase32EncodedByteArray(): ByteArray = Base32().encode(this.toByteArray(Charsets.UTF_8))

private const val ABBREVIATOR = "..."
fun String.abbreviate(length: Int): String = if (this.length > length) {
    "${this.substring(0 , length - ABBREVIATOR.length)}$ABBREVIATOR"
} else {
    this
}

fun String.lowercaseExceptFirstLetter(): String {
    // If the string is empty or has only one character, return it as is
    if (this.length <= 1) return this

    // Keep the first character as it is, lowercase the rest
    return this[0] + this.substring(1).lowercase()
}

fun HttpHeaders.addBasicAuthString(username: String, password: String) = apply {
    val credentials = "$username:$password"
    val encodedCredentials = Base64.getEncoder().encodeToString(credentials.toByteArray())
    add("Authorization", "Basic $encodedCredentials")
}

fun <T : Any> T?.orThrowNotFound(message: String = "Property not found"): T = this ?: throw NotFoundException(message)
