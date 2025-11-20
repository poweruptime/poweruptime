-- Teams
INSERT INTO team (id, public_id, name) VALUES (1, '4Lxhu5YKWPBr', 'First Team');
INSERT INTO team (id, public_id, name) VALUES (2, 'wERfKhghD98U', 'Second Team');
INSERT INTO team (id, public_id, name) VALUES (3, '5GXzHe8YATsA', 'Third Team');

-- System Admin Users
INSERT INTO "user" (id, public_id, activated, email, name, force_password_change, password_hash, role)
VALUES (1, 'ZD5CjpPYSPEk', true, 'admin@admin.org', 'Gerhold Walburga', false, '{bcrypt}$2a$10$fWZC48Sm9NVD68NaHya2q.CyU8bc0Vo8obPC.YyzPze9fqMt0okFq', 'A')
ON CONFLICT DO NOTHING;

-- MFA Code
-- Add to user 4
INSERT INTO mfa (id, active, secret) VALUES (1, true, '7tyjXh9ckw');
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash) VALUES (false, 1, '{bcrypt}$2a$10$frxq0jWijNHwXc48MBKKGuYRQj6sz02tvxvyaU9CuOUMOCYI72I6C');
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash) VALUES (true, 1, '{bcrypt}$2a$10$/Cf.xm.JDCjEg10I4cKXV.3lcwe6A4rf/580bka3mVphbW49t2eC6');
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash) VALUES (true, 1, '{bcrypt}$2a$10$oO0eeOdkaPzTLpXbT9HE8.tJ95LCA1O4Ijxc9jCP6risRr7xQkXrq');
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash) VALUES (true, 1, '{bcrypt}$2a$10$cb9Ekb.qhDRpjZOxMZVDOOhojTlpJU.ih86F8ns206PhBC8HYh6IK');
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash) VALUES (true, 1, '{bcrypt}$2a$10$Geu.HIDKF4NVHU70RxcqO.TqJFt5RjTfQhUbPHmF.5XzA0M2LGcY2');
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash) VALUES (true, 1, '{bcrypt}$2a$10$G34qJdqHfXLWd66Vvs4YzOuxtnfhBLor5gp.cWPBnBtXMINMdw5E.');
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash) VALUES (true, 1, '{bcrypt}$2a$10$qxqLK7VB4/Enj8LxBXgBxeN.ITJqhWFsQuep/ph7JbrmWQyQH.84y');
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash) VALUES (true, 1, '{bcrypt}$2a$10$UqtL9jeGYeog7XJRRQO/J.CQF0xkMsnlnGooX2VBveQXhrX9pU4NW');
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash) VALUES (true, 1, '{bcrypt}$2a$10$5wAF5PNvkETmLYZzURtRt.4tzJmxGhlZHWKDHYLZDP2FOxqwm7MFO');
INSERT INTO mfa_backup_code (valid, mfa_id, code_hash) VALUES (true, 1, '{bcrypt}$2a$10$e8ASy6gL5cfhao/x8TSYhuX7l3QOKFJ9P3Jjw2veVhAZBr0sAx5NO');

-- Add to user 3 but inactive
INSERT INTO mfa (id, active, secret) VALUES (2, false, '7tyBXh9ckw');

-- Users
INSERT INTO "user" (id, public_id, activated, email, name, force_password_change, password_hash, role)
VALUES (2, 'ccYmAsus39gG', true, 'test1@test.org', 'Maria Bauer', false, '{bcrypt}$2a$10$n7.iyAMCTNmZHJ90ySiBE.yqVUMFuZoPNJP07WrxoORj88Y6zBQ8K', 'U');
INSERT INTO "user" (id, public_id, activated, email, name, force_password_change, password_hash, role)
VALUES (3, '8BS4AaxuYG9h', true, 'test2@test.org', 'Herbert Müller', false, '{bcrypt}$2a$10$n7.iyAMCTNmZHJ90ySiBE.yqVUMFuZoPNJP07WrxoORj88Y6zBQ8K', 'U');
INSERT INTO "user" (id, public_id, activated, email, name, force_password_change, password_hash, role)
VALUES (4, '2XxpcofD6Ubg', true, 'test3@test.org', 'Franz Lugger', false, '{bcrypt}$2a$10$n7.iyAMCTNmZHJ90ySiBE.yqVUMFuZoPNJP07WrxoORj88Y6zBQ8K', 'U');
INSERT INTO "user" (id, public_id, activated, email, name, force_password_change, password_hash, role, mfa_id)
VALUES (5, 'phECfcYSejyt', true, 'test4@test.org', 'Hannes Schwatz', false, '{bcrypt}$2a$10$n7.iyAMCTNmZHJ90ySiBE.yqVUMFuZoPNJP07WrxoORj88Y6zBQ8K', 'U', 1);
INSERT INTO "user" (id, public_id, activated, email, name, force_password_change, password_hash, role, mfa_id)
VALUES (6, 'BLyrWbFXSg3K', false, 'test5@test.org', 'Peter Lorenz', false, '{bcrypt}$2a$10$n7.iyAMCTNmZHJ90ySiBE.yqVUMFuZoPNJP07WrxoORj88Y6zBQ8K', 'U', 2);

