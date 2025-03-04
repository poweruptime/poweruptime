package org.poweruptime.backend.features.mail

interface EmailSender {
    val host: String
    val port: Int
    val username: String
    val password: String
    val security: EmailSecurity
    val ignoreTLSErrors: Boolean
}

data class EmailSenderDto(
    override val host: String,
    override val port: Int,
    override val username: String,
    override val password: String,
    override val security: EmailSecurity,
    override val ignoreTLSErrors: Boolean,
) : EmailSender

data class EmailDto(
    val to: Set<String>,
    val subject: String,
    val plain: String,
    val html: String? = null,
    val cc: Set<String>? = null,
    val bcc: Set<String>? = null,
) {
    constructor(email: Email, template: EmailTemplateResponse) : this(
        to = email.to,
        subject = email.subject,
        plain = template.plain,
        html = template.html,
        cc = email.cc,
        bcc = email.bcc,
    )
}

data class EmailTemplateResponse(val plain: String, val html: String)
