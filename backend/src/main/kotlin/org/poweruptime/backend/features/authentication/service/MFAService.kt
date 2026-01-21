package org.poweruptime.backend.features.authentication.service

import dev.turingcomplete.kotlinonetimepassword.GoogleAuthenticator
import org.apache.commons.codec.binary.Base32
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.batchInsert
import org.jetbrains.exposed.v1.jdbc.deleteWhere
import org.jetbrains.exposed.v1.jdbc.insertAndGetId
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.findById
import org.poweruptime.backend.core.domain.findByIdOrThrow
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.features.authentication.MFACodeIncorrectException
import org.poweruptime.backend.features.authentication.MFACodeRequiredException
import org.poweruptime.backend.features.authentication.domain.findByMFAId
import org.poweruptime.backend.features.authentication.domain.invalidateCodeById
import org.poweruptime.backend.features.authentication.model.MFA
import org.poweruptime.backend.features.authentication.model.MFABackupCode
import org.poweruptime.backend.features.authentication.model.MFABackupCodeRecord
import org.poweruptime.backend.features.authentication.model.MFARecord
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.authentication.model.rowToMFARecord
import org.poweruptime.backend.features.mail.emails.MFALowBackupCodesEmail
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.jvm.Throws

@Service
@Transactional(readOnly = true)
class MFAService(private val passwordEncoder: PasswordEncoder, private val systemEmailService: SystemEmailService) {
    fun findById(id: ULong): MFARecord? = MFA.findById(id) {
        MFA.rowToMFARecord(it)
    }

    fun getById(id: ULong): MFARecord = MFA.findByIdOrThrow(id) {
        MFA.rowToMFARecord(it)
    }

    @Throws(MFACodeIncorrectException::class, MFACodeRequiredException::class)
    @Transactional
    fun validate(user: UserRecord, code: String?) {
        user.mfaId
            ?.let {
                findById(it)
            }?.let { mfa ->
                if (!mfa.active) {
                    return
                }

                if (code == null) {
                    throw MFACodeRequiredException()
                }

                if (!isValid(mfa.secret, code)) {
                    val backupCodes = MFABackupCode.findByMFAId(mfa.id)
                    val backupCode = backupCodes.matches(rawCode = code) ?: throw MFACodeIncorrectException()

                    MFABackupCode.invalidateCodeById(backupCode.id)

                    val remainingBackupCodes = backupCodes.size - 1

                    if (remainingBackupCodes < 5) {
                        systemEmailService.queueEmail(
                            MFALowBackupCodesEmail(
                                user = user,
                                backupCodesCount = remainingBackupCodes,
                            ),
                        )
                    }
                }
            }
    }

    @Transactional
    fun create(userId: ULong, mfaId: ULong?): MFARecord {
        if (mfaId != null) {
            val mfa = getById(mfaId)

            if (mfa.active) {
                throw BadRequestException("MFA already confirmed")
            }

            return mfa
        }

        return getById(MFA.insertAndGetId {}.value).also { mfa ->
            User.update({ User.id eq userId }) {
                it[User.mfaId] = mfa.id
            }
        }
    }

    @Transactional
    fun activate(mfaId: ULong, code: String): List<String> {
        val mfa = getById(mfaId)

        if (mfa.active) {
            throw BadRequestException("MFA already active")
        }

        if (!isValid(mfa.secret, code)) {
            throw BadRequestException("Code invalid")
        }

        MFA.update({ MFA.id eq mfa.id }) {
            it[MFA.active] = true
        }

        val rawBackupCodes = buildList { repeat(10) { add(RandomGenerator.nanoId(NANO_ID_MAX_LENGTH)) } }

        assert(rawBackupCodes.size == 10)

        MFABackupCode.batchInsert(rawBackupCodes) { rawBackupCode ->
            this[MFABackupCode.mfaId] = mfa.id
            this[MFABackupCode.codeHash] = passwordEncoder.encode(rawBackupCode)!!
            this[MFABackupCode.valid] = true
        }

        return rawBackupCodes
    }

    @Transactional
    fun delete(mfaId: ULong) {
        MFABackupCode.deleteWhere { MFABackupCode.mfaId eq mfaId }
        User.update({ User.mfaId eq mfaId }) {
            it[User.mfaId] = null
        }

        MFA.deleteWhere { MFA.id eq mfaId }
    }

    private fun isValid(secret: String, code: String): Boolean {
        val plainTextSecret = secret.toByteArray(Charsets.UTF_8)
        val base32EncodedSecret = Base32().encode(plainTextSecret)

        return GoogleAuthenticator(base32secret = base32EncodedSecret).isValid(code)
    }

    private fun List<MFABackupCodeRecord>.matches(rawCode: String): MFABackupCodeRecord? = filter {
        it.valid
    }.find {
        passwordEncoder.matches(rawCode, it.codeHash)
    }
}
