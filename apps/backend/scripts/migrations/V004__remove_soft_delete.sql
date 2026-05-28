START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260221030246_RemoveSoftDelete') THEN
    ALTER TABLE user_settings DROP COLUMN deleted_at;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260221030246_RemoveSoftDelete') THEN
    ALTER TABLE organizations DROP COLUMN deleted_at;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260221030246_RemoveSoftDelete') THEN
    ALTER TABLE expenses DROP COLUMN deleted_at;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260221030246_RemoveSoftDelete') THEN
    ALTER TABLE bills DROP COLUMN deleted_at;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260221030246_RemoveSoftDelete') THEN
    ALTER TABLE bill_documents DROP COLUMN deleted_at;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260221030246_RemoveSoftDelete') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260221030246_RemoveSoftDelete', '10.0.0');
    END IF;
END $EF$;
COMMIT;

