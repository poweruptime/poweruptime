package org.poweruptime.backend.features.statusPage.model

import jakarta.persistence.*
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.poweruptime.backend.core.SmallNanoId
import org.poweruptime.backend.core.models.ASoftDeleteEntity
import org.poweruptime.backend.core.models.EntityWithName
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.features.team.model.Team

@Entity
@Table(name = "status_page")
class StatusPage(
    @Column(nullable = false, length = Database.MAX_NAME_LENGTH)
    override var name: String,

    @Column(nullable = false, length = Database.MAX_SLUG_LENGTH, unique = true)
    var slug: String,

    @JoinColumn(name = "team_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    var team: Team,

    @Column(nullable = true, columnDefinition = "text")
    var description: String? = null,

    @Column(nullable = true, columnDefinition = "text")
    var footer: String? = null,

    @Suppress("JpaAttributeTypeInspection") @Column(
        name = "domain_names",
        nullable = true,
        columnDefinition = "text[]",
    )
    var domainNames: Set<String>? = null,

    @OneToMany(mappedBy = "statusPage", fetch = FetchType.LAZY)
    var groupMonitors: List<StatusPageGroupMonitor> = ArrayList(),

    @OrderBy("position ASC")
    @OneToMany(mappedBy = "statusPage", fetch = FetchType.EAGER)
    var groups: List<StatusPageGroup> = ArrayList(),

) : ASoftDeleteEntity(), EntityWithName {
    @Id
    @SmallNanoId
    @Column(name = "id", unique = true, length = NANO_ID_SMALL_LENGTH)
    override lateinit var id: String

    companion object
}
