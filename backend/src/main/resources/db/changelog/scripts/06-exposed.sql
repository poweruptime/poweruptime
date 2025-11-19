-- Create schema for old data
CREATE SCHEMA public_old;

-- Move all existing tables to public_old schema
ALTER TABLE IF EXISTS dead_letter SET SCHEMA public_old;
ALTER TABLE IF EXISTS file SET SCHEMA public_old;
ALTER TABLE IF EXISTS instance_setting SET SCHEMA public_old;
ALTER TABLE IF EXISTS version_check_mail SET SCHEMA public_old;
ALTER TABLE IF EXISTS monitor_data SET SCHEMA public_old;
ALTER TABLE IF EXISTS monitor_data_dns SET SCHEMA public_old;
ALTER TABLE IF EXISTS monitor_data_http SET SCHEMA public_old;
ALTER TABLE IF EXISTS monitor_data_ping SET SCHEMA public_old;
ALTER TABLE IF EXISTS monitor_data_push SET SCHEMA public_old;
ALTER TABLE IF EXISTS monitor_data_ssl_certificate SET SCHEMA public_old;
ALTER TABLE IF EXISTS monitor_push_entry SET SCHEMA public_old;
ALTER TABLE IF EXISTS notification_method_data SET SCHEMA public_old;
ALTER TABLE IF EXISTS notification_method_data_apprise SET SCHEMA public_old;
ALTER TABLE IF EXISTS notification_method_data_discord SET SCHEMA public_old;
ALTER TABLE IF EXISTS notification_method_data_email SET SCHEMA public_old;
ALTER TABLE IF EXISTS notification_method_data_slack SET SCHEMA public_old;
ALTER TABLE IF EXISTS system_notification SET SCHEMA public_old;
ALTER TABLE IF EXISTS "user" SET SCHEMA public_old;
ALTER TABLE IF EXISTS team SET SCHEMA public_old;
ALTER TABLE IF EXISTS monitor SET SCHEMA public_old;
ALTER TABLE IF EXISTS check_result SET SCHEMA public_old;
ALTER TABLE IF EXISTS check_result_log_entry SET SCHEMA public_old;
ALTER TABLE IF EXISTS historical_day_uptime SET SCHEMA public_old;
ALTER TABLE IF EXISTS notification SET SCHEMA public_old;
ALTER TABLE IF EXISTS notification_method SET SCHEMA public_old;
ALTER TABLE IF EXISTS monitor_notification_method SET SCHEMA public_old;
ALTER TABLE IF EXISTS status_page SET SCHEMA public_old;
ALTER TABLE IF EXISTS status_page_domain_name SET SCHEMA public_old;
ALTER TABLE IF EXISTS status_page_group SET SCHEMA public_old;
ALTER TABLE IF EXISTS status_page_group_monitor SET SCHEMA public_old;
ALTER TABLE IF EXISTS sub_notification SET SCHEMA public_old;
ALTER TABLE IF EXISTS tag SET SCHEMA public_old;
ALTER TABLE IF EXISTS monitor_tag SET SCHEMA public_old;
ALTER TABLE IF EXISTS team_setting SET SCHEMA public_old;
ALTER TABLE IF EXISTS email_change_token SET SCHEMA public_old;
ALTER TABLE IF EXISTS mfa SET SCHEMA public_old;
ALTER TABLE IF EXISTS mfa_backup_code SET SCHEMA public_old;
ALTER TABLE IF EXISTS password_reset_token SET SCHEMA public_old;
ALTER TABLE IF EXISTS session SET SCHEMA public_old;
ALTER TABLE IF EXISTS refresh_token SET SCHEMA public_old;
ALTER TABLE IF EXISTS team_join_token SET SCHEMA public_old;
ALTER TABLE IF EXISTS team_user SET SCHEMA public_old;

create table dead_letter
(
    id         bigserial
        primary key,
    public_id  varchar(21)             not null
        constraint dead_letter_public_id_unique
            unique,
    created_at timestamp default now() not null,
    updated_at timestamp default now() not null,
    queue      varchar(255)            not null,
    exchange   varchar(255)            not null,
    body       text                    not null
);

create table file
(
    id         bigserial
        primary key,
    file_id    varchar(25)             not null
        constraint file_file_id_unique
            unique,
    created_at timestamp default now() not null,
    updated_at timestamp default now() not null,
    name       varchar(256) collate "numeric"            not null
);

create table instance_setting
(
    id          bigserial
        primary key,
    setting_key varchar(2)    not null,
    value       varchar(2048) not null
);

create table version_check_mail
(
    id         bigserial
        primary key,
    pu_version varchar(21) not null
        constraint version_check_mail_pu_version_unique
            unique
);

create table mfa
(
    id         bigserial
        primary key,
    created_at timestamp default now() not null,
    updated_at timestamp default now() not null,
    secret     varchar(10)             not null,
    active     boolean                 not null
);

create table "user"
(
    id                    bigserial
        primary key,
    public_id             varchar(12)             not null
        constraint user_public_id_unique
            unique,
    created_at            timestamp default now() not null,
    updated_at            timestamp default now() not null,
    deleted               timestamp,
    name                  varchar(70) collate "numeric"             not null,
    email                 varchar(255)            not null
        constraint user_email_unique
            unique,
    password_hash         varchar(68)             not null,
    mfa_id                bigint
        constraint fk_user_mfa_id__id
            references mfa
            on update restrict on delete restrict,
    activated             boolean                 not null,
    force_password_change boolean                 not null,
    role                  varchar(1)              not null
);

create table team
(
    id         bigserial
        primary key,
    public_id  varchar(12)             not null
        constraint team_public_id_unique
            unique,
    created_at timestamp default now() not null,
    updated_at timestamp default now() not null,
    deleted    timestamp,
    name       varchar(70) collate "numeric"             not null,
    user_id    bigint
        constraint team_user_id_unique
            unique
        constraint fk_team_user_id__id
            references "user"
            on update restrict on delete restrict
);

create index team_user_id
    on team (user_id);

create table monitor
(
    id                    bigserial
        primary key,
    public_id             varchar(12)             not null
        constraint monitor_public_id_unique
            unique,
    created_at            timestamp default now() not null,
    updated_at            timestamp default now() not null,
    deleted               timestamp,
    name                  varchar(70) collate "numeric"             not null,
    team_id               bigint                  not null
        constraint fk_monitor_team_id__id
            references team
            on update restrict on delete restrict,
    type                  varchar(15)             not null,
    test_interval_seconds bigint                  not null,
    upside_down           boolean                 not null,
    retries               bigint,
    resend_after          bigint,
    description           text,
    status                varchar(1)              not null
);