INSERT INTO team (id, public_id, name, user_id) VALUES (4, 'Ew1uauhgwaMR', 'Gerhold Walburga', 1);
INSERT INTO team (id, public_id, name, user_id) VALUES (5, '5KP6CoeMBmHo', 'Maria Bauer', 2);
INSERT INTO team (id, public_id, name, user_id) VALUES (6, 'rRzu565wSrSf', 'Herbert Müller', 3);
INSERT INTO team (id, public_id, name, user_id) VALUES (7, 'kLGeRaxXMM1t', 'Franz Lugger', 4);
INSERT INTO team (id, public_id, name, user_id) VALUES (8, 'Ue3EDswEefwu', 'Hannes Schwatz', 5);
INSERT INTO team (id, public_id, name, user_id) VALUES (9, 'wPHyC6bKWT3Y', 'Peter Lorenz', 6);

-- Team Users
-- Add user 1 to team 1
INSERT INTO team_user (team_id, role, user_id) VALUES (1, 'A', 2);
-- Add user 2 to team 1 by user 1
INSERT INTO team_user (team_id, role, user_id, inviter_id) VALUES (1, 'M', 3, 2);

-- Add user 3 to team 2
INSERT INTO team_user (team_id, role, user_id) VALUES (2, 'A', 4);

-- Monitors

-- SSL Certificate
INSERT INTO monitor (id, public_id, type, team_id, name, test_interval_seconds, status, upside_down, retries, description)
VALUES (1, 'k6A6bEK7C9pC', 'SSL_CERTIFICATE', 1, 'Test SSL Certificate', 120, 'U', false, 0, 'Test');
INSERT INTO monitor_data_ssl_certificate (id, ssl_certificate_url, ssl_certificate_valid_days_left)
VALUES (1, 'https://dafnik.me', 30);

-- HTTP
INSERT INTO monitor (id, public_id, type, team_id, name, test_interval_seconds, status, upside_down, retries, description)
VALUES (2, '6XSKoPbRhSsb', 'HTTP', 1, 'Test HTTP', 120, 'U', false, 0, 'Test');
INSERT INTO monitor_data_http (id, http_url, http_content_type, http_ignore_tls, http_method, http_allowed_status_code_ranges, http_certificate_expiry)
VALUES (2, 'https://expired.badssl.com/', 'JSON', true, 'GET', ARRAY['200-299'], false);

-- DNS CNAME Matches
INSERT INTO monitor (id, public_id, type, team_id, name, test_interval_seconds, status, upside_down, retries, description)
VALUES (3, 'rKALbBX37kWr', 'DNS', 1, 'Test playground CNAME DNS', 60, 'U', false, 0, 'Test');
INSERT INTO monitor_data_dns (id, dns_server, dns_host, dns_matches, dns_port, dns_type)
VALUES (3, '9.9.9.9', 'playground.dafnik.me', '{dafnik.github.io.}', 53, 'CNAME');

-- DNS Exists Team 2
INSERT INTO monitor (id, public_id, type, team_id, name, test_interval_seconds, status, upside_down, retries, description)
VALUES (4, 'pbP9gekfhG44', 'DNS', 2, 'Test playground A DNS null matches', 60, 'U', false, 2, 'Test');
INSERT INTO monitor_data_dns (id, dns_server, dns_host, dns_matches, dns_port, dns_type)
VALUES (4, '9.9.9.9', 'playground.dafnik.me', null, 53, 'A');

