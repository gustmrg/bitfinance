START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260224003559_RemovePlanTierDatabaseDefault') THEN
    ALTER TABLE organizations ALTER COLUMN plan_tier DROP DEFAULT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260224003559_RemovePlanTierDatabaseDefault') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260224003559_RemovePlanTierDatabaseDefault', '10.0.0');
    END IF;
END $EF$;
COMMIT;

