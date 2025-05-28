package org.poweruptime.backend.configuration.schedule

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.core.utils.SECONDS_PER_DAY
import org.poweruptime.backend.features.fileUpload.FileService
import org.springframework.context.annotation.Configuration
import org.springframework.scheduling.annotation.EnableScheduling
import org.springframework.scheduling.annotation.Scheduled
import java.time.Instant

const val FORTY_FIVE_MINUTES_IN_MILLI_SECONDS = 2_700_000L

@Configuration
@EnableScheduling
class FileCleanupSchedule(
    private val fileService: FileService,
) {
    private final val logger = KotlinLogging.logger {}

    // Runs 45 minutes after instance start every 24 hours
    @Scheduled(fixedDelay = 86_400_000L, initialDelay = FORTY_FIVE_MINUTES_IN_MILLI_SECONDS)
    @Suppress("LongMethod")
    fun cleanup() {
        val date3DayAgo = Instant.now().minusSeconds(SECONDS_PER_DAY * 3) // 3 days

        logger.info { "Removing tangling files older than $date3DayAgo" }
        for (file in fileService.deleteOlderThan(date3DayAgo)) {
            logger.info {
                "Removed file '${file.id}', fileId: '${file.fileId}', createdAt: '${file.createdAt}'"
            }
        }
    }
}
