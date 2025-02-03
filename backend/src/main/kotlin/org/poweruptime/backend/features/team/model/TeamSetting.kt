package org.poweruptime.backend.features.team.model

import jakarta.persistence.*
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.poweruptime.backend.core.DefaultNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.utils.NANO_ID_DEFAULT_LENGTH

@Entity
@Table(name = "team_setting")
class TeamSetting(
    /**
     * Usage of TeamSettingKeyConverter to minify enum to 1 char
     */
    @Column(name = "setting_key", nullable = false, length = 2)
    val key: SettingKey,

    @Column(nullable = false, length = 60)
    var value: String,

    @JoinColumn(name = "team_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    val team: Team,

) : AEntity() {

    @Id
    @DefaultNanoId
    @Column(name = "id", unique = true, length = NANO_ID_DEFAULT_LENGTH)
    override lateinit var id: String
}