-- Notification Methods
-- E-Mail
INSERT INTO notification_method (id, public_id, team_id, type, name) VALUES (1, 'UoKSMt62oFcX', 1, 'EMAIL', 'Test E-Mail');
INSERT INTO notification_method_data_email (id, mail_ignore_tls_errors, mail_port, mail_security, mail_host, mail_password, mail_username, mail_to)
VALUES (1, false, 1234, 'S', 'test.at', '1234', '1234',ARRAY ['test@test.at']);

-- E-Mail
INSERT INTO notification_method (id, public_id, team_id, type, name) VALUES (2, 'gs7jTakASRSp', 1, 'EMAIL', 'Test E-Mail 2');
INSERT INTO notification_method_data_email (id, mail_ignore_tls_errors, mail_port, mail_security, mail_host, mail_password, mail_username, mail_to)
VALUES (2, false, 1234, 'S', 'test.at', '1234', '1234',ARRAY ['test@test.at']);

-- E-Mail
INSERT INTO notification_method (id, public_id, team_id, type, name) VALUES (3, 'TPAbk1uHLp7p', 1, 'EMAIL', 'Test E-Mail 3');
INSERT INTO notification_method_data_email (id, mail_ignore_tls_errors, mail_port, mail_security, mail_host, mail_password, mail_username, mail_to)
VALUES (3, false, 1234, 'S', 'test.at', '1234', '1234',ARRAY ['test@test.at']);

-- E-Mail
INSERT INTO notification_method (id, public_id, team_id, type, name) VALUES (4, 'xytSF54WhCtC', 9, 'EMAIL', 'Check team user permission');
INSERT INTO notification_method_data_email (id, mail_ignore_tls_errors, mail_port, mail_security, mail_host, mail_password, mail_username, mail_to)
VALUES (4, false, 1234, 'S', 'test.at', '1234', '1234',ARRAY ['test@test.at']);

