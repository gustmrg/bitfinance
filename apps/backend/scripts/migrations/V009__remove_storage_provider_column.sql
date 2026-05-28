START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260312014559_RemoveStorageProviderColumn') THEN
    ALTER TABLE bill_documents DROP COLUMN storage_provider;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260312014559_RemoveStorageProviderColumn') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260312014559_RemoveStorageProviderColumn', '10.0.0');
    END IF;
END $EF$;
COMMIT;

