-- monitor.team_id
CREATE INDEX idx_monitor_team_id
    ON monitor(team_id);

-- check_result.monitor_id
CREATE INDEX idx_check_result_monitor_id
    ON check_result(monitor_id);

-- check_result_log_entry.check_result_id
CREATE INDEX idx_crle_check_result_id
    ON check_result_log_entry(check_result_id);

-- historical_day_uptime.monitor_id
CREATE INDEX idx_hdu_monitor_id
    ON historical_day_uptime(monitor_id);

-- notification.check_result_id
CREATE INDEX idx_notification_check_result_id
    ON notification(check_result_id);

-- notification_method.team_id
CREATE INDEX idx_notification_method_team_id
    ON notification_method(team_id);

-- monitor_notification_method.monitor_id
CREATE INDEX idx_mon_nm_monitor_id
    ON monitor_notification_method(monitor_id);

-- monitor_notification_method.notification_method_id
CREATE INDEX idx_mon_nm_method_id
    ON monitor_notification_method(notification_method_id);

-- status_page.team_id
CREATE INDEX idx_status_page_team_id
    ON status_page(team_id);

-- status_page_domain_name.status_page_id
CREATE INDEX idx_spdn_status_page_id
    ON status_page_domain_name(status_page_id);

-- status_page_group.status_page_id
CREATE INDEX idx_spg_status_page_id
    ON status_page_group(status_page_id);

-- status_page_group_monitor.status_page_id
CREATE INDEX idx_spgm_status_page_id
    ON status_page_group_monitor(status_page_id);

-- status_page_group_monitor.status_page_group_id
CREATE INDEX idx_spgm_status_page_group_id
    ON status_page_group_monitor(status_page_group_id);

-- sub_notification.notification_method_id
CREATE INDEX idx_subnotif_method_id
    ON sub_notification(notification_method_id);

-- sub_notification.notification_id
CREATE INDEX idx_subnotif_notification_id
    ON sub_notification(notification_id);

-- tag.team_id
CREATE INDEX idx_tag_team_id
    ON tag(team_id);

-- monitor_tag.monitor_id
CREATE INDEX idx_mon_tag_monitor_id
    ON monitor_tag(monitor_id);

-- monitor_tag.tag_id
CREATE INDEX idx_mon_tag_tag_id
    ON monitor_tag(tag_id);

-- team_setting.team_id
CREATE INDEX idx_team_setting_team_id
    ON team_setting(team_id);

-- email_change_token.user_id
CREATE INDEX idx_email_change_token_user_id
    ON email_change_token(user_id);

-- mfa_backup_code.mfa_id
CREATE INDEX idx_mfa_backup_code_mfa_id
    ON mfa_backup_code(mfa_id);

-- password_reset_token.user_id
CREATE INDEX idx_prt_user_id
    ON password_reset_token(user_id);

-- session.user_id
CREATE INDEX idx_session_user_id
    ON session(user_id);

-- refresh_token.session_id
CREATE INDEX idx_refresh_token_session_id
    ON refresh_token(session_id);

-- team_join_token.invitee_id
CREATE INDEX idx_tjt_invitee_id
    ON team_join_token(invitee_id);

-- team_join_token.inviter_id
CREATE INDEX idx_tjt_inviter_id
    ON team_join_token(inviter_id);

-- team_join_token.team_id
CREATE INDEX idx_tjt_team_id
    ON team_join_token(team_id);

-- team_user.user_id
CREATE INDEX idx_team_user_user_id
    ON team_user(user_id);
