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
VALUES ('ZD5CjpPYSPEk', true, 'admin@admin.org', 'Gerhold Walburga', false, '{bcrypt}$2a$10$fWZC48Sm9NVD68NaHya2q.CyU8bc0Vo8obPC.YyzPze9fqMt0okFq', 'A', 'Ew1uauhgwaMR')
ON CONFLICT DO NOTHING;

-- Users
INSERT INTO "user" (id, activated, email, name, force_password_change, password_hash, role, personal_team_id)
VALUES ('ccYmAsus39gG', true, 'test1@test.org', 'Maria Bauer', false, '{bcrypt}$2a$10$n7.iyAMCTNmZHJ90ySiBE.yqVUMFuZoPNJP07WrxoORj88Y6zBQ8K', 'U', '5KP6CoeMBmHo');
INSERT INTO "user" (id, activated, email, name, force_password_change, password_hash, role, personal_team_id)
VALUES ('8BS4AaxuYG9h', true, 'test2@test.org', 'Herbert Müller', false, '{bcrypt}$2a$10$n7.iyAMCTNmZHJ90ySiBE.yqVUMFuZoPNJP07WrxoORj88Y6zBQ8K', 'U', 'rRzu565wSrSf');
INSERT INTO "user" (id, activated, email, name, force_password_change, password_hash, role, personal_team_id)
VALUES ('2XxpcofD6Ubg', true, 'test3@test.org', 'Franz Lugger', false, '{bcrypt}$2a$10$n7.iyAMCTNmZHJ90ySiBE.yqVUMFuZoPNJP07WrxoORj88Y6zBQ8K', 'U', 'kLGeRaxXMM1t');
INSERT INTO "user" (id, activated, email, name, force_password_change, password_hash, role, personal_team_id)
VALUES ('phECfcYSejyt', true, 'test4@test.org', 'Hannes Schwatz', false, '{bcrypt}$2a$10$n7.iyAMCTNmZHJ90ySiBE.yqVUMFuZoPNJP07WrxoORj88Y6zBQ8K', 'U', 'Ue3EDswEefwu');

-- MFA Code
-- Add to user 4
INSERT INTO mfa (active, secret, id, user_id) VALUES (true, '7tyjXh9ckw', 'mMyKW886w2xP', 'phECfcYSejyt');
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash, id) VALUES (false, 'mMyKW886w2xP', '{bcrypt}$2a$10$frxq0jWijNHwXc48MBKKGuYRQj6sz02tvxvyaU9CuOUMOCYI72I6C', 'fxRzehwsFHt36SKhjabxLjCUA'); -- sA1XZuMTFWTX8kxaS8CEP2fZx
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash, id) VALUES (true, 'mMyKW886w2xP', '{bcrypt}$2a$10$/Cf.xm.JDCjEg10I4cKXV.3lcwe6A4rf/580bka3mVphbW49t2eC6', 'a66mbDpPC1BG1a9tp4Xy5DGb3'); -- MrZcfxDk6kbFKrrw7APWk4Zz3
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash, id) VALUES (true, 'mMyKW886w2xP', '{bcrypt}$2a$10$oO0eeOdkaPzTLpXbT9HE8.tJ95LCA1O4Ijxc9jCP6risRr7xQkXrq', 'sA5yBDfrRfsyw8ZW9cHKFhs8E'); -- HU5ELSCkW4XXFE5cpekk2buRM
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash, id) VALUES (true, 'mMyKW886w2xP', '{bcrypt}$2a$10$cb9Ekb.qhDRpjZOxMZVDOOhojTlpJU.ih86F8ns206PhBC8HYh6IK', 'FowEwe3AUyYCyPKkWwEpBDaLu'); -- BGGL5mMBfA76yufDpkPjbUXsa
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash, id) VALUES (true, 'mMyKW886w2xP', '{bcrypt}$2a$10$Geu.HIDKF4NVHU70RxcqO.TqJFt5RjTfQhUbPHmF.5XzA0M2LGcY2', 'zeft6hGCxhSaEpA39P5XAgpyb'); -- fYKsMyzK6SAK16Y2Kyo2Sth6e
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash, id) VALUES (true, 'mMyKW886w2xP', '{bcrypt}$2a$10$G34qJdqHfXLWd66Vvs4YzOuxtnfhBLor5gp.cWPBnBtXMINMdw5E.', 'CehX3ysKcfj8Ej5mCszboUhxX'); -- fA1UzgyF2U8rsCXKs2FF2p7GU
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash, id) VALUES (true, 'mMyKW886w2xP', '{bcrypt}$2a$10$qxqLK7VB4/Enj8LxBXgBxeN.ITJqhWFsQuep/ph7JbrmWQyQH.84y', 'hkFhM9pcbYzrYCeL3c6wMRapM'); -- 6eaMP1ojKwaoRyaE385gm8xpo
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash, id) VALUES (true, 'mMyKW886w2xP', '{bcrypt}$2a$10$UqtL9jeGYeog7XJRRQO/J.CQF0xkMsnlnGooX2VBveQXhrX9pU4NW', 'YMe11pfsja9koBmbRRoe5P5M2'); -- FhU9Bj4e45YkykD93LBL792Ty
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash, id) VALUES (true, 'mMyKW886w2xP', '{bcrypt}$2a$10$5wAF5PNvkETmLYZzURtRt.4tzJmxGhlZHWKDHYLZDP2FOxqwm7MFO', '9aCfPaFRkMAxAWbCX5jAMWmj3'); -- 6E11k3mse8z45HAFCa3ht74z8
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash, id) VALUES (true, 'mMyKW886w2xP', '{bcrypt}$2a$10$e8ASy6gL5cfhao/x8TSYhuX7l3QOKFJ9P3Jjw2veVhAZBr0sAx5NO', 'cbrxML8Ew4BDZWAuST8pE8ubZ'); -- YMFHMLycHwuP7F2k2GtKEzrRa

