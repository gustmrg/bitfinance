START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260207015621_AddRefreshToken') THEN
    CREATE TABLE refresh_tokens (
        id uuid NOT NULL,
        token_hash character varying(512) NOT NULL,
        user_id text NOT NULL,
        token_family_id uuid NOT NULL,
        expires_at timestamp with time zone NOT NULL,
        is_revoked boolean NOT NULL,
        revoked_at timestamp with time zone,
        revoked_reason character varying(256),
        replaced_by_token_id uuid,
        created_at timestamp with time zone NOT NULL,
        created_by_ip character varying(45),
        user_agent character varying(512),
        CONSTRAINT pk_refresh_tokens PRIMARY KEY (id),
        CONSTRAINT fk_refresh_tokens_asp_net_users_user_id FOREIGN KEY (user_id) REFERENCES asp_net_users (id) ON DELETE CASCADE,
        CONSTRAINT fk_refresh_tokens_refresh_tokens_replaced_by_token_id FOREIGN KEY (replaced_by_token_id) REFERENCES refresh_tokens (id) ON DELETE SET NULL
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260207015621_AddRefreshToken') THEN
    CREATE INDEX ix_refresh_tokens_replaced_by_token_id ON refresh_tokens (replaced_by_token_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260207015621_AddRefreshToken') THEN
    CREATE INDEX "IX_refresh_tokens_token_family_id" ON refresh_tokens (token_family_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260207015621_AddRefreshToken') THEN
    CREATE INDEX "IX_refresh_tokens_token_hash" ON refresh_tokens (token_hash);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260207015621_AddRefreshToken') THEN
    CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260207015621_AddRefreshToken') THEN
    CREATE INDEX "IX_refresh_tokens_user_id_is_revoked_expires_at" ON refresh_tokens (user_id, is_revoked, expires_at);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260207015621_AddRefreshToken') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260207015621_AddRefreshToken', '10.0.0');
    END IF;
END $EF$;
COMMIT;

