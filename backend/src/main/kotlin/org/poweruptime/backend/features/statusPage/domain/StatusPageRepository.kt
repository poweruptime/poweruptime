package org.poweruptime.backend.features.statusPage.domain

import org.poweruptime.backend.core.domain.ISoftDeleteRepository
import org.poweruptime.backend.features.statusPage.model.StatusPage
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface StatusPageRepository : ISoftDeleteRepository<StatusPage>, JpaSpecificationExecutor<StatusPage> {
    @Query("select sp from StatusPage sp where sp.slug = :slug")
    fun findBySlug(@Param("slug") slug: String): StatusPage?

    @Query(
        """
            select sp from StatusPage sp join sp.domainNames dn where dn.name = :dN
    """,
    )
    fun findByDomainName(@Param("dN") domainName: String): StatusPage?
}
