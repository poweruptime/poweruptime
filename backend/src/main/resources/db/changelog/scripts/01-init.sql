CREATE COLLATION if not exists numeric (provider = icu, locale = 'en@colNumeric=yes');

create table dead_letter
(
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    version    bigint                   default 0     not null,
    id         varchar(21)                            not null
        primary key,
    body       text                                   not null,
    exchange   varchar(255)                           not null,
    queue      varchar(255)                           not null
);

create table instance_setting
(
    setting_key varchar(2)                             not null,
    created_at  timestamp with time zone default now() not null,
    updated_at  timestamp with time zone default now() not null,
    version     bigint                   default 0     not null,
    id          varchar(12)                            not null
        primary key,
    value       varchar(60)                            not null
);

create table monitor_checker_data
(
    dns_port                        integer
        constraint monitor_checker_data_dns_port_check
            check ((dns_port <= 65535) AND (dns_port >= 1)),
    http_content_type               varchar(4),
    http_ignore_tls                 boolean,
    ping_port                       integer
        constraint monitor_checker_data_ping_port_check
            check ((ping_port <= 65535) AND (ping_port >= 1)),
    dns_type                        varchar(5),
    http_auth_type                  varchar(5),
    http_method                     varchar(7),
    created_at                      timestamp with time zone default now() not null,
    deleted                         timestamp with time zone,
    ssl_certificate_valid_days_left bigint
        constraint monitor_checker_data_ssl_certificate_valid_days_left_check
            check ((ssl_certificate_valid_days_left <= 3650) AND (ssl_certificate_valid_days_left >= 1)),
    updated_at                      timestamp with time zone default now() not null,
    version                         bigint                   default 0     not null,
    id                              varchar(12)                            not null
        primary key,
    push_id                         varchar(12),
    dns_server                      varchar(15),
    ping_ip                         varchar(15),
    _type                           varchar(31)                            not null,
    dns_host                        varchar(253),
    http_basic_auth_password        varchar(512),
    http_basic_auth_username        varchar(512),
    http_url                        varchar(2048),
    ssl_certificate_url             varchar(2048),
    http_body                       text,
    http_search_term                text,
    dns_matches                     text[]
);

create table monitor_push_entry
(
    status     varchar(1)                             not null,
    created_at timestamp with time zone default now() not null,
    ping       bigint,
    updated_at timestamp with time zone default now() not null,
    version    bigint                   default 0     not null,
    push_id    varchar(12)                            not null,
    id         varchar(25)                            not null
        primary key,
    title      varchar(2000)                          not null,
    message    varchar(4000)
);

create table notification_sender_data
(
    mail_port            integer
        constraint notification_sender_data_mail_port_check
            check ((mail_port <= 65535) AND (mail_port >= 1)),
    created_at           timestamp with time zone default now() not null,
    deleted              timestamp with time zone,
    updated_at           timestamp with time zone default now() not null,
    version              bigint                   default 0     not null,
    id                   varchar(12)                            not null
        primary key,
    _type                varchar(31)                            not null,
    discord_display_name varchar(32),
    mail_host            varchar(253),
    mail_password        varchar(512),
    mail_username        varchar(512),
    discord_url          varchar(2048),
    mail_to              varchar(255)
);

create table system_notification
(
    active      boolean                  default true  not null,
    type        varchar(1)                             not null,
    created_at  timestamp with time zone default now() not null,
    ends        timestamp with time zone,
    starts      timestamp with time zone,
    updated_at  timestamp with time zone default now() not null,
    version     bigint                   default 0     not null,
    id          varchar(12)                            not null
        primary key,
    title       varchar(100),
    description varchar(2000)                          not null
);

create table team
(
    created_at timestamp with time zone default now() not null,
    deleted    timestamp with time zone,
    updated_at timestamp with time zone default now() not null,
    version    bigint                   default 0     not null,
    id         varchar(12)                            not null
        primary key,
    name       varchar(70)              collate numeric       not null
);

create table monitor
(
    status                varchar(1)                             not null,
    upside_down           boolean                                not null,
    created_at            timestamp with time zone default now() not null,
    deleted               timestamp with time zone,
    resend_after          bigint,
    retries               bigint                                 not null,
    test_interval_seconds bigint                                 not null,
    updated_at            timestamp with time zone default now() not null,
    version               bigint                   default 0     not null,
    id                    varchar(12)                            not null
        primary key,
    monitor_checker_id    varchar(12)                            not null
        unique
        constraint fk5ohxe2d9p1g23fynekb1fm7eb
            references monitor_checker_data,
    team_id               varchar(12)                            not null
        constraint fkrluqncxivlvt0hoq2qx9th5j4
            references team
            on delete cascade,
    name                  varchar(70)              collate numeric       not null,
    description           text
);

