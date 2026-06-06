START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260504114431_NormalizeZeroPlanTier') THEN
    UPDATE organizations SET plan_tier = 1 WHERE plan_tier = 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260504114431_NormalizeZeroPlanTier') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260504114431_NormalizeZeroPlanTier', '10.0.0');
    END IF;
END $EF$;
COMMIT;
