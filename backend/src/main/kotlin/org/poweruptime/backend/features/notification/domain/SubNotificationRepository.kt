package org.poweruptime.backend.features.notification.domain

import org.poweruptime.backend.features.notification.model.SubNotification
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.stereotype.Repository

@Repository
interface SubNotificationRepository : JpaRepository<SubNotification, String>, JpaSpecificationExecutor<SubNotification>
