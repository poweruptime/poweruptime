package org.poweruptime.backend.features.mail

import org.thymeleaf.context.Context

interface Email {
    val context: Context
    val templateName: String
    val to: Set<String>
    val subject: String
    val cc: Set<String>?
    val bcc: Set<String>?
}