create index monitor_team_id
    on monitor (team_id);

create table monitor_data_dns
(
    id          bigint                  not null
        constraint monitor_data_dns_id_unique
            unique
        constraint fk_monitor_data_dns_id__id
            references monitor
            on update restrict on delete restrict,
    created_at  timestamp default now() not null,
    updated_at  timestamp default now() not null,
    dns_host    varchar(253)            not null,
    dns_server  varchar(15)             not null,
    dns_port    integer                 not null,
    dns_type    varchar(5)              not null,
    dns_matches text[]
);

create table monitor_data_http
(
    id                               bigint                  not null
        constraint monitor_data_http_id_unique
            unique
        constraint fk_monitor_data_http_id__id
            references monitor
            on update restrict on delete restrict,
    created_at                       timestamp default now() not null,
    updated_at                       timestamp default now() not null,
    http_url                         varchar(2048)           not null,
    http_method                      varchar(7)              not null,
    http_content_type                varchar(4)              not null,
    http_allowed_status_code_ranges  text[]                  not null,
    http_max_redirects               bigint,
    http_ignore_tls                  boolean                 not null,
    http_certificate_expiry          boolean                 not null,
    http_certificate_valid_days_left bigint,
    http_body                        text,
    http_search_term                 text,
    http_auth_type                   varchar(5),
    http_basic_auth_username         varchar(512),
    http_basic_auth_password         varchar(512)
);

create table monitor_data_ping
(
    id         bigint                  not null
        constraint monitor_data_ping_id_unique
            unique
        constraint fk_monitor_data_ping_id__id
            references monitor
            on update restrict on delete restrict,
    created_at timestamp default now() not null,
    updated_at timestamp default now() not null,
    ping_ip    varchar(15)             not null,
    ping_port  integer                 not null
);

create table monitor_data_push
(
    id         bigint                  not null
        constraint monitor_data_push_id_unique
            unique
        constraint fk_monitor_data_push_id__id
            references monitor
            on update restrict on delete restrict,
    created_at timestamp default now() not null,
    updated_at timestamp default now() not null,
    push_id    varchar(12)             not null
        constraint monitor_data_push_push_id_unique
            unique
);

create table monitor_data_ssl_certificate
(
    id                              bigint                  not null
        constraint monitor_data_ssl_certificate_id_unique
            unique
        constraint fk_monitor_data_ssl_certificate_id__id
            references monitor
            on update restrict on delete restrict,
    created_at                      timestamp default now() not null,
    updated_at                      timestamp default now() not null,
    ssl_certificate_url             varchar(2048)           not null,
    ssl_certificate_valid_days_left bigint
);

create table monitor_push_entry
(
    id         bigserial
        primary key,
    push_id    varchar(12)             not null,
    created_at timestamp default now() not null,
    updated_at timestamp default now() not null,
    status     varchar(1)              not null,
    title      varchar(2000)           not null,
    message    varchar(4000),
    ping       bigint
);

create table notification_method
(
    id             bigserial
        primary key,
    public_id      varchar(12)             not null
        constraint notification_method_public_id_unique
            unique,
    created_at     timestamp default now() not null,
    updated_at     timestamp default now() not null,
    deleted        timestamp,
    name           varchar(70) collate "numeric"             not null,
    team_id        bigint                  not null
        constraint fk_notification_method_team_id__id
            references team
            on update restrict on delete restrict,
    type           varchar(7)              not null,
    use_by_default boolean   default false not null,
    title_template text,
    body_template  text
);

create index notification_method_team_id
    on notification_method (team_id);

create table notification_method_data_apprise
(
    id          bigint                  not null
        constraint notification_method_data_apprise_id_unique
            unique
        constraint fk_notification_method_data_apprise_id__id
            references notification_method
            on update restrict on delete restrict,
    created_at  timestamp default now() not null,
    updated_at  timestamp default now() not null,
    apprise_url varchar(2048)           not null
);

create table notification_method_data_discord
(
    id                   bigint                  not null
        constraint notification_method_data_discord_id_unique
            unique
        constraint fk_notification_method_data_discord_id__id
            references notification_method
            on update restrict on delete restrict,
    created_at           timestamp default now() not null,
    updated_at           timestamp default now() not null,
    discord_url          varchar(2048)           not null,
    discord_display_name varchar(32)
);

create table notification_method_data_email
(
    id                     bigint                  not null
        constraint notification_method_data_email_id_unique
            unique
        constraint fk_notification_method_data_email_id__id
            references notification_method
            on update restrict on delete restrict,
    created_at             timestamp default now() not null,
    updated_at             timestamp default now() not null,
    mail_to                text[]                  not null,
    mail_host              varchar(253)            not null,
    mail_port              integer                 not null,
    mail_username          varchar(512)            not null,
    mail_password          varchar(512)            not null,
    mail_security          varchar(1)              not null,
    mail_ignore_tls_errors boolean                 not null,
    mail_cc                text[],
    mail_bcc               text[]
);

create table notification_method_data_slack
(
    id                 bigint                  not null
        constraint notification_method_data_slack_id_unique
            unique
        constraint fk_notification_method_data_slack_id__id
            references notification_method
            on update restrict on delete restrict,
    created_at         timestamp default now() not null,
    updated_at         timestamp default now() not null,
    slack_url          varchar(2048)           not null,
    slack_display_name varchar(32)
);

create table mfa_backup_code
(
    id         bigserial
        primary key,
    created_at timestamp default now() not null,
    updated_at timestamp default now() not null,
    mfa_id     bigint                  not null
        constraint fk_mfa_backup_code_mfa_id__id
            references mfa
            on update restrict on delete restrict,
    code_hash  varchar(68)             not null,
    valid      boolean                 not null,
    constraint mfa_backup_code_mfa_id_code_hash_unique
        unique (mfa_id, code_hash)
);

create index mfa_backup_code_mfa_id
    on mfa_backup_code (mfa_id);

create table check_result
(
    id              bigserial
        primary key,
    public_id       varchar(25)             not null
        constraint check_result_public_id_unique
            unique,
    created_at      timestamp default now() not null,
    updated_at      timestamp default now() not null,
    monitor_id      bigint                  not null
        constraint fk_check_result_monitor_id__id
            references monitor
            on update restrict on delete restrict,
    status          varchar(1)              not null,
    times_retried   bigint,
    previous_status varchar(1),
    picked_up_at    timestamp,
    checked_at      timestamp,
    ping            bigint,
    title           varchar(2000),
    message         varchar(4000)
);

