package org.poweruptime.backend.features.mail

interface EmailSender {
    val host: String
    val port: Int
    val username: String
    val password: String
}

data class EmailSenderDto(
    override val host: String,
    override val port: Int,
    override val username: String,
    override val password: String,
) : EmailSender

data class EmailDto(
    val to: String,
    val subject: String,
    val plain: String,
    val html: String? = null,
) {
    constructor(email: Email, template: EmailTemplateResponse) : this(
        to = email.to,
        subject = email.subject,
        template.plain,
        template.html,
    )
}

data class EmailTemplateResponse(val plain: String, val html: String)
