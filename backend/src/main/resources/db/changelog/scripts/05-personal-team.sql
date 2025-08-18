-- 1. Add new column user_id to team (nullable)
ALTER TABLE team
    ADD COLUMN user_id varchar(12);

-- 2. Copy data from user.personal_team_id into team.user_id
UPDATE team t
SET user_id = u.id
FROM "user" u
WHERE u.personal_team_id = t.id;

-- 3. Add foreign key constraint (nullable, but if set must reference user)
ALTER TABLE team
    ADD CONSTRAINT fk_team_user FOREIGN KEY (user_id)
        REFERENCES "user" (id)
        ON DELETE CASCADE;

-- 4. Add partial unique index to enforce uniqueness only when user_id is not null
CREATE UNIQUE INDEX uq_team_user_id_not_null
    ON team (user_id)
    WHERE user_id IS NOT NULL;

-- 5. Drop old column from user
ALTER TABLE "user"
    DROP CONSTRAINT fkeukpy99fybt6wyx9ojnau1nhb;
ALTER TABLE "user"
    DROP COLUMN personal_team_id;