create index check_result_monitor_id
    on check_result (monitor_id);

create index check_result_created_at_desc_id
    on check_result (created_at desc, id);

create index check_result_monitor_id_id
    on check_result (monitor_id) include (id);

create table check_result_log_entry
(
    id              bigserial
        primary key,
    public_id       varchar(25)             not null
        constraint check_result_log_entry_public_id_unique
            unique,
    created_at      timestamp default now() not null,
    updated_at      timestamp default now() not null,
    check_result_id bigint                  not null
        constraint fk_check_result_log_entry_check_result_id__id
            references check_result
            on update restrict on delete restrict,
    stage           varchar(1)              not null,
    level           varchar(1)              not null,
    message         varchar(4000)           not null,
    properties      json
);

create index check_result_log_entry_check_result_id
    on check_result_log_entry (check_result_id);

create table historical_day_uptime
(
    id         bigserial
        primary key,
    monitor_id bigint        not null
        constraint fk_historical_day_uptime_monitor_id__id
            references monitor
            on update restrict on delete restrict,
    date       date          not null,
    uptime     numeric(6, 3) not null,
    constraint historical_day_uptime_date_monitor_id_unique
        unique (date, monitor_id)
);

create index historical_day_uptime_monitor_id
    on historical_day_uptime (monitor_id);

create table notification
(
    id              bigserial
        primary key,
    public_id       varchar(21)             not null
        constraint notification_public_id_unique
            unique,
    created_at      timestamp default now() not null,
    updated_at      timestamp default now() not null,
    check_result_id bigint                  not null
        constraint notification_check_result_id_unique
            unique
        constraint fk_notification_check_result_id__id
            references check_result
            on update restrict on delete restrict,
    title           varchar(2000)           not null
);

create index notification_check_result_id
    on notification (check_result_id);

create index notification_created_at_desc_check_result_id
    ON notification (created_at desc, check_result_id);

create table monitor_notification_method
(
    monitor_id             bigint not null
        constraint fk_monitor_notification_method_monitor_id__id
            references monitor
            on update restrict on delete restrict,
    notification_method_id bigint not null
        constraint fk_monitor_notification_method_notification_method_id__id
            references notification_method
            on update restrict on delete restrict,
    constraint pk_monitor_notification_method
        primary key (monitor_id, notification_method_id)
);

create index monitor_notification_method_monitor_id
    on monitor_notification_method (monitor_id);

create index monitor_notification_method_notification_method_id
    on monitor_notification_method (notification_method_id);

create table status_page
(
    id          bigserial
        primary key,
    slug        varchar(255)            not null
        constraint status_page_slug_unique
            unique,
    created_at  timestamp default now() not null,
    updated_at  timestamp default now() not null,
    deleted     timestamp,
    name        varchar(70) collate "numeric"            not null,
    team_id     bigint                  not null
        constraint fk_status_page_team_id__id
            references team
            on update restrict on delete restrict,
    image_id    bigint
        constraint fk_status_page_image_id__id
            references file
            on update restrict on delete restrict,
    description text,
    footer      text
);

create index status_page_team_id
    on status_page (team_id);

create table status_page_domain_name
(
    id             bigserial
        primary key,
    created_at     timestamp default now() not null,
    updated_at     timestamp default now() not null,
    name           varchar(253) collate "numeric"           not null
        constraint status_page_domain_name_name_unique
            unique,
    status_page_id bigint                  not null
        constraint fk_status_page_domain_name_status_page_id__id
            references status_page
            on update restrict on delete restrict
);

create index status_page_domain_name_status_page_id
    on status_page_domain_name (status_page_id);

create table status_page_group
(
    id             bigserial
        primary key,
    public_id      varchar(21)             not null
        constraint status_page_group_public_id_unique
            unique,
    created_at     timestamp default now() not null,
    updated_at     timestamp default now() not null,
    position       integer,
    status_page_id bigint                  not null
        constraint fk_status_page_group_status_page_id__id
            references status_page
            on update restrict on delete restrict,
    name           varchar(70) collate "numeric",
    description    text
);

create index status_page_group_status_page_id
    on status_page_group (status_page_id);

create table status_page_group_monitor
(
    id                   bigserial
        primary key,
    public_id            varchar(25) not null
        constraint status_page_group_monitor_public_id_unique
            unique,
    position             integer,
    status_page_id       bigint      not null
        constraint fk_status_page_group_monitor_status_page_id__id
            references status_page
            on update restrict on delete restrict,
    status_page_group_id bigint      not null
        constraint fk_status_page_group_monitor_status_page_group_id__id
            references status_page_group
            on update restrict on delete restrict,
    monitor_id           bigint      not null
        constraint fk_status_page_group_monitor_monitor_id__id
            references monitor
            on update restrict on delete restrict,
    constraint status_page_group_monitor_status_page_id_monitor_id_unique
        unique (status_page_id, monitor_id)
);

create index status_page_group_monitor_status_page_id
    on status_page_group_monitor (status_page_id);

create index status_page_group_monitor_status_page_group_id
    on status_page_group_monitor (status_page_group_id);

create index status_page_group_monitor_monitor_id
    on status_page_group_monitor (monitor_id);

create table sub_notification
(
    id                     bigserial
        primary key,
    public_id              varchar(25)             not null
        constraint sub_notification_public_id_unique
            unique,
    created_at             timestamp default now() not null,
    updated_at             timestamp default now() not null,
    notification_id        bigint                  not null
        constraint fk_sub_notification_notification_id__id
            references notification
            on update restrict on delete restrict,
    notification_method_id bigint                  not null
        constraint fk_sub_notification_notification_method_id__id
            references notification_method
            on update restrict on delete restrict,
    title                  varchar(2000)           not null,
    message                varchar(4000),
    picked_up_at           timestamp,
    sent_at                timestamp,
    error                  varchar(4000)
);

create index sub_notification_notification_id
    on sub_notification (notification_id);

create index sub_notification_notification_method_id
    on sub_notification (notification_method_id);

create table tag
(
    id         bigserial
        primary key,
    public_id  varchar(21)             not null
        constraint tag_public_id_unique
            unique,
    created_at timestamp default now() not null,
    updated_at timestamp default now() not null,
    deleted    timestamp,
    name       varchar(70) collate "numeric"            not null,
    team_id    bigint                  not null
        constraint fk_tag_team_id__id
            references team
            on update restrict on delete restrict,
    variant    varchar(1)              not null,
    constraint tag_team_id_name_unique
        unique (team_id, name)
);

