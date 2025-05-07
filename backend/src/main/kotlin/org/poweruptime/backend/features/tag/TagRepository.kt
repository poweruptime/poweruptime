package org.poweruptime.backend.features.tag

import org.poweruptime.backend.core.domain.ISoftDeleteRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

@Repository
interface TagRepository : ISoftDeleteRepository<Tag>, JpaSpecificationExecutor<Tag> {
    @Query(
        """
        SELECT t FROM Tag t
        WHERE t.team.id = :teamId AND t.name IN :names
    """,
    )
    fun findByTeamIdAndNames(@Param("teamId") teamId: String, @Param("names") names: List<String>): List<Tag>
}