create table check_result
(
    previous_status varchar(1),
    status          varchar(1)               default 'P'::character varying not null,
    checked_at      timestamp with time zone,
    created_at      timestamp with time zone default now()                  not null,
    picked_up_at    timestamp with time zone,
    ping            bigint,
    times_retried   bigint,
    updated_at      timestamp with time zone default now()                  not null,
    version         bigint                   default 0                      not null,
    monitor_id      varchar(12)                                             not null
        constraint fkthe7asfewr9kkqapwyus0f74e
            references monitor
            on delete cascade,
    id              varchar(25)                                             not null
        primary key,
    title           varchar(2000),
    message         varchar(4000)
);

create table check_result_log_entry
(
    level           varchar(1)                             not null,
    stage           varchar(1)                             not null,
    created_at      timestamp with time zone default now() not null,
    updated_at      timestamp with time zone default now() not null,
    version         bigint                   default 0     not null,
    check_result_id varchar(25)                            not null
        constraint fkpwyek0u0cb1f28mxyogx8pn6
            references check_result
            on delete cascade,
    id              varchar(25)                            not null
        primary key,
    message         varchar(4000)                          not null,
    properties      jsonb
);

create table historical_day_uptime
(
    date       date        not null,
    uptime     numeric     not null,
    monitor_id varchar(12) not null
        constraint fkfdtdrap01mwt54pch27db3ns7
            references monitor
            on delete cascade,
    id         varchar(25) not null
        primary key,
    unique (date, monitor_id)
);

create table notification_method
(
    used_by_default             boolean                  default false not null,
    created_at                  timestamp with time zone default now() not null,
    deleted                     timestamp with time zone,
    updated_at                  timestamp with time zone default now() not null,
    version                     bigint                   default 0     not null,
    id                          varchar(12)                            not null
        primary key,
    notification_sender_data_id varchar(12)                            not null
        unique
        constraint fkbnqra8mw4iv61o10qcn7kynlj
            references notification_sender_data
            on delete cascade,
    team_id                     varchar(12)                            not null
        constraint fk1g2dj2vpsy52maiyiyswejly4
            references team
            on delete cascade,
    name                   varchar(70)               collate numeric      not null,
    body_template          text,
    title_template         text
);

create table monitor_notification_method
(
    monitor_id             varchar(12) not null
        constraint fkqtfc2mwebl2ro227ejs435jpo
            references monitor,
    notification_method_id varchar(12) not null
        constraint fkptg71on4kyg3kulgoh2wymsg5
            references notification_method
);

create table notification
(
    created_at             timestamp with time zone default now() not null,
    picked_up_at           timestamp with time zone,
    sent_at                timestamp with time zone,
    updated_at             timestamp with time zone default now() not null,
    version                bigint                   default 0     not null,
    notification_method_id varchar(12)                            not null
        constraint fk5w4ml1ltw07w2bvkbbiaqbofs
            references notification_method
            on delete cascade,
    check_result_id        varchar(25)                            not null
        constraint fkjwvawbiyb7f0oju5bk0t6elnr
            references check_result
            on delete cascade,
    id                     varchar(25)                            not null
        primary key,
    title                  varchar(2000)                          not null,
    error                  varchar(4000),
    message                varchar(4000)
);

create table status_page
(
    created_at   timestamp with time zone default now() not null,
    deleted      timestamp with time zone,
    updated_at   timestamp with time zone default now() not null,
    version      bigint                   default 0     not null,
    id           varchar(12)                            not null
        primary key,
    team_id      varchar(12)                            not null
        constraint fkbybj5wsge96tvl33e0tuuu2ra
            references team
            on delete cascade,
    name         varchar(70)              collate numeric       not null,
    description  text,
    footer       text,
    slug         varchar(255)                           not null
        unique,
    domain_names text[]
);

create table status_page_group
(
    position       integer,
    created_at     timestamp with time zone default now() not null,
    updated_at     timestamp with time zone default now() not null,
    version        bigint                   default 0     not null,
    id             varchar(12)                            not null
        primary key,
    status_page_id varchar(12)                            not null
        constraint fkkwrqh3s6ku7p9cj8vykjg0rah
            references status_page
            on delete cascade,
    name           varchar(70)              collate numeric       not null,
    description    text
);

