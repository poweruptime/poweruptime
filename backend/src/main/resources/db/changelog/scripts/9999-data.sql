-- Teams
INSERT INTO team (id, name) VALUES ('4Lxhu5YKWPBr', 'First Team');
INSERT INTO team (id, name) VALUES ('wERfKhghD98U', 'Second Team');
INSERT INTO team (id, name) VALUES ('5GXzHe8YATsA', 'Third Team');

INSERT INTO team (id, name) VALUES ('Ew1uauhgwaMR', 'Gerhold Walburga');
INSERT INTO team (id, name) VALUES ('5KP6CoeMBmHo', 'Maria Bauer');
INSERT INTO team (id, name) VALUES ('rRzu565wSrSf', 'Herbert Müller');
INSERT INTO team (id, name) VALUES ('kLGeRaxXMM1t', 'Franz Lugger');
INSERT INTO team (id, name) VALUES ('Ue3EDswEefwu', 'Hannes Schwatz');


-- System Admin Users
INSERT INTO "user" (id, activated, email, name, force_password_change, password_hash, role, personal_team_id)
VALUES ('ZD5CjpPYSPEk', true, 'admin@admin.org', 'Gerhold Walburga', false, '{bcrypt}$2a$12$b0pyQmdrre5N5jM9hUC7PeTYw.jtcItnLfOA0PbsICgS.5r.I21Sm', 'A', 'Ew1uauhgwaMR')
ON CONFLICT DO NOTHING;

-- Users
INSERT INTO "user" (id, activated, email, name, force_password_change, password_hash, role, personal_team_id)
VALUES ('ccYmAsus39gG', true, 'test1@test.org', 'Maria Bauer', false, '{bcrypt}$2y$12$sysJ25.IN.butJu7QIpYleQ6Suw69.1NJ5K3TQJlJkVVCwZtG9xny', 'U', '5KP6CoeMBmHo');
INSERT INTO "user" (id, activated, email, name, force_password_change, password_hash, role, personal_team_id)
VALUES ('8BS4AaxuYG9h', true, 'test2@test.org', 'Herbert Müller', false, '{bcrypt}$2y$12$sysJ25.IN.butJu7QIpYleQ6Suw69.1NJ5K3TQJlJkVVCwZtG9xny', 'U', 'rRzu565wSrSf');
INSERT INTO "user" (id, activated, email, name, force_password_change, password_hash, role, personal_team_id)
VALUES ('2XxpcofD6Ubg', true, 'test3@test.org', 'Franz Lugger', false, '{bcrypt}$2y$12$sysJ25.IN.butJu7QIpYleQ6Suw69.1NJ5K3TQJlJkVVCwZtG9xny', 'U', 'kLGeRaxXMM1t');
INSERT INTO "user" (id, activated, email, name, force_password_change, password_hash, role, personal_team_id)
VALUES ('phECfcYSejyt', true, 'test4@test.org', 'Hannes Schwatz', false, '{bcrypt}$2y$12$sysJ25.IN.butJu7QIpYleQ6Suw69.1NJ5K3TQJlJkVVCwZtG9xny', 'U', 'Ue3EDswEefwu');

-- Team Users
-- Add user 1 to team 1
INSERT INTO team_user (team_id, role, user_id) VALUES ('4Lxhu5YKWPBr', 'A', 'ccYmAsus39gG');
-- Add user 2 to team 1 by user 1
INSERT INTO team_user (team_id, role, user_id, inviter_id) VALUES ('4Lxhu5YKWPBr', 'M', '8BS4AaxuYG9h', 'ccYmAsus39gG');

-- Add user 3 to team 2
INSERT INTO team_user (team_id, role, user_id) VALUES ('wERfKhghD98U', 'A', '2XxpcofD6Ubg');

-- System Notifications
INSERT INTO system_notification (id, title, description, active, type, starts, ends)
    VALUES ('KDemk18U55Wo', 'Planned Maintenance 1', 'Updates will be done', true, 'W', '2023-06-04 17:40:00.434373', '2023-06-04 20:40:00.434373');
