package org.poweruptime.backend.features.statusPage.model

import jakarta.persistence.*
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.poweruptime.backend.core.SmallNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.models.EntityWithName
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH

@Entity
@Table(name = "status_page_domain_name")
class StatusPageDomainName(
    @Column(nullable = false, length = Database.MAX_DOMAIN_LENGTH, unique = true)
    override var name: String,

    @JoinColumn(name = "status_page_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    var statusPage: StatusPage,
) : AEntity(), EntityWithName {
    @Id
    @SmallNanoId
    @Column(name = "id", unique = true, length = NANO_ID_SMALL_LENGTH)
    override lateinit var id: String

    companion object
}
