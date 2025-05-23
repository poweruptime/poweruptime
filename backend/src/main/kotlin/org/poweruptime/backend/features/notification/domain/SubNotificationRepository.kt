package org.poweruptime.backend.features.notification.domain

import org.poweruptime.backend.features.notification.model.SubNotification
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.Instant

@Repository
interface SubNotificationRepository :
    JpaRepository<SubNotification, String>,
    JpaSpecificationExecutor<SubNotification> {
    @Query(
        """
        select subNoti from SubNotification subNoti
        join subNoti.notification noti join noti.checkResult cr join cr.monitor m
        where subNoti.createdAt < :before and m.team.id = :teamId
        """,
    )
    fun findByTeamIdAndOlderThan(
        @Param("teamId") teamId: String,
        @Param("before") before: Instant
    ): List<SubNotification>
}