create index tag_team_id
    on tag (team_id);

create table monitor_tag
(
    monitor_id bigint not null
        constraint fk_monitor_tag_monitor_id__id
            references monitor
            on update restrict on delete restrict,
    tag_id     bigint not null
        constraint fk_monitor_tag_tag_id__id
            references tag
            on update restrict on delete restrict,
    constraint pk_monitor_tag
        primary key (monitor_id, tag_id)
);

create index monitor_tag_monitor_id
    on monitor_tag (monitor_id);

create index monitor_tag_tag_id
    on monitor_tag (tag_id);

create table team_setting
(
    id          bigserial
        primary key,
    setting_key varchar(2)    not null,
    value       varchar(2048) not null,
    team_id     bigint        not null
        constraint fk_team_setting_team_id__id
            references team
            on update restrict on delete restrict
);

create index team_setting_team_id
    on team_setting (team_id);

create table email_change_token
(
    id         bigserial
        primary key,
    token      varchar(25)             not null
        constraint email_change_token_token_unique
            unique,
    created_at timestamp default now() not null,
    updated_at timestamp default now() not null,
    user_id    bigint                  not null
        constraint fk_email_change_token_user_id__id
            references "user"
            on update restrict on delete restrict,
    email      varchar(255)            not null,
    old_email  varchar(255)            not null,
    valid      boolean                 not null
);

create index email_change_token_user_id
    on email_change_token (user_id);

create table password_reset_token
(
    id         varchar(25)             not null
        primary key,
    created_at timestamp default now() not null,
    updated_at timestamp default now() not null,
    user_id    bigint                  not null
        constraint fk_password_reset_token_user_id__id
            references "user"
            on update restrict on delete restrict,
    valid      boolean                 not null
);

create index password_reset_token_user_id
    on password_reset_token (user_id);

create table session
(
    id          bigserial
        primary key,
    public_id   varchar(21)             not null
        constraint session_public_id_unique
            unique,
    created_at  timestamp default now() not null,
    updated_at  timestamp default now() not null,
    user_id     bigint                  not null
        constraint fk_session_user_id__id
            references "user"
            on update restrict on delete restrict,
    description varchar(60)             not null,
    valid       boolean                 not null
);

create index session_user_id
    on session (user_id);

create table refresh_token
(
    id         bigserial
        primary key,
    created_at timestamp default now() not null,
    updated_at timestamp default now() not null,
    session_id bigint                  not null
        constraint fk_refresh_token_session_id__id
            references session
            on update restrict on delete restrict,
    token      varchar(1020)           not null,
    valid      boolean                 not null
);

create index refresh_token_session_id
    on refresh_token (session_id);

create table team_join_token
(
    id         varchar(25)             not null
        primary key,
    created_at timestamp default now() not null,
    updated_at timestamp default now() not null,
    invitee_id bigint                  not null
        constraint fk_team_join_token_invitee_id__id
            references "user"
            on update restrict on delete restrict,
    inviter_id bigint                  not null
        constraint fk_team_join_token_inviter_id__id
            references "user"
            on update restrict on delete restrict,
    team_id    bigint                  not null
        constraint fk_team_join_token_team_id__id
            references team
            on update restrict on delete restrict,
    role       varchar(1)              not null,
    valid      boolean                 not null
);

create index team_join_token_invitee_id
    on team_join_token (invitee_id);

create index team_join_token_inviter_id
    on team_join_token (inviter_id);

create index team_join_token_team_id
    on team_join_token (team_id);

create table team_user
(
    created_at timestamp default now() not null,
    updated_at timestamp default now() not null,
    role       varchar(1)              not null,
    team_id    bigint                  not null
        constraint fk_team_user_team_id__id
            references team
            on update restrict on delete restrict,
    user_id    bigint                  not null
        constraint fk_team_user_user_id__id
            references "user"
            on update restrict on delete restrict,
    inviter_id bigint
        constraint fk_team_user_inviter_id__id
            references "user"
            on update restrict on delete restrict,
    constraint pk_team_user
        primary key (team_id, user_id),
    constraint team_user_user_id_team_id_unique
        unique (user_id, team_id)
);

create index team_user_team_id
    on team_user (team_id);

create index team_user_user_id
    on team_user (user_id);

-- Create ID mapping table
CREATE TABLE id_mapping
(
    entity_type VARCHAR(50)  NOT NULL,
    old_id      VARCHAR(255) NOT NULL,
    new_id      BIGINT       NOT NULL,
    PRIMARY KEY (entity_type, old_id)
);

-- Migrate MFA data from public_old.mfa
INSERT INTO mfa (created_at, updated_at, secret, active)
SELECT
    (om.created_at AT TIME ZONE 'UTC')::timestamp,
    (om.updated_at AT TIME ZONE 'UTC')::timestamp,
    om.secret,
    om.active
FROM public_old.mfa om
ORDER BY om.id;

-- Create id_mapping entries for MFA
INSERT INTO id_mapping (entity_type, old_id, new_id)
SELECT
    'mfa',
    om.id,
    nm.id
FROM public_old.mfa om
         JOIN mfa nm ON om.secret = nm.secret
    AND om.active = nm.active
    AND (om.created_at AT TIME ZONE 'UTC')::timestamp = nm.created_at
ORDER BY om.id;

-- Migrate mfa_backup_code data from public_old.mfa_backup_code
INSERT INTO mfa_backup_code (created_at, updated_at, mfa_id, code_hash, valid)
SELECT
    (ombc.created_at AT TIME ZONE 'UTC')::timestamp,
    (ombc.updated_at AT TIME ZONE 'UTC')::timestamp,
    im.new_id,
    ombc.code_hash,
    ombc.valid
FROM public_old.mfa_backup_code ombc
         JOIN id_mapping im ON im.entity_type = 'mfa' AND im.old_id = ombc.mfa_id
ORDER BY ombc.mfa_id, ombc.code_hash;

-- Migrate User data from public_old."user"
INSERT INTO "user" (public_id, created_at, updated_at, deleted, name, email,
                    password_hash, mfa_id, activated, force_password_change,
                    role)
SELECT
    ou.id,
    (ou.created_at AT TIME ZONE 'UTC')::timestamp,
    (ou.updated_at AT TIME ZONE 'UTC')::timestamp,
    NULL,
    ou.name,
    ou.email,
    ou.password_hash,
    im.new_id,
    ou.activated,
    ou.force_password_change,
    ou.role
