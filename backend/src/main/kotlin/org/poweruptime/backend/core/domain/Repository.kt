package org.poweruptime.backend.core.domain

import org.poweruptime.backend.core.exceptions.NotFoundException
import org.poweruptime.backend.core.models.IEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.NoRepositoryBean

@NoRepositoryBean
interface Repository<T : IEntity> : JpaRepository<T, String>

public fun <T : IEntity> Repository<T>.findByIdOrThrow(id: String): T =
    findById(id).orElseThrow { throw NotFoundException("""${javaClass.simpleName} not found""") }
