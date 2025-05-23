package org.poweruptime.backend.features.notification.domain

import org.poweruptime.backend.features.notification.model.Notification
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant

@Repository
interface NotificationRepository : JpaRepository<Notification, String>, JpaSpecificationExecutor<Notification> {
    @Query(
        """
            select noti from Notification noti
            join noti.checkResult cr join cr.monitor m
            where noti.createdAt < :before and m.team.id = :teamId
            """,
    )
    fun findByTeamIdAndOlderThan(@Param("teamId") teamId: String, @Param("before") before: Instant): List<Notification>
}