FROM public_old."user" ou
         LEFT JOIN public_old.mfa om ON om.user_id = ou.id
         LEFT JOIN id_mapping im ON im.entity_type = 'mfa' AND im.old_id = om.id
ORDER BY ou.id;

-- Create id_mapping entries for User
INSERT INTO id_mapping (entity_type, old_id, new_id)
SELECT
    'user',
    ou.id,
    nu.id
FROM public_old."user" ou
         JOIN "user" nu ON nu.public_id = ou.id
ORDER BY ou.id;

-- Migrate team data from public_old.team
INSERT INTO team (public_id, created_at, updated_at, deleted, name, user_id)
SELECT
    ot.id,
    (ot.created_at AT TIME ZONE 'UTC')::timestamp,
    (ot.updated_at AT TIME ZONE 'UTC')::timestamp,
    (ot.deleted AT TIME ZONE 'UTC')::timestamp,
    ot.name,
    CASE WHEN ot.user_id IS NOT NULL THEN um.new_id ELSE NULL END
FROM public_old.team ot
    LEFT JOIN id_mapping um ON um.entity_type = 'user' AND um.old_id = ot.user_id
ORDER BY ot.id;

INSERT INTO id_mapping (entity_type, old_id, new_id)
SELECT
    'team',
    ot.id,
    nt.id
FROM public_old.team ot
         JOIN team nt ON nt.public_id = ot.id
ORDER BY ot.id;

INSERT INTO team_user (team_id, user_id, inviter_id, role, created_at, updated_at)
SELECT
    tm.new_id,
    um.new_id,
    CASE WHEN otu.inviter_id IS NOT NULL THEN im.new_id ELSE NULL END,
    otu.role,
    (otu.created_at AT TIME ZONE 'UTC')::timestamp,
    (otu.updated_at AT TIME ZONE 'UTC')::timestamp
FROM public_old.team_user otu
         JOIN id_mapping tm ON tm.entity_type = 'team' AND tm.old_id = otu.team_id
         JOIN id_mapping um ON um.entity_type = 'user' AND um.old_id = otu.user_id
         LEFT JOIN id_mapping im ON im.entity_type = 'user' AND im.old_id = otu.inviter_id
ORDER BY otu.team_id, otu.user_id;

-- Migrate all monitors from public_old.monitor
INSERT INTO monitor (public_id, created_at, updated_at, deleted, name, team_id,
                     type, test_interval_seconds, upside_down, retries,
                     resend_after, description, status)
SELECT
    om.id,
    (om.created_at AT TIME ZONE 'UTC')::timestamp,
    (om.updated_at AT TIME ZONE 'UTC')::timestamp,
    (om.deleted AT TIME ZONE 'UTC')::timestamp,
    om.name,
    tm.new_id,
    omd._type,
    om.test_interval_seconds,
    om.upside_down,
    om.retries,
    om.resend_after,
    om.description,
    om.status
FROM public_old.monitor om
         JOIN public_old.monitor_data omd ON omd.id = om.monitor_checker_id
         JOIN id_mapping tm ON tm.entity_type = 'team' AND tm.old_id = om.team_id
ORDER BY om.id;

-- Migrate DNS monitor data
INSERT INTO monitor_data_dns (id, created_at, updated_at, dns_host, dns_server,
                              dns_port, dns_type, dns_matches)
SELECT
    nm.id,
    (omd.created_at AT TIME ZONE 'UTC')::timestamp,
    (omd.updated_at AT TIME ZONE 'UTC')::timestamp,
    omdd.dns_host,
    omdd.dns_server,
    omdd.dns_port,
    omdd.dns_type,
    omdd.dns_matches
FROM public_old.monitor om
         JOIN public_old.monitor_data omd ON omd.id = om.monitor_checker_id
         JOIN public_old.monitor_data_dns omdd ON omdd.id = omd.id
         JOIN monitor nm ON nm.public_id = om.id
WHERE omd._type = 'monitor_data_dns'
ORDER BY om.id;

-- Migrate HTTP monitor data
INSERT INTO monitor_data_http (id, created_at, updated_at, http_url, http_method,
                               http_content_type, http_allowed_status_code_ranges,
                               http_max_redirects, http_ignore_tls,
                               http_certificate_expiry,
                               http_certificate_valid_days_left, http_body,
                               http_search_term, http_auth_type,
                               http_basic_auth_username, http_basic_auth_password)
SELECT
    nm.id,
    (omd.created_at AT TIME ZONE 'UTC')::timestamp,
    (omd.updated_at AT TIME ZONE 'UTC')::timestamp,
    omdh.http_url,
    omdh.http_method,
    omdh.http_content_type,
    omdh.http_allowed_status_code_ranges,
    omdh.http_max_redirects,
    omdh.http_ignore_tls,
    omdh.http_certificate_expiry,
    omdh.http_certificate_valid_days_left,
    omdh.http_body,
    omdh.http_search_term,
    omdh.http_auth_type,
    omdh.http_basic_auth_username,
    omdh.http_basic_auth_password
FROM public_old.monitor om
         JOIN public_old.monitor_data omd ON omd.id = om.monitor_checker_id
         JOIN public_old.monitor_data_http omdh ON omdh.id = omd.id
         JOIN monitor nm ON nm.public_id = om.id
WHERE omd._type = 'HTTP'
ORDER BY om.id;

-- Migrate PING monitor data
INSERT INTO monitor_data_ping (id, created_at, updated_at, ping_ip, ping_port)
SELECT
    nm.id,
    (omd.created_at AT TIME ZONE 'UTC')::timestamp,
    (omd.updated_at AT TIME ZONE 'UTC')::timestamp,
    omdp.ping_ip,
    omdp.ping_port
FROM public_old.monitor om
         JOIN public_old.monitor_data omd ON omd.id = om.monitor_checker_id
         JOIN public_old.monitor_data_ping omdp ON omdp.id = omd.id
         JOIN monitor nm ON nm.public_id = om.id
WHERE omd._type = 'PING'
ORDER BY om.id;

-- Migrate PUSH monitor data
INSERT INTO monitor_data_push (id, created_at, updated_at, push_id)
SELECT
    nm.id,
    (omd.created_at AT TIME ZONE 'UTC')::timestamp,
    (omd.updated_at AT TIME ZONE 'UTC')::timestamp,
    omdpu.push_id
FROM public_old.monitor om
         JOIN public_old.monitor_data omd ON omd.id = om.monitor_checker_id
         JOIN public_old.monitor_data_push omdpu ON omdpu.id = omd.id
         JOIN monitor nm ON nm.public_id = om.id
