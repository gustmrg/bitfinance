START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260213024319_HardenOrganizationTimeZoneDefaults') THEN
    UPDATE organizations
    SET timezone_id = 'America/Sao_Paulo'
    WHERE timezone_id IS NULL OR btrim(timezone_id) = '';

    UPDATE organizations
    SET timezone_id = REPLACE(timezone_id, ' ', '_')
    WHERE timezone_id LIKE '% %';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260213024319_HardenOrganizationTimeZoneDefaults') THEN
    ALTER TABLE organizations ALTER COLUMN timezone_id SET DEFAULT 'America/Sao_Paulo';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260213024319_HardenOrganizationTimeZoneDefaults') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260213024319_HardenOrganizationTimeZoneDefaults', '10.0.0');
    END IF;
END $EF$;
COMMIT;

