create table maintenance
(
    id                            bigserial
        primary key,
    public_id                     varchar(12)             not null
        constraint maintenance_public_id_unique
            unique,
    created_at                    timestamp default now() not null,
    updated_at                    timestamp default now() not null,
    deleted                       timestamp,
    title                         varchar(70) collate "numeric" not null,
    team_id                       bigint                  not null
        constraint fk_maintenance_team_id__id
            references team
            on update restrict on delete restrict,
    description                   text,
    starts_at                     timestamp               not null,
    ends_at                       timestamp               not null,
    time_zone                     varchar(64)             not null,
    visibility                    varchar(1)              not null,
    alert_behavior                varchar(1)              not null,
    notify_scheduled              boolean                 not null,
    notify_started                boolean                 not null,
    notify_ended                  boolean                 not null,
    reminder_offsets_minutes      int[]                   not null,
    reminder_sent_offsets_minutes int[]                   not null,
    started_at                    timestamp,
    ended_at                      timestamp,
    scheduled_notified_at         timestamp,
    started_notified_at           timestamp,
    ended_notified_at             timestamp
);

create index maintenance_team_id
    on maintenance (team_id);

create index maintenance_starts_at
    on maintenance (starts_at);

create index maintenance_ends_at
    on maintenance (ends_at);

create table maintenance_monitor
(
    id             bigserial
        primary key,
    maintenance_id bigint not null
        constraint fk_maintenance_monitor_maintenance_id__id
            references maintenance
            on update restrict on delete cascade,
    monitor_id     bigint not null
        constraint fk_maintenance_monitor_monitor_id__id
            references monitor
            on update restrict on delete cascade,
    constraint maintenance_monitor_unique
        unique (maintenance_id, monitor_id)
);

create index maintenance_monitor_maintenance_id
    on maintenance_monitor (maintenance_id);

create index maintenance_monitor_monitor_id
    on maintenance_monitor (monitor_id);

alter table check_result
    add column maintenance_id bigint
        constraint fk_check_result_maintenance_id__id
            references maintenance
            on update restrict on delete set null;

create index check_result_maintenance_id
    on check_result (maintenance_id);

alter table notification
    add column maintenance_id bigint
        constraint fk_notification_maintenance_id__id
            references maintenance
            on update restrict on delete set null;

create index notification_maintenance_id
    on notification (maintenance_id);