WHERE omd._type = 'PUSH'
  AND omd.deleted IS NULL
ORDER BY om.id;

-- Migrate SSL_CERTIFICATE monitor data
INSERT INTO monitor_data_ssl_certificate (id, created_at, updated_at,
                                          ssl_certificate_url,
                                          ssl_certificate_valid_days_left)
SELECT
    nm.id,
    (omd.created_at AT TIME ZONE 'UTC')::timestamp,
    (omd.updated_at AT TIME ZONE 'UTC')::timestamp,
    omdsc.ssl_certificate_url,
    omdsc.ssl_certificate_valid_days_left
FROM public_old.monitor om
         JOIN public_old.monitor_data omd ON omd.id = om.monitor_checker_id
         JOIN public_old.monitor_data_ssl_certificate omdsc ON omdsc.id = omd.id
         JOIN monitor nm ON nm.public_id = om.id
WHERE omd._type = 'SSL_CERTIFICATE'
ORDER BY om.id;

-- Create id_mapping entries for monitor
INSERT INTO id_mapping (entity_type, old_id, new_id)
SELECT
    'monitor',
    om.id,
    nm.id
FROM public_old.monitor om
         JOIN monitor nm ON nm.public_id = om.id
ORDER BY om.id;

-- Migrate all notification methods from public_old.notification_method
INSERT INTO notification_method (public_id, created_at, updated_at, deleted,
                                 name, team_id, type, use_by_default,
                                 title_template, body_template)
SELECT
    onm.id,
    (onm.created_at AT TIME ZONE 'UTC')::timestamp,
    (onm.updated_at AT TIME ZONE 'UTC')::timestamp,
    (onm.deleted AT TIME ZONE 'UTC')::timestamp,
    onm.name,
    tm.new_id,
    onmd._type,
    onm.used_by_default,
    onm.title_template,
    onm.body_template
FROM public_old.notification_method onm
         JOIN public_old.notification_method_data onmd ON onmd.id = onm.notification_method_data_id
         JOIN id_mapping tm ON tm.entity_type = 'team' AND tm.old_id = onm.team_id
ORDER BY onm.id;

-- Migrate APPRISE notification method data
INSERT INTO notification_method_data_apprise (id, created_at, updated_at,
                                              apprise_url)
SELECT
    nnm.id,
    (onmd.created_at AT TIME ZONE 'UTC')::timestamp,
    (onmd.updated_at AT TIME ZONE 'UTC')::timestamp,
    onmda.apprise_url
FROM public_old.notification_method onm
         JOIN public_old.notification_method_data onmd ON onmd.id = onm.notification_method_data_id
         JOIN public_old.notification_method_data_apprise onmda ON onmda.id = onmd.id
         JOIN notification_method nnm ON nnm.public_id = onm.id
WHERE onmd._type = 'APPRISE'
ORDER BY onm.id;

-- Migrate DISCORD notification method data
INSERT INTO notification_method_data_discord (id, created_at, updated_at,
                                              discord_url, discord_display_name)
SELECT
    nnm.id,
    (onmd.created_at AT TIME ZONE 'UTC')::timestamp,
    (onmd.updated_at AT TIME ZONE 'UTC')::timestamp,
    onmdd.discord_url,
    onmdd.discord_display_name
FROM public_old.notification_method onm
         JOIN public_old.notification_method_data onmd ON onmd.id = onm.notification_method_data_id
         JOIN public_old.notification_method_data_discord onmdd ON onmdd.id = onmd.id
         JOIN notification_method nnm ON nnm.public_id = onm.id
WHERE onmd._type = 'DISCORD'
ORDER BY onm.id;

-- Migrate EMAIL notification method data
INSERT INTO notification_method_data_email (id, created_at, updated_at, mail_to,
                                            mail_host, mail_port, mail_username,
                                            mail_password, mail_security,
                                            mail_ignore_tls_errors, mail_cc,
                                            mail_bcc)
SELECT
    nnm.id,
    (onmd.created_at AT TIME ZONE 'UTC')::timestamp,
    (onmd.updated_at AT TIME ZONE 'UTC')::timestamp,
    onmde.mail_to,
    onmde.mail_host,
    onmde.mail_port,
    onmde.mail_username,
    onmde.mail_password,
    onmde.mail_security,
    onmde.mail_ignore_tls_errors,
    onmde.mail_cc,
    onmde.mail_bcc
FROM public_old.notification_method onm
         JOIN public_old.notification_method_data onmd ON onmd.id = onm.notification_method_data_id
         JOIN public_old.notification_method_data_email onmde ON onmde.id = onmd.id
         JOIN notification_method nnm ON nnm.public_id = onm.id
WHERE onmd._type = 'EMAIL'
ORDER BY onm.id;

-- Migrate SLACK notification method data
INSERT INTO notification_method_data_slack (id, created_at, updated_at,
                                            slack_url, slack_display_name)
SELECT
    nnm.id,
    (onmd.created_at AT TIME ZONE 'UTC')::timestamp,
    (onmd.updated_at AT TIME ZONE 'UTC')::timestamp,
    onmds.slack_url,
    onmds.slack_display_name
FROM public_old.notification_method onm
         JOIN public_old.notification_method_data onmd ON onmd.id = onm.notification_method_data_id
         JOIN public_old.notification_method_data_slack onmds ON onmds.id = onmd.id
         JOIN notification_method nnm ON nnm.public_id = onm.id
WHERE onmd._type = 'SLACK'
ORDER BY onm.id;

-- Create id_mapping entries for notification_method
INSERT INTO id_mapping (entity_type, old_id, new_id)
SELECT
    'notification_method',
    onm.id,
    nnm.id
FROM public_old.notification_method onm
         JOIN notification_method nnm ON nnm.public_id = onm.id
ORDER BY onm.id;

-- Migrate data from public_old.monitor_notification_method
INSERT INTO monitor_notification_method (monitor_id, notification_method_id)
SELECT
    mm.new_id,
    nm.new_id
FROM public_old.monitor_notification_method omnm
         JOIN id_mapping mm ON mm.entity_type = 'monitor'
    AND mm.old_id = omnm.monitor_id
         JOIN id_mapping nm ON nm.entity_type = 'notification_method'
    AND nm.old_id = omnm.notification_method_id
ORDER BY omnm.monitor_id, omnm.notification_method_id;

-- Migrate tag data from public_old.tag
INSERT INTO tag (public_id, created_at, updated_at, deleted, name, team_id,
                 variant)
