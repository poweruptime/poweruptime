package org.poweruptime.backend.features.statusPage.model

import jakarta.persistence.*
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.poweruptime.backend.core.DefaultNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.models.HasPosition
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_DEFAULT_LENGTH

@Entity
@Table(name = "status_page_group")
class StatusPageGroup(
    @JoinColumn(name = "status_page_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    var statusPage: StatusPage,

    @Column(nullable = true, length = Database.MAX_NAME_LENGTH)
    var name: String? = null,

    @Column(nullable = true, columnDefinition = "text")
    var description: String? = null,

    @OneToMany(mappedBy = "connection.group", fetch = FetchType.LAZY)
    var groupMonitors: List<StatusPageGroupMonitor> = ArrayList(),

    @Column(name = "position", nullable = true)
    override var position: Int? = null,
) : AEntity(), HasPosition {
    @Id
    @DefaultNanoId
    @Column(name = "id", length = NANO_ID_DEFAULT_LENGTH)
    override lateinit var id: String

    companion object
}