INSERT INTO system_notification (id, title, description, active, type)
    VALUES ('hroof4wcGKgs', 'Planned Maintenance 2', 'Updates will be done', true, 'W');
INSERT INTO system_notification (id, title, description, active, type, starts, ends)
    VALUES ('uWWhR6FzeGmC', 'Planned Maintenance not active', 'Updates will be done', false, 'W', '2023-06-04 17:40:00.434373', '2023-06-04 20:40:00.434373');

-- Monitors

-- SSL Certificate
INSERT INTO monitor_checker_data (id, _type) VALUES ('BbTCKAKofbF1', 'SSL_CERTIFICATE');
INSERT INTO monitor_checker_data_ssl_certificate (id, ssl_certificate_url, ssl_certificate_valid_days_left)
VALUES ('BbTCKAKofbF1', 'https://dafnik.me', 30);

INSERT INTO monitor (id, monitor_checker_id, team_id, name, test_interval_seconds, status, upside_down, retries,
                     description)
VALUES ('k6A6bEK7C9pC', 'BbTCKAKofbF1', '4Lxhu5YKWPBr', 'Test SSL Certificate', 120, 'U', false, 0, 'Test');

-- HTTP
INSERT INTO monitor_checker_data (id, _type) VALUES ('sPDD36R7KTgs', 'HTTP');
INSERT INTO monitor_checker_data_http (id, http_url, http_content_type, http_ignore_tls, http_method)
VALUES ('sPDD36R7KTgs', 'https://expired.badssl.com/', 'JSON', true, 'GET');

INSERT INTO monitor (status, upside_down, created_at, deleted, resend_after, retries, test_interval_seconds, updated_at,
                     version, id, monitor_checker_id, team_id, name, description)
VALUES ('U', false, '2025-01-04 13:56:03.955130 +00:00', null, null, 0, 120, '2025-01-04 14:40:03.312240 +00:00', 37,
        '6XSKoPbRhSsb', 'sPDD36R7KTgs', '4Lxhu5YKWPBr', 'Test HTTP', 'Test');

-- DNS CNAME Matches
INSERT INTO monitor_checker_data (id, _type) VALUES ('wPz3rDrwsFSk', 'DNS');
INSERT INTO monitor_checker_data_dns (id, dns_server, dns_host, dns_matches, dns_port, dns_type)
VALUES ('wPz3rDrwsFSk', '9.9.9.9', 'playground.dafnik.me', '{dafnik.github.io.}', 53, 'CNAME');

INSERT INTO monitor (status, upside_down, created_at, deleted, resend_after, retries, test_interval_seconds, updated_at,
                     version, id, monitor_checker_id, team_id, name, description)
VALUES ('U', false, '2025-01-04 13:56:03.975070 +00:00', null, null, 2, 60, '2025-01-04 14:40:06.418497 +00:00', 23,
        'rKALbBX37kWr', 'wPz3rDrwsFSk', '4Lxhu5YKWPBr', 'Test playground CNAME DNS', 'Test');

-- DNS Exists Team 2
INSERT INTO monitor_checker_data (id, _type) VALUES ('5PkEZTcxCt9f', 'DNS');
INSERT INTO monitor_checker_data_dns (id, dns_server, dns_host, dns_matches, dns_port, dns_type)
VALUES ('5PkEZTcxCt9f', '9.9.9.9', 'playground.dafnik.me', null, 53, 'A');

INSERT INTO monitor (status, upside_down, created_at, deleted, resend_after, retries, test_interval_seconds, updated_at,
                     version, id, monitor_checker_id, team_id, name, description)
VALUES ('U', false, '2025-01-04 13:56:03.979055 +00:00', null, null, 2, 60, '2025-01-04 14:40:08.846185 +00:00', 25,
        'pbP9gekfhG44', '5PkEZTcxCt9f', 'wERfKhghD98U', 'Test playground A DNS null matches', 'Test');
