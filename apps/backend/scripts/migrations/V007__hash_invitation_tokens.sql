START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260224023654_HashInvitationTokens') THEN
    ALTER TABLE invitations RENAME COLUMN token TO token_hash;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260224023654_HashInvitationTokens') THEN
    ALTER INDEX "IX_invitations_token" RENAME TO "IX_invitations_token_hash";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260224023654_HashInvitationTokens') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260224023654_HashInvitationTokens', '10.0.0');
    END IF;
END $EF$;
COMMIT;

