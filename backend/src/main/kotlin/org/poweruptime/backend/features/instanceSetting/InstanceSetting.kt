package org.poweruptime.backend.features.instanceSetting

import jakarta.persistence.*
import org.poweruptime.backend.core.SmallNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.features.team.model.SettingKey

@Entity
@Table(name = "instance_setting")
class InstanceSetting(
    /**
     * Usage of TeamSettingKeyConverter to minify enum to 1 char
     */
    @Column(name = "setting_key", nullable = false, length = 2)
    val key: SettingKey,

    @Column(nullable = false, length = Database.MAX_INSTANCE_SETTING_LENGTH)
    var value: String,
) : AEntity() {
    @Id
    @SmallNanoId
    @Column(name = "id", unique = true, length = NANO_ID_SMALL_LENGTH)
    override lateinit var id: String
}
