package org.poweruptime.backend.core

import org.hibernate.HibernateException
import org.hibernate.annotations.IdGeneratorType
import org.hibernate.engine.spi.SharedSessionContractImplementor
import org.hibernate.id.IdentifierGenerator
import org.poweruptime.backend.core.utils.NANO_ID_DEFAULT_LENGTH
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.core.utils.RandomGenerator
import java.io.Serializable

class SmallNanoIdGenerator : IdentifierGenerator {
    @Throws(HibernateException::class)
    override fun generate(session: SharedSessionContractImplementor?, `object`: Any?): Serializable {
        return RandomGenerator.nanoId(NANO_ID_SMALL_LENGTH)
    }
}

@IdGeneratorType(SmallNanoIdGenerator::class)
@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.FIELD)
annotation class SmallNanoId

class DefaultNanoIdGenerator : IdentifierGenerator {
    @Throws(HibernateException::class)
    override fun generate(session: SharedSessionContractImplementor?, `object`: Any?): Serializable {
        return RandomGenerator.nanoId(NANO_ID_DEFAULT_LENGTH)
    }
}

@IdGeneratorType(DefaultNanoIdGenerator::class)
@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.FIELD)
annotation class DefaultNanoId

class MaxNanoIdGenerator : IdentifierGenerator {
    @Throws(HibernateException::class)
    override fun generate(session: SharedSessionContractImplementor?, `object`: Any?): Serializable {
        return RandomGenerator.nanoId(NANO_ID_MAX_LENGTH)
    }
}

@IdGeneratorType(MaxNanoIdGenerator::class)
@Retention(AnnotationRetention.RUNTIME)
@Target(AnnotationTarget.FIELD)
annotation class MaxNanoId
