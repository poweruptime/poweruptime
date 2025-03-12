package org.poweruptime.backend.configuration.schedule

import org.poweruptime.backend.core.utils.SECONDS_PER_DAY
import org.poweruptime.backend.features.fileUpload.FileService
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.scheduling.annotation.Scheduled
import java.time.Instant

@Configuration
@EnableScheduling
class FileCleanupSchedule(
    private val fileService: FileService,
) {
    val logger: Logger = LoggerFactory.getLogger(FileCleanupSchedule::class.java)

    // Runs 45 minutes after instance start every 24 hours
    @Scheduled(fixedDelay = 86_400_000L, initialDelay = 2_700_000L)
    @Suppress("LongMethod")
    fun cleanup() {
        val date3DayAgo = Instant.now().minusSeconds(SECONDS_PER_DAY * 3) // 3 days

        logger.info("Removing tangling files older than $date3DayAgo")
        for (file in fileService.deleteOlderThan(date3DayAgo)) {
            logger.info(
                "Removed file '{}', fileId: '{}', createdAt: '{}'",
                file.id,
                file.fileId,
                file.createdAt,
            )
        }
    }
}
