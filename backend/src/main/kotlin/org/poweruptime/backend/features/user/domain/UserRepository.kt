package org.poweruptime.backend.features.user.domain

import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.model.User
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface UserRepository : org.poweruptime.backend.core.domain.Repository<User>, JpaSpecificationExecutor<User> {
    fun findUserByEmail(email: String): User?

    fun findUserById(id: String): User?

    @Query("select count(u) > 0 from User u where u.role = :role")
    fun minOneUserWithRoleExists(@Param("role") role: SystemRole): Boolean
}