-- Add to user 3 but inactive
INSERT INTO mfa (active, secret, id, user_id) VALUES (false, '7tyBXh9ckw', 'WBAouSY2rZWP', '2XxpcofD6Ubg');

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
INSERT INTO monitor_data (id, _type) VALUES ('BbTCKAKofbF1', 'SSL_CERTIFICATE');
INSERT INTO monitor_data_ssl_certificate (id, ssl_certificate_url, ssl_certificate_valid_days_left)
VALUES ('BbTCKAKofbF1', 'https://dafnik.me', 30);

INSERT INTO monitor (id, monitor_checker_id, team_id, name, test_interval_seconds, status, upside_down, retries,
                     description)
VALUES ('k6A6bEK7C9pC', 'BbTCKAKofbF1', '4Lxhu5YKWPBr', 'Test SSL Certificate', 120, 'U', false, 0, 'Test');

-- HTTP
INSERT INTO monitor_data (id, _type) VALUES ('sPDD36R7KTgs', 'HTTP');
INSERT INTO monitor_data_http (id, http_url, http_content_type, http_ignore_tls, http_method, http_allowed_status_code_ranges, http_certificate_expiry)
VALUES ('sPDD36R7KTgs', 'https://expired.badssl.com/', 'JSON', true, 'GET', ARRAY['200-299'], false);

INSERT INTO monitor (status, upside_down, created_at, deleted, resend_after, retries, test_interval_seconds, updated_at,
                     version, id, monitor_checker_id, team_id, name, description)
VALUES ('U', false, '2025-01-04 13:56:03.955130 +00:00', null, null, 0, 120, '2025-01-04 14:40:03.312240 +00:00', 37,
        '6XSKoPbRhSsb', 'sPDD36R7KTgs', '4Lxhu5YKWPBr', 'Test HTTP', 'Test');

-- DNS CNAME Matches
INSERT INTO monitor_data (id, _type) VALUES ('wPz3rDrwsFSk', 'DNS');
INSERT INTO monitor_data_dns (id, dns_server, dns_host, dns_matches, dns_port, dns_type)
VALUES ('wPz3rDrwsFSk', '9.9.9.9', 'playground.dafnik.me', '{dafnik.github.io.}', 53, 'CNAME');

INSERT INTO monitor (status, upside_down, created_at, deleted, resend_after, retries, test_interval_seconds, updated_at,
                     version, id, monitor_checker_id, team_id, name, description)
VALUES ('U', false, '2025-01-04 13:56:03.975070 +00:00', null, null, 2, 60, '2025-01-04 14:40:06.418497 +00:00', 23,
        'rKALbBX37kWr', 'wPz3rDrwsFSk', '4Lxhu5YKWPBr', 'Test playground CNAME DNS', 'Test');

-- DNS Exists Team 2
INSERT INTO monitor_data (id, _type) VALUES ('5PkEZTcxCt9f', 'DNS');
INSERT INTO monitor_data_dns (id, dns_server, dns_host, dns_matches, dns_port, dns_type)
VALUES ('5PkEZTcxCt9f', '9.9.9.9', 'playground.dafnik.me', null, 53, 'A');

INSERT INTO monitor (status, upside_down, created_at, deleted, resend_after, retries, test_interval_seconds, updated_at,
                     version, id, monitor_checker_id, team_id, name, description)
VALUES ('U', false, '2025-01-04 13:56:03.979055 +00:00', null, null, 2, 60, '2025-01-04 14:40:08.846185 +00:00', 25,
        'pbP9gekfhG44', '5PkEZTcxCt9f', 'wERfKhghD98U', 'Test playground A DNS null matches', 'Test');

-- Notification Methods
-- E-Mail
INSERT INTO notification_method_data (id, _type) VALUES ('mWj79S7CpUyM', 'EMAIL');
INSERT INTO notification_method_data_email (mail_ignore_tls_errors, mail_port, mail_security, id, mail_host, mail_password, mail_username, mail_to)
VALUES (false, 1234, 'S', 'mWj79S7CpUyM', 'test.at', '1234', '1234',ARRAY ['test@test.at']);
INSERT INTO notification_method (id, notification_method_data_id, team_id, name) VALUES ('UoKSMt62oFcX', 'mWj79S7CpUyM', '4Lxhu5YKWPBr', 'Test E-Mail');

-- E-Mail
INSERT INTO notification_method_data (id, _type) VALUES ('F9MeayHjjpB3', 'EMAIL');
INSERT INTO notification_method_data_email (mail_ignore_tls_errors, mail_port, mail_security, id, mail_host, mail_password, mail_username, mail_to)
VALUES (false, 1234, 'S', 'F9MeayHjjpB3', 'test.at', '1234', '1234',ARRAY ['test@test.at']);
INSERT INTO notification_method (id, notification_method_data_id, team_id, name) VALUES ('gs7jTakASRSp', 'F9MeayHjjpB3', '4Lxhu5YKWPBr', 'Test E-Mail 2');

-- E-Mail
INSERT INTO notification_method_data (id, _type) VALUES ('xStfmBA6wH4C', 'EMAIL');
INSERT INTO notification_method_data_email (mail_ignore_tls_errors, mail_port, mail_security, id, mail_host, mail_password, mail_username, mail_to)
VALUES (false, 1234, 'S', 'xStfmBA6wH4C', 'test.at', '1234', '1234',ARRAY ['test@test.at']);
INSERT INTO notification_method (id, notification_method_data_id, team_id, name) VALUES ('TPAbk1uHLp7p', 'xStfmBA6wH4C', '4Lxhu5YKWPBr', 'Test E-Mail 2');