-- Check Results
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (1,'Bq7xLk2mN9aYp4sQw8VdR3tXe', 2, 'U', 'U', '2025-01-04 15:00:08.846185 +00:00', '2025-01-04 15:01:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (2, 'Cw9mRt5pF2kZs7dLb4XhQ6uYf', 2, 'U', 'U', '2025-01-04 15:10:08.846185 +00:00', '2025-01-04 15:11:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (3, 'Dx1nVb8qJ5lMt0eNc7YjR9wZg', 2, 'U', 'U', '2025-01-04 15:20:08.846185 +00:00', '2025-01-04 15:21:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (4, 'Ey3oXc1rK8mNu2fOd0ZkS2aBh', 2, 'U', 'U', '2025-01-04 15:30:08.846185 +00:00', '2025-01-04 15:31:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (5, 'Fz5pYd4sL1nOv3gPe2AlT5bCi', 2, 'U', 'U', '2025-01-04 15:40:08.846185 +00:00', '2025-01-04 15:41:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (6, 'Ga7qZe7tM4oPw6hQf5BmU8cDj', 2, 'U', 'U', '2025-01-04 15:50:08.846185 +00:00', '2025-01-04 15:51:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (7, 'Hb9rAf0uN7pQx9iRg8CnV1dEk', 2, 'U', 'U', '2025-01-04 16:00:08.846185 +00:00', '2025-01-04 16:01:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (8, 'Ic1sBg3vO0qRy2jSh1DoW4eFl', 2, 'U', 'U', '2025-01-04 16:10:08.846185 +00:00', '2025-01-04 16:11:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (9, 'Jd3tCh6wP3rSz5kTi4EpX7fGm', 2, 'U', 'U', '2025-01-04 16:20:08.846185 +00:00', '2025-01-04 16:21:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (10, 'Ke5uDi9xQ6sTa8lUj7FqY0gHn', 2, 'U', 'U', '2025-01-04 16:30:08.846185 +00:00', '2025-01-04 16:31:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (11, 'Lf7vEj2yR9tUb1mVk0GrZ3hIo', 2, 'U', 'U', '2025-01-04 16:40:08.846185 +00:00', '2025-01-04 16:41:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (12, 'Mg9wFk5zS2uVc4nWl3HsA6iJp', 2, 'U', 'U', '2025-01-04 16:50:08.846185 +00:00', '2025-01-04 16:51:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (13, 'Nh1xGl8aT5vWd7oXm6ItB9jKq', 2, 'U', 'U', '2025-01-04 17:00:08.846185 +00:00', '2025-01-04 17:01:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (14, 'Oi3yHm1bU8wXe0pYn9JuC2kLr', 2, 'U', 'U', '2025-01-04 17:10:08.846185 +00:00', '2025-01-04 17:11:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (15, 'Pj5zIn4cV1xYf3qZo2KvD5lMs', 2, 'U', 'U', '2025-01-04 17:20:08.846185 +00:00', '2025-01-04 17:21:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (16, 'Qk7aJo7dW4yZg6rAp5LwE8mNt', 2, 'U', 'U', '2025-01-04 17:30:08.846185 +00:00', '2025-01-04 17:31:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (17, 'Rl9bKp0eX7zAh9sBq8MxF1nOu', 2, 'U', 'U', '2025-01-04 17:40:08.846185 +00:00', '2025-01-04 17:41:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (18, 'Sm1cLq3fY0aBi2tCr1NyG4oPv', 2, 'U', 'U', '2025-01-04 17:50:08.846185 +00:00', '2025-01-04 17:51:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (19, 'Tn3dMr6gZ3bCj5uDs4OzH7pQw', 2, 'U', 'U', '2025-01-04 18:00:08.846185 +00:00', '2025-01-04 18:01:08.846185 +00:00', 20, 1, '200 - OK');
INSERT INTO check_result(id, public_id, monitor_id, status, previous_status, checked_at, picked_up_at, ping, times_retried, title)
VALUES (20, 'Uo5eNs9hA6cDk8vEt7PaJ0qRx', 2, 'U', 'U', '2025-01-04 18:10:08.846185 +00:00', '2025-01-04 18:11:08.846185 +00:00', 20, 1, '200 - OK');

-- Notifications
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (1, '7hySSGASMhDwbcLh6xrEF', 1, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (2, '2BcDeFgHiJkLmNoPqRsTu', 2, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (3, '3CdEfGhIjKlMnOpQrStUv', 3, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (4, '4DeFgHiJkLmNoPqRsTuVw', 4, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (5, '5EfGhIjKlMnOpQrStUvWx', 5, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (6, '6FgHiJkLmNoPqRsTuVwXy', 6, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (7, '7GhIjKlMnOpQrStUvWxYz', 7, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (8, '8HiJkLmNoPqRsTuVwXyZa', 8, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (9, '9IjKlMnOpQrStUvWxYzAb', 9, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (10, '0JkLmNoPqRsTuVwXyZaBc', 10, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (11, '1KlMnOpQrStUvWxYzAbCd', 11, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (12, '2LmNoPqRsTuVwXyZaBcDe', 12, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (13, '3MnOpQrStUvWxYzAbCdEf', 13, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (14, '4NoPqRsTuVwXyZaBcDeFg', 14, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (15, '5OpQrStUvWxYzAbCdEfGh', 15, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (16, '6PqRsTuVwXyZaBcDeFgHi', 16, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (17, '7QrStUvWxYzAbCdEfGhIj', 17, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (18, '8RsTuVwXyZaBcDeFgHiJk', 18, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (19, '9StUvWxYzAbCdEfGhIjKl', 19, '200 - OK');
INSERT INTO notification(id, public_id, check_result_id, title)
VALUES (20, '0TuVwXyZaBcDeFgHiJkLm', 20, '200 - OK');

SELECT setval('team_id_seq', (SELECT MAX(id) FROM team));
SELECT setval('user_id_seq', (SELECT MAX(id) FROM "user"));
SELECT setval('mfa_id_seq', (SELECT MAX(id) FROM mfa));
SELECT setval('mfa_backup_code_id_seq', (SELECT MAX(id) FROM mfa_backup_code));
SELECT setval('monitor_id_seq', (SELECT MAX(id) FROM monitor));
SELECT setval('notification_method_id_seq', (SELECT MAX(id) FROM notification_method));
SELECT setval('check_result_id_seq', (SELECT MAX(id) FROM check_result));
SELECT setval('notification_id_seq', (SELECT MAX(id) FROM notification));
