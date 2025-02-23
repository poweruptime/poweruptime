package org.poweruptime.backend.features.fileUpload

import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant

@Repository
interface FileRepository : org.poweruptime.backend.core.domain.Repository<File> {
    @Query(
        """
        select file from File file where file.fileId=:fileId
    """,
    )
    fun findByFileId(@Param("fileId") fileId: String): File?

    @Query(
        """
        select file from File file
        join file.statusPage sp
        where file.createdAt > :createdAfter and sp is null
    """,
    )
    fun findUnusedCreatedAfterThan(@Param("createdAfter") createdAfter: Instant): List<File>
}
