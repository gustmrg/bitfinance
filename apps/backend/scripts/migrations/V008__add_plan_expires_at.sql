START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260311031914_AddPlanExpiresAt') THEN
    ALTER TABLE organizations ADD plan_expires_at timestamp(3) with time zone NOT NULL DEFAULT TIMESTAMPTZ '-infinity';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260311031914_AddPlanExpiresAt') THEN
    UPDATE organizations SET plan_expires_at = NOW() + INTERVAL '1 month'
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260311031914_AddPlanExpiresAt') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260311031914_AddPlanExpiresAt', '10.0.0');
    END IF;
END $EF$;
COMMIT;

