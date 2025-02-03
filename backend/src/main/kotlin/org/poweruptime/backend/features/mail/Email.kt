package org.poweruptime.backend.features.mail

import org.thymeleaf.context.Context

interface Email {
    val context: Context
    val templateName: String
    val to: String
    val subject: String
}
