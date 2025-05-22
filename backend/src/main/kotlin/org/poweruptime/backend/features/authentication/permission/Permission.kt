package org.poweruptime.backend.features.authentication.permission

const val TEAM_ADMIN = "TEAM_ADMIN"
const val TEAM_MEMBER = "TEAM_MEMBER"

const val MONITOR_ADMIN = "MONITOR_ADMIN"
const val MONITOR_MEMBER = "MONITOR_MEMBER"

const val CHECK_RESULT_ADMIN = "CHECK_RESULT_ADMIN"
const val CHECK_RESULT_MEMBER = "CHECK_RESULT_MEMBER"

const val NOTIFICATION_METHOD_ADMIN = "NOTIFICATION_METHOD_ADMIN"
const val NOTIFICATION_METHOD_MEMBER = "NOTIFICATION_METHOD_MEMBER"

const val NOTIFICATION_ADMIN = "NOTIFICATION_ADMIN"
const val NOTIFICATION_MEMBER = "NOTIFICATION_MEMBER"

const val STATUS_PAGE_ADMIN = "STATUS_PAGE_ADMIN"
const val STATUS_PAGE_MEMBER = "STATUS_PAGE_MEMBER"

const val STATUS_PAGE_GROUP_ADMIN = "STATUS_PAGE_GROUP_ADMIN"
const val STATUS_PAGE_GROUP_MEMBER = "STATUS_PAGE_GROUP_MEMBER"

enum class Permission(val permissionName: String) {
    // ==================================
    // CONFIG
    // ==================================

    // Team
    TeamAdmin(TEAM_ADMIN),
    TeamMember(TEAM_MEMBER),

    // Monitor
    MonitorAdmin(MONITOR_ADMIN),
    MonitorMember(MONITOR_MEMBER),

    // CheckResult
    CheckResultAdmin(CHECK_RESULT_ADMIN),
    CheckResultMember(CHECK_RESULT_MEMBER),

    // Notification method
    NotificationMethodAdmin(NOTIFICATION_METHOD_ADMIN),
    NotificationMethodMember(NOTIFICATION_METHOD_MEMBER),

    // Notification
    NotificationAdmin(NOTIFICATION_ADMIN),
    NotificationMember(NOTIFICATION_MEMBER),

    // Status page
    StatusPageAdmin(STATUS_PAGE_ADMIN),
    StatusPageMember(STATUS_PAGE_MEMBER),

    // Status page group
    StatusPageGroupAdmin(STATUS_PAGE_GROUP_ADMIN),
    StatusPageGroupMember(STATUS_PAGE_GROUP_MEMBER),
}
