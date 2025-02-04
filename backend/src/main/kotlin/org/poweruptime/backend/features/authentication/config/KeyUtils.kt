package org.poweruptime.backend.features.authentication.config

import org.poweruptime.backend.core.utils.*
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.core.env.Environment
import org.springframework.stereotype.Component
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.nio.file.Files
import java.nio.file.Paths
import java.security.*
import java.security.interfaces.RSAPrivateKey
import java.security.interfaces.RSAPublicKey
import java.security.spec.EncodedKeySpec
import java.security.spec.PKCS8EncodedKeySpec
import java.security.spec.X509EncodedKeySpec
import java.util.*

/**
 * Loading and generating of the keys for the JWT signing
 * If there are no certificates at the given path, they will be created automatically.
 *
 * @author Alexander Kauer
 * @version 1.0.0
 * @since 2022-12-25
 */
@Component
class KeyUtils(
    private val environment: Environment,
    @Value(Config.KEY_DIRECTORY) private val directoryPath: String,
    @Value(Config.KEY_ACCESS_TOKEN_PRIVATE) private val accessTokenPrivateKeyPath: String = "",
    @Value(Config.KEY_ACCESS_TOKEN_PUBLIC) private val accessTokenPublicKeyPath: String = "",
    @Value(Config.KEY_REFRESH_TOKEN_PRIVATE) private val refreshTokenPrivateKeyPath: String = "",
    @Value(Config.KEY_REFRESH_TOKEN_PUBLIC) private val refreshTokenPublicKeyPath: String = "",
) {
    private val absoluteAccessTokenPrivateKeyPath: String = "$directoryPath/$accessTokenPrivateKeyPath"
    private val absoluteAccessTokenPublicKeyPath: String = "$directoryPath/$accessTokenPublicKeyPath"
    private val absoluteRefreshTokenPrivateKeyPath: String = "$directoryPath/$refreshTokenPrivateKeyPath"
    private val absoluteRefreshTokenPublicKeyPath: String = "$directoryPath/$refreshTokenPublicKeyPath"

    val userAccessTokenPublicKey: RSAPublicKey
        get() = accessTokenKeyPair.public as RSAPublicKey

    val userAccessTokenPrivateKey: RSAPrivateKey
        get() = accessTokenKeyPair.private as RSAPrivateKey

    val userRefreshTokenPublicKey: RSAPublicKey
        get() = refreshTokenKeyPair.public as RSAPublicKey

    val userRefreshTokenPrivateKey: RSAPrivateKey
        get() = refreshTokenKeyPair.private as RSAPrivateKey

    private val log = LoggerFactory.getLogger(KeyUtils::class.java)

    private val accessTokenKeyPair: KeyPair by lazy {
        getKeyPair(absoluteAccessTokenPublicKeyPath, absoluteAccessTokenPrivateKeyPath)
    }

    private val refreshTokenKeyPair: KeyPair by lazy {
        getKeyPair(absoluteRefreshTokenPublicKeyPath, absoluteRefreshTokenPrivateKeyPath)
    }

    private fun getKeyPair(publicKeyPath: String, privateKeyPath: String): KeyPair {
        val keyPair: KeyPair
        val publicKeyFile = File(publicKeyPath)
        val privateKeyFile = File(privateKeyPath)

        if (publicKeyFile.exists() && privateKeyFile.exists()) {
            log.info("loading keys from file: {}, {}", publicKeyPath, privateKeyPath)

            val keyFactory: KeyFactory = KeyFactory.getInstance("RSA")

            val publicKeyBytes: ByteArray = Files.readAllBytes(publicKeyFile.toPath())
            val publicKeySpec: EncodedKeySpec = X509EncodedKeySpec(publicKeyBytes)
            val publicKey: PublicKey = keyFactory.generatePublic(publicKeySpec)

            val privateKeyBytes: ByteArray = Files.readAllBytes(privateKeyFile.toPath())
            val privateKeySpec = PKCS8EncodedKeySpec(privateKeyBytes)
            val privateKey: PrivateKey = keyFactory.generatePrivate(privateKeySpec)

            keyPair = KeyPair(publicKey, privateKey)
            return keyPair
        } else {
            require(Arrays.stream(environment.activeProfiles).noneMatch { s -> s.equals("prod") }) {
                "public and private keys don't exist"
            }
        }

        Files.createDirectories(Paths.get(directoryPath))

        try {
            log.info("Generating new public and private keys: {}, {}", publicKeyPath, privateKeyPath)

            val keyPairGenerator = KeyPairGenerator.getInstance("RSA")
            keyPairGenerator.initialize(KEY_SIZE)
            keyPair = keyPairGenerator.generateKeyPair()

            FileOutputStream(publicKeyPath).use { fos ->
                val keySpec = X509EncodedKeySpec(keyPair.public.encoded)
                fos.write(keySpec.encoded)
            }
            FileOutputStream(privateKeyPath).use { fos ->
                val keySpec = PKCS8EncodedKeySpec(keyPair.private.encoded)
                fos.write(keySpec.encoded)
            }
        } catch (e: NoSuchAlgorithmException) {
            throw IllegalStateException(e)
        } catch (e: IOException) {
            throw IllegalStateException(e)
        }

        return keyPair
    }

    companion object {
        private const val KEY_SIZE = 2048
    }
}
