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

create table file
(
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    version    bigint                   default 0     not null,
    file_id    varchar(25)                            not null
        unique,
    id         varchar(25)                            not null
        primary key,
    name       varchar(256)                           not null
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

create table monitor_data
(
    created_at timestamp with time zone default now() not null,
    deleted    timestamp with time zone,
    updated_at timestamp with time zone default now() not null,
    version    bigint                   default 0     not null,
    id         varchar(12)                            not null
        primary key,
    _type      varchar(31)                            not null
);

create table monitor_data_dns
(
    dns_port    integer      not null
        constraint monitor_data_dns_dns_port_check
            check ((dns_port <= 65535) AND (dns_port >= 1)),
    dns_type    varchar(5)   not null,
    id          varchar(12)  not null
        primary key
        constraint fk18tijgh1mpxqdd0w0n6oohb68
            references monitor_data,
    dns_server  varchar(15)  not null,
    dns_host    varchar(253) not null,
    dns_matches text[]
);

create table monitor_data_http
(
    http_certificate_expiry          boolean       not null,
    http_content_type                varchar(4)    not null,
    http_ignore_tls                  boolean       not null,
    http_auth_type                   varchar(5),
    http_method                      varchar(7)    not null,
    http_certificate_valid_days_left bigint
        constraint monitor_data_http_http_certificate_valid_days_left_check
            check ((http_certificate_valid_days_left <= 3650) AND (http_certificate_valid_days_left >= 1)),
    http_max_redirects               bigint
        constraint monitor_data_http_http_max_redirects_check
            check ((http_max_redirects <= 20) AND (http_max_redirects >= 1)),
    id                               varchar(12)   not null
        primary key
        constraint fk9prtnbpjkwgr5wxqgkyn1yflf
            references monitor_data,
    http_basic_auth_password         varchar(512),
    http_basic_auth_username         varchar(512),
    http_url                         varchar(2048) not null,
    http_body                        text,
    http_search_term                 text,
    http_allowed_status_code_ranges  text[]        not null
);

create table monitor_data_ping
(
    ping_port integer     not null
        constraint monitor_data_ping_ping_port_check
            check ((ping_port <= 65535) AND (ping_port >= 1)),
    id        varchar(12) not null
        primary key
        constraint fkntbraa0f1swb685qnvnp9l25d
            references monitor_data,
    ping_ip   varchar(15) not null
);

create table monitor_data_push
(
    id      varchar(12) not null
        primary key
        constraint fk7u16851jqsfwgrefmho4djfrf
            references monitor_data,
    push_id varchar(12) not null
);

create table monitor_data_ssl_certificate
(
    ssl_certificate_valid_days_left bigint
        constraint monitor_data_ssl_certificate_ssl_certificate_valid_days_l_check
            check ((ssl_certificate_valid_days_left <= 3650) AND (ssl_certificate_valid_days_left >= 1)),
    id                              varchar(12)   not null
        primary key
        constraint fk9nkss2wl59anfos2tcf9nurr6
            references monitor_data,
    ssl_certificate_url             varchar(2048) not null
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

create table notification_method_data
(
    created_at timestamp with time zone default now() not null,
    deleted    timestamp with time zone,
    updated_at timestamp with time zone default now() not null,
    version    bigint                   default 0     not null,
    id         varchar(12)                            not null
        primary key,
    _type      varchar(31)                            not null
);

create table notification_method_data_discord
(
    id                   varchar(12)   not null
        primary key
        constraint fkd9tseko3yyiahh0ugnv0m11ew
            references notification_method_data,
    discord_display_name varchar(32),
    discord_url          varchar(2048) not null
);

create table notification_method_data_email
(
    mail_ignore_tls_errors boolean      not null,
    mail_port              integer      not null
        constraint notification_method_data_email_mail_port_check
            check ((mail_port <= 65535) AND (mail_port >= 1)),
    mail_security          varchar(1)   not null,
    id                     varchar(12)  not null
        primary key
        constraint fkjamqbi6j1ymq9yrhkl6gcayux
            references notification_method_data,
    mail_host              varchar(253) not null,
    mail_password          varchar(512) not null,
    mail_username          varchar(512) not null,
    mail_bcc               text[],
    mail_cc                text[],
    mail_to                text[]       not null
);

create table notification_method_data_slack
(
    id                 varchar(12)   not null
        primary key
        constraint fktrn1cmctev79t7w99r0pjc3ol
            references notification_method_data,
    slack_display_name varchar(32),
    slack_url          varchar(2048) not null
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
    retries               bigint,
    test_interval_seconds bigint                                 not null,
    updated_at            timestamp with time zone default now() not null,
    version               bigint                   default 0     not null,
    id                    varchar(12)                            not null
        primary key,
    monitor_checker_id    varchar(12)                            not null
        unique
        constraint fkm9dp0oquy4hdmcl6lcywvig9v
            references monitor_data,
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

create table notification
(
    created_at      timestamp with time zone default now() not null,
    updated_at      timestamp with time zone default now() not null,
    version         bigint                   default 0     not null,
    id              varchar(21)                            not null
        primary key,
    check_result_id varchar(25)                            not null
        constraint fkjwvawbiyb7f0oju5bk0t6elnr
            references check_result
            on delete cascade,
    title                  varchar(2000)                          not null
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
    notification_method_data_id varchar(12)                            not null
        unique
        constraint fkk45t238ha6osreq5n19oh3cvy
            references notification_method_data
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

create table status_page
(
    created_at  timestamp with time zone default now() not null,
    deleted     timestamp with time zone,
    updated_at  timestamp with time zone default now() not null,
    version     bigint                   default 0     not null,
    id          varchar(12)                            not null
        primary key,
    team_id     varchar(12)                            not null
        constraint fkbybj5wsge96tvl33e0tuuu2ra
            references team
            on delete cascade,
    image_id    varchar(25)
        unique
        constraint fklr0bs4g2f9nmmjqg1wm0sbajj
            references file,
    name         varchar(70)              collate numeric       not null,
    description text,
    footer      text,
    slug        varchar(255)                           not null
        unique
);

create table status_page_domain_name
(
    created_at     timestamp with time zone default now() not null,
    updated_at     timestamp with time zone default now() not null,
    version        bigint                   default 0     not null,
    id             varchar(12)                            not null
        primary key,
    status_page_id varchar(12)                            not null
        constraint fk8pnxcnqairx7dlqf2tpwbbjhm
            references status_page
            on delete cascade,
    name           varchar(253)     collate numeric       not null
        unique
);

create table status_page_group
(
    position       integer,
    created_at     timestamp with time zone default now() not null,
    updated_at     timestamp with time zone default now() not null,
    version        bigint                   default 0     not null,
    status_page_id varchar(12)                            not null
        constraint fkkwrqh3s6ku7p9cj8vykjg0rah
            references status_page
            on delete cascade,
    id             varchar(21)                            not null
        primary key,
    name           varchar(70)         collate numeric    not null,
    description    text
);

create table status_page_group_monitor
(
    position             integer,
    monitor_id           varchar(12) not null
        constraint fkn8qipcnebu0iyv5t4prt8bwwv
            references monitor
            on delete cascade,
    status_page_id       varchar(12) not null
        constraint fk67j5f0kqy669k7dijun7vgn74
            references status_page
            on delete cascade,
    status_page_group_id varchar(21) not null
        constraint fk4dnurrcf1rpnr7hqip9exm60j
            references status_page_group
            on delete cascade,
    id                   varchar(25)
        unique,
    primary key (monitor_id, status_page_group_id),
    unique (status_page_id, monitor_id)
);

create table sub_notification
(
    created_at             timestamp with time zone default now() not null,
    picked_up_at           timestamp with time zone,
    sent_at                timestamp with time zone,
    updated_at             timestamp with time zone default now() not null,
    version                bigint                   default 0     not null,
    notification_method_id varchar(12)                            not null
        constraint fkdryroyo6u45hxheq8cud54s6h
            references notification_method
            on delete cascade,
    notification_id        varchar(21)                            not null
        constraint fk8wfegwu73od3c3320oen1xwy8
            references notification
            on delete cascade,
    id                     varchar(25)                            not null
        primary key,
    title                  varchar(2000)                          not null,
    error                  varchar(4000),
    message                varchar(4000)
);

create table tag
(
    variant    varchar(1)                             not null,
    created_at timestamp with time zone default now() not null,
    deleted    timestamp with time zone,
    updated_at timestamp with time zone default now() not null,
    version    bigint                   default 0     not null,
    team_id    varchar(12)                            not null
        constraint fkc1xo69bpeqcws2fqubwqcxkvv
            references team
            on delete cascade,
    id         varchar(21)                            not null
        primary key,
    name       varchar(70) collate numeric            not null
);

create table monitor_tag
(
    monitor_id varchar(12) not null
        constraint fkthjnoj7vt2o7mfbcuggn81uxf
            references monitor,
    tag_id     varchar(21) not null
        constraint fkknb9ipiq47f5wxwcqhg7fcu2e
            references tag
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
    password_hash         varchar(68)                            not null,
    name                  varchar(70) collate numeric            not null,
    email                 varchar(255)                           not null
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
    id         varchar(25)                            not null
        primary key,
    email      varchar(255)                           not null,
    old_email  varchar(255)                           not null
);

create table mfa
(
    active     boolean                  default false not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    version    bigint                   default 0     not null,
    secret     varchar(10)                            not null,
    id         varchar(12)                            not null
        primary key,
    user_id    varchar(12)                            not null
        unique
        constraint fk76jkwbib8vip0b30bahk0fae2
            references "user"
);

create table mfa_backup_code
(
    valid      boolean                  default true  not null,
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null,
    version    bigint                   default 0     not null,
    mfa_id     varchar(12)                            not null
        constraint fki960t04n7pkv6r44nhe0527vp
            references mfa,
    id         varchar(25)                            not null
        primary key,
    code_hash  varchar(68)                            not null,
    unique (mfa_id, code_hash)
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
    id         varchar(25)                            not null
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
    user_id    varchar(12)                            not null
        constraint fk4ngjbnpkmrmuabmythg8le9wv
            references "user"
            on delete cascade,
    primary key (team_id, user_id)
);