SELECT
    ot.id,
    (ot.created_at AT TIME ZONE 'UTC')::timestamp,
    (ot.updated_at AT TIME ZONE 'UTC')::timestamp,
    (ot.deleted AT TIME ZONE 'UTC')::timestamp,
    ot.name,
    tm.new_id,
    ot.variant
FROM public_old.tag ot
         JOIN id_mapping tm ON tm.entity_type = 'team' AND tm.old_id = ot.team_id
ORDER BY ot.id;

-- Create id_mapping entries for tag
INSERT INTO id_mapping (entity_type, old_id, new_id)
SELECT
    'tag',
    ot.id,
    nt.id
FROM public_old.tag ot
         JOIN tag nt ON nt.public_id = ot.id
ORDER BY ot.id;

-- Migrate monitor_tag data from public_old.monitor_tag
INSERT INTO monitor_tag (monitor_id, tag_id)
SELECT
    mm.new_id,
    tm.new_id
FROM public_old.monitor_tag omnt
         JOIN id_mapping mm ON mm.entity_type = 'monitor'
    AND mm.old_id = omnt.monitor_id
         JOIN id_mapping tm ON tm.entity_type = 'tag'
    AND tm.old_id = omnt.tag_id
ORDER BY omnt.monitor_id, omnt.tag_id;

-- Migrate team_setting data from public_old.team_setting
INSERT INTO team_setting (setting_key, value, team_id)
SELECT
    ots.setting_key,
    ots.value,
    tm.new_id
FROM public_old.team_setting ots
         JOIN id_mapping tm ON tm.entity_type = 'team' AND tm.old_id = ots.team_id
ORDER BY ots.team_id, ots.setting_key;

-- Migrate instance_setting data from public_old.instance_setting
INSERT INTO instance_setting (setting_key, value)
SELECT
    ois.setting_key,
    ois.value
FROM public_old.instance_setting ois
ORDER BY ois.setting_key;

-- Migrate file data from public_old.file
INSERT INTO file (file_id, created_at, updated_at, name)
SELECT
    of.file_id,
    (of.created_at AT TIME ZONE 'UTC')::timestamp,
    (of.updated_at AT TIME ZONE 'UTC')::timestamp,
    of.name
FROM public_old.file of
ORDER BY of.id;

-- Create id_mapping entries for file
INSERT INTO id_mapping (entity_type, old_id, new_id)
SELECT
    'file',
    of.id,
    nf.id
FROM public_old.file of
         JOIN file nf ON nf.file_id = of.file_id
ORDER BY of.id;

-- Migrate status_page data from public_old.status_page
INSERT INTO status_page (slug, created_at, updated_at, deleted, name, team_id,
                         image_id, description, footer)
SELECT
    osp.slug,
    (osp.created_at AT TIME ZONE 'UTC')::timestamp,
    (osp.updated_at AT TIME ZONE 'UTC')::timestamp,
    (osp.deleted AT TIME ZONE 'UTC')::timestamp,
    osp.name,
    tm.new_id,
    CASE WHEN osp.image_id IS NOT NULL
             THEN fm.new_id
         ELSE NULL
        END,
    osp.description,
    osp.footer
FROM public_old.status_page osp
         JOIN id_mapping tm ON tm.entity_type = 'team' AND tm.old_id = osp.team_id
         LEFT JOIN id_mapping fm ON fm.entity_type = 'file' AND fm.old_id = osp.image_id
ORDER BY osp.id;

-- Create id_mapping entries for status_page
INSERT INTO id_mapping (entity_type, old_id, new_id)
SELECT
    'status_page',
    osp.id,
    nsp.id
FROM public_old.status_page osp
         JOIN status_page nsp ON nsp.slug = osp.slug
ORDER BY osp.id;

-- Migrate status_page_domain_name data
INSERT INTO status_page_domain_name (created_at, updated_at, name, status_page_id)
SELECT
    (ospdn.created_at AT TIME ZONE 'UTC')::timestamp,
    (ospdn.updated_at AT TIME ZONE 'UTC')::timestamp,
    ospdn.name,
    spm.new_id
FROM public_old.status_page_domain_name ospdn
         JOIN id_mapping spm ON spm.entity_type = 'status_page'
    AND spm.old_id = ospdn.status_page_id
ORDER BY ospdn.status_page_id, ospdn.name;

-- Migrate status_page_group data
INSERT INTO status_page_group (public_id, created_at, updated_at, position,
                               status_page_id, name, description)
SELECT
    ospg.id,
    (ospg.created_at AT TIME ZONE 'UTC')::timestamp,
    (ospg.updated_at AT TIME ZONE 'UTC')::timestamp,
    ospg.position,
    spm.new_id,
    ospg.name,
    ospg.description
FROM public_old.status_page_group ospg
         JOIN id_mapping spm ON spm.entity_type = 'status_page'
    AND spm.old_id = ospg.status_page_id
ORDER BY ospg.id;

-- Create id_mapping entries for status_page_group
INSERT INTO id_mapping (entity_type, old_id, new_id)
SELECT
    'status_page_group',
    ospg.id,
    nspg.id
FROM public_old.status_page_group ospg
         JOIN status_page_group nspg ON nspg.public_id = ospg.id
ORDER BY ospg.id;

-- Migrate status_page_group_monitor data
INSERT INTO status_page_group_monitor (public_id, position, status_page_id,
                                       status_page_group_id, monitor_id)
SELECT
    ospgm.id,
    ospgm.position,
    spm.new_id,
    spgm.new_id,
    mm.new_id
FROM public_old.status_page_group_monitor ospgm
         JOIN id_mapping spm ON spm.entity_type = 'status_page'
    AND spm.old_id = ospgm.status_page_id
         JOIN id_mapping spgm ON spgm.entity_type = 'status_page_group'
    AND spgm.old_id = ospgm.status_page_group_id
         JOIN id_mapping mm ON mm.entity_type = 'monitor'
    AND mm.old_id = ospgm.monitor_id
ORDER BY ospgm.status_page_id, ospgm.status_page_group_id, ospgm.monitor_id;


-- Migrate check_result data from public_old.check_result
INSERT INTO check_result (public_id, created_at, updated_at, monitor_id, status,
                          times_retried, previous_status, picked_up_at,
                          checked_at, ping, title, message)
