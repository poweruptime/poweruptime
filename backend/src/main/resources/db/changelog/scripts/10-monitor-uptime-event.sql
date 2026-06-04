create table monitor_uptime_event
(
    id           bigserial
        primary key,
    monitor_id   bigint      not null
        constraint fk_monitor_uptime_event_monitor_id__id
            references monitor
            on update restrict on delete restrict,
    effective_at timestamp   not null,
    status       varchar(1)  not null
        constraint monitor_uptime_event_status_check
            check (status in ('U', 'D'))
);

create index monitor_uptime_event_monitor_id_effective_at
    on monitor_uptime_event (monitor_id, effective_at);
