ALTER TABLE notification
    ADD COLUMN public_check_result_id VARCHAR(25),
    ADD COLUMN monitor_id bigint
        constraint fk_notification_monitor_id__id
            references monitor
            on update restrict on delete restrict,
    ADD COLUMN status varchar(1);

UPDATE notification n
SET
    public_check_result_id = cr.public_id,
    monitor_id = cr.monitor_id,
    status = cr.status
FROM check_result cr
WHERE n.check_result_id = cr.id;

ALTER TABLE notification ALTER COLUMN public_check_result_id SET NOT NULL;
ALTER TABLE notification ALTER COLUMN monitor_id SET NOT NULL;
ALTER TABLE notification ALTER COLUMN status SET NOT NULL;

create index notification_monitor_id
    on notification (monitor_id);