SELECT
    ocr.id,
    (ocr.created_at AT TIME ZONE 'UTC')::timestamp,
    (ocr.updated_at AT TIME ZONE 'UTC')::timestamp,
    mm.new_id,
    ocr.status,
    ocr.times_retried,
    ocr.previous_status,
    (ocr.picked_up_at AT TIME ZONE 'UTC')::timestamp,
    (ocr.checked_at AT TIME ZONE 'UTC')::timestamp,
    ocr.ping,
    ocr.title,
    ocr.message
FROM public_old.check_result ocr
         JOIN id_mapping mm ON mm.entity_type = 'monitor' AND mm.old_id = ocr.monitor_id
ORDER BY ocr.id;

-- Create id_mapping entries for check_result
INSERT INTO id_mapping (entity_type, old_id, new_id)
SELECT
    'check_result',
    ocr.id,
    cr.id
FROM public_old.check_result ocr
         JOIN check_result cr ON cr.public_id = ocr.id
ORDER BY ocr.id;

-- Migrate notification data from public_old.notification
INSERT INTO notification (public_id, created_at, updated_at, check_result_id, title)
SELECT
    oln.id,
    (oln.created_at AT TIME ZONE 'UTC')::timestamp,
    (oln.updated_at AT TIME ZONE 'UTC')::timestamp,
    crm.new_id,
    oln.title
FROM public_old.notification oln
    JOIN id_mapping crm ON crm.entity_type = 'check_result' AND crm.old_id = oln.check_result_id
ORDER BY oln.id;

-- Create id_mapping entries for notification
INSERT INTO id_mapping (entity_type, old_id, new_id)
SELECT
    'notification',
    oln.id,
    nn.id
FROM public_old.notification oln
    JOIN notification nn ON nn.public_id = oln.id
ORDER BY oln.id;

-- Migrate sub_notification data from public_old.sub_notification
INSERT INTO sub_notification (public_id, created_at, updated_at, notification_id,
                              notification_method_id, title, message, picked_up_at,
                              sent_at, error)
SELECT
    osn.id,
    (osn.created_at AT TIME ZONE 'UTC')::timestamp,
    (osn.updated_at AT TIME ZONE 'UTC')::timestamp,
    nm.new_id,
    nmm.new_id,
    osn.title,
    osn.message,
    (osn.picked_up_at AT TIME ZONE 'UTC')::timestamp,
    (osn.sent_at AT TIME ZONE 'UTC')::timestamp,
    osn.error
FROM public_old.sub_notification osn
         JOIN id_mapping nm ON nm.entity_type = 'notification' AND nm.old_id = osn.notification_id
         JOIN id_mapping nmm ON nmm.entity_type = 'notification_method' AND nmm.old_id = osn.notification_method_id
ORDER BY osn.id;

-- Migrate check_result_log_entry data from public_old.check_result_log_entry
INSERT INTO check_result_log_entry (public_id, created_at, updated_at, check_result_id,
                                    stage, level, message, properties)
SELECT
    ocrle.id,
    (ocrle.created_at AT TIME ZONE 'UTC')::timestamp,
    (ocrle.updated_at AT TIME ZONE 'UTC')::timestamp,
    crm.new_id,
    ocrle.stage,
    ocrle.level,
    ocrle.message,
    ocrle.properties::json
FROM public_old.check_result_log_entry ocrle
         JOIN id_mapping crm ON crm.entity_type = 'check_result' AND crm.old_id = ocrle.check_result_id
ORDER BY ocrle.id;

-- Set sequences
SELECT setval('mfa_id_seq', COALESCE((SELECT MAX(id) + 1 FROM mfa), 1));
SELECT setval('mfa_backup_code_id_seq', COALESCE((SELECT MAX(id) + 1 FROM mfa_backup_code), 1));
SELECT setval('user_id_seq', COALESCE((SELECT MAX(id) + 1 FROM "user"), 1));
SELECT setval('team_id_seq', COALESCE((SELECT MAX(id) + 1 FROM team), 1));
SELECT setval('monitor_id_seq', COALESCE((SELECT MAX(id) + 1 FROM monitor), 1));
SELECT setval('check_result_id_seq', COALESCE((SELECT MAX(id) + 1 FROM check_result), 1));
SELECT setval('check_result_log_entry_id_seq', COALESCE((SELECT MAX(id) + 1 FROM check_result_log_entry), 1));
SELECT setval('historical_day_uptime_id_seq', COALESCE((SELECT MAX(id) + 1 FROM historical_day_uptime), 1));
SELECT setval('notification_id_seq', COALESCE((SELECT MAX(id) + 1 FROM notification), 1));
SELECT setval('notification_method_id_seq', COALESCE((SELECT MAX(id) + 1 FROM notification_method), 1));
SELECT setval('monitor_push_entry_id_seq', COALESCE((SELECT MAX(id) + 1 FROM monitor_push_entry), 1));
SELECT setval('file_id_seq', COALESCE((SELECT MAX(id) + 1 FROM file), 1));
SELECT setval('dead_letter_id_seq', COALESCE((SELECT MAX(id) + 1 FROM dead_letter), 1));
SELECT setval('status_page_id_seq', COALESCE((SELECT MAX(id) + 1 FROM status_page), 1));
SELECT setval('status_page_domain_name_id_seq', COALESCE((SELECT MAX(id) + 1 FROM status_page_domain_name), 1));
SELECT setval('status_page_group_id_seq', COALESCE((SELECT MAX(id) + 1 FROM status_page_group), 1));
SELECT setval('status_page_group_monitor_id_seq', COALESCE((SELECT MAX(id) + 1 FROM status_page_group_monitor), 1));
SELECT setval('sub_notification_id_seq', COALESCE((SELECT MAX(id) + 1 FROM sub_notification), 1));
SELECT setval('tag_id_seq', COALESCE((SELECT MAX(id) + 1 FROM tag), 1));
SELECT setval('team_setting_id_seq', COALESCE((SELECT MAX(id) + 1 FROM team_setting), 1));
SELECT setval('email_change_token_id_seq', COALESCE((SELECT MAX(id) + 1 FROM email_change_token), 1));
SELECT setval('session_id_seq', COALESCE((SELECT MAX(id) + 1 FROM session), 1));
SELECT setval('refresh_token_id_seq', COALESCE((SELECT MAX(id) + 1 FROM refresh_token), 1));
SELECT setval('instance_setting_id_seq', COALESCE((SELECT MAX(id) + 1 FROM instance_setting), 1));
SELECT setval('version_check_mail_id_seq', COALESCE((SELECT MAX(id) + 1 FROM version_check_mail), 1));

DROP SCHEMA public_old CASCADE;
