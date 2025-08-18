package org.poweruptime.backend.features.authentication.service

import dev.turingcomplete.kotlinonetimepassword.GoogleAuthenticator
import jakarta.transaction.Transactional
import org.apache.commons.codec.binary.Base32
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.features.authentication.MFACodeIncorrectException
import org.poweruptime.backend.features.authentication.MFACodeRequiredException
import org.poweruptime.backend.features.authentication.domain.MFABackupCodeRepository
import org.poweruptime.backend.features.authentication.domain.MFARepository
import org.poweruptime.backend.features.authentication.model.MFA
import org.poweruptime.backend.features.authentication.model.MFABackupCode
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.mail.emails.MFALowBackupCodesEmail
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import kotlin.jvm.Throws

@Service
class MFAService(
    private val passwordEncoder: PasswordEncoder,
    private val systemEmailService: SystemEmailService,
    private val mfaRepository: MFARepository,
    private val mfaBackupCodeRepository: MFABackupCodeRepository,
) : AEntityService<MFA>(mfaRepository) {

    fun getByUserId(userId: String) = mfaRepository.findByUserId(userId)

    @Throws(MFACodeIncorrectException::class, MFACodeRequiredException::class)
    fun validate(userId: String, code: String?) {
        mfaRepository.findByUserId(userId)?.let { mfa ->
            if (!mfa.active) {
                return
            }

            if (code == null) {
                throw MFACodeRequiredException()
            }

            if (!isValid(mfa.secret, code)) {
                val backupCodes = mfaBackupCodeRepository.findByMFAId(mfa.id)
                val backupCode = backupCodes.matches(rawCode = code) ?: throw MFACodeIncorrectException()

                mfaBackupCodeRepository.invalidateCode(backupCode.id)

                val remainingBackupCodes = backupCodes.size - 1

                if (remainingBackupCodes < 5) {
                    systemEmailService.queueEmail(
                        MFALowBackupCodesEmail(
                            user = mfa.user,
                            backupCodesCount = remainingBackupCodes,
                        ),
                    )
                }
            }
        }
    }

    @Transactional
    fun create(user: User): MFA {
        mfaRepository.findByUserId(user.id)?.let {
            if (it.active) {
                throw BadRequestException("MFA already confirmed")
            }

            return it
        }

        val mfa = save(MFA(user = user, active = false))

        return mfa
    }

    @Transactional
    fun activate(userId: String, code: String): List<String> {
        val mfa = mfaRepository.findByUserId(userId) ?: throw BadRequestException("Setup MFA first")

        if (mfa.active) {
            throw BadRequestException("MFA already active")
        }

        if (!isValid(mfa.secret, code)) {
            throw BadRequestException("Code invalid")
        }

        mfa.active = true
        save(mfa)

        val rawBackupCodes = buildList { repeat(10) { add(RandomGenerator.nanoId(NANO_ID_MAX_LENGTH)) } }

        assert(rawBackupCodes.size == 10)

        mfaBackupCodeRepository.saveAll(
            rawBackupCodes.map { rawBackupCode ->
                MFABackupCode(
                    mfa = mfa,
                    codeHash = passwordEncoder.encode(rawBackupCode),
                )
            },
        )

        return rawBackupCodes
    }

    @Transactional
    fun delete(user: User) {
        mfaRepository.findByUserId(user.id)?.let { mfa ->
            mfaBackupCodeRepository.findByMFAId(mfa.id).forEach {
                mfaBackupCodeRepository.deleteById(it.id)
            }

            deleteById(mfa.id)

            mfaBackupCodeRepository.flush()
            flush()
        }
    }

    private fun isValid(secret: String, code: String): Boolean {
        val plainTextSecret = secret.toByteArray(Charsets.UTF_8)
        val base32EncodedSecret = Base32().encode(plainTextSecret)

        return GoogleAuthenticator(base32secret = base32EncodedSecret).isValid(code)
    }

    private fun List<MFABackupCode>.matches(rawCode: String): MFABackupCode? =
        filter {
            it.valid
        }.find {
            passwordEncoder.matches(rawCode, it.codeHash)
        }
}
