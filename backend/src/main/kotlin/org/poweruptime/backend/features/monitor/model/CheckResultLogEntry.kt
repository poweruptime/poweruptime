package org.poweruptime.backend.features.monitor.model

import io.hypersistence.utils.hibernate.type.json.JsonType
import jakarta.persistence.*
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.hibernate.annotations.Type
import org.poweruptime.backend.core.MaxNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH

@Entity
@Table(name = "check_result_log_entry")
class CheckResultLogEntry(
    /**
     * Usage of `CheckResultLogStageDatabaseConverter` to minify enum to 1 char
     * @see CheckResultLogStageDatabaseConverter
     */
    @Column(name = "stage", nullable = false, length = 1)
    val stage: CheckResultLogStage,

    /**
     * Usage of `CheckResultLogEntryLevelDatabaseConverter` to minify enum to 1 char
     * @see CheckResultLogEntryLevelDatabaseConverter
     */
    @Column(name = "level", nullable = false, length = 1)
    val level: CheckResultLogEntryLevel,

    @JoinColumn(name = "check_result_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    val checkResult: CheckResult,

    @Column(name = "message", nullable = false, length = Database.MAX_MESSAGE_LENGTH)
    val message: String,

    @Type(JsonType::class)
    @Column(name = "properties", nullable = true, columnDefinition = "jsonb")
    val properties: Map<String, String>? = null

) : AEntity() {
    @Id
    @MaxNanoId
    @Column(name = "id", unique = true, length = NANO_ID_MAX_LENGTH)
    override lateinit var id: String
}