create table status_page_group_monitor
(
    position             integer,
    monitor_id           varchar(12) not null
        constraint fkn8qipcnebu0iyv5t4prt8bwwv
            references monitor
            on delete cascade,
    status_page_group_id varchar(12) not null
        constraint fk4dnurrcf1rpnr7hqip9exm60j
            references status_page_group
            on delete cascade,
    status_page_id       varchar(12) not null
        constraint fk67j5f0kqy669k7dijun7vgn74
            references status_page
            on delete cascade,
    id                   varchar(21)
        unique,
    primary key (monitor_id, status_page_group_id),
    unique (status_page_id, monitor_id)
);

create table team_setting
(
    setting_key varchar(2)                             not null,
    created_at  timestamp with time zone default now() not null,
    updated_at  timestamp with time zone default now() not null,
    version     bigint                   default 0     not null,
    team_id     varchar(12)                            not null
        constraint fkma72ct0tv3cuvuw7tpe3qs2br
            references team
            on delete cascade,
    id          varchar(21)                            not null
        primary key,
    value       varchar(60)                            not null
);

create table "user"
(
    activated             boolean                  default true  not null,
    force_password_change boolean                  default false not null,
    role                  varchar(1)                             not null,
    created_at            timestamp with time zone default now() not null,
    updated_at            timestamp with time zone default now() not null,
    version               bigint                   default 0     not null,
    id                    varchar(12)                            not null
        primary key,
    personal_team_id      varchar(12)                            not null
        unique
        constraint fkeukpy99fybt6wyx9ojnau1nhb
            references team,
    name                  varchar(70)              collate numeric       not null,
    password_hash         varchar(80)                                    not null,
    email                 varchar(255)                                   not null
        unique
);

create table email_change_token
(
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    version    bigint                   default 0     not null,
    user_id    varchar(12)                            not null
        constraint fkqir00p6v2xhhvfb5y63tqeurw
            references "user"
            on delete cascade,
    id         varchar(21)                            not null
        primary key,
    email      varchar(255)                           not null,
    old_email  varchar(255)                           not null
);

create table password_reset_token
(
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    version    bigint                   default 0     not null,
    user_id    varchar(12)                            not null
        constraint fkopijiiwpt01x008euhjywip27
            references "user"
            on delete cascade,
    id         varchar(21)                            not null
        primary key
);

create table session
(
    valid       boolean                  default true  not null,
    created_at  timestamp with time zone default now() not null,
    updated_at  timestamp with time zone default now() not null,
    version     bigint                   default 0     not null,
    user_id     varchar(12)                            not null
        constraint fk2m443v3f7hel00lraw6xe3bwo
            references "user"
            on delete cascade,
    id          varchar(21)                            not null
        primary key,
    description varchar(60)                            not null
);

create table refresh_token
(
    valid      boolean                  default true  not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    version    bigint                   default 0     not null,
    id         varchar(21)                            not null
        primary key,
    session_id varchar(21)                            not null
        constraint fkke6m7no5uisy379prn8bq8cf6
            references session
            on delete cascade,
    token      varchar(1020)                          not null
        unique
);

create table team_join_token
(
    role       varchar(1)                             not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    version    bigint                   default 0     not null,
    invitee_id varchar(12)                            not null
        constraint fkbgtlwh3txfiltf11t59235fb8
            references "user"
            on delete cascade,
    inviter_id varchar(12)                            not null
        constraint fk222xvju6493i7ymrtbif57xog
            references "user"
            on delete cascade,
    team_id    varchar(12)                            not null
        constraint fkq5e8mi1j81y1pjj20ioedyy0i
            references team
            on delete cascade,
    token      varchar(20)                            not null
        unique,
    id         varchar(21)                            not null
        primary key
);

create table team_user
(
    role       varchar(1)                             not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    version    bigint                   default 0     not null,
    inviter_id varchar(12)
        constraint fkb306atvphe7ik7d95smbys5vj
            references "user"
            on delete cascade,
    team_id    varchar(12)                            not null
        constraint fkiuwi96twuthgvhnarqj34mnjv
            references team
            on delete cascade,
    user_id varchar(12)                           not null
        constraint fkc1f7oca74blh9v53wuju6d9x9
            references "user" (id)
            on delete cascade,
    primary key (team_id, user_id)
);