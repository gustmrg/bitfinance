START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260221223428_AddOrganizationMembership') THEN
    DROP TABLE organization_invites;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260221223428_AddOrganizationMembership') THEN
    DROP TABLE organization_user;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260221223428_AddOrganizationMembership') THEN
    ALTER TABLE organizations ADD plan_tier integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260221223428_AddOrganizationMembership') THEN
    CREATE TABLE invitations (
        id uuid NOT NULL,
        organization_id uuid NOT NULL,
        email character varying(256) NOT NULL,
        role integer NOT NULL,
        invited_by_user_id text NOT NULL,
        status integer NOT NULL,
        token character varying(256) NOT NULL,
        expires_at timestamp(3) with time zone NOT NULL,
        created_at timestamp(3) with time zone NOT NULL,
        CONSTRAINT pk_invitations PRIMARY KEY (id),
        CONSTRAINT fk_invitations_asp_net_users_invited_by_id FOREIGN KEY (invited_by_user_id) REFERENCES asp_net_users (id) ON DELETE SET NULL,
        CONSTRAINT fk_invitations_organizations_organization_id FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260221223428_AddOrganizationMembership') THEN
    CREATE TABLE organization_members (
        user_id text NOT NULL,
        organization_id uuid NOT NULL,
        role integer NOT NULL,
        joined_at timestamp(3) with time zone NOT NULL,
        CONSTRAINT "PK_organization_members" PRIMARY KEY (user_id, organization_id),
        CONSTRAINT fk_organization_members_asp_net_users_user_id FOREIGN KEY (user_id) REFERENCES asp_net_users (id) ON DELETE CASCADE,
        CONSTRAINT fk_organization_members_organizations_organization_id FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260221223428_AddOrganizationMembership') THEN
    CREATE INDEX "IX_invitations_invited_by_user_id" ON invitations (invited_by_user_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260221223428_AddOrganizationMembership') THEN
    CREATE INDEX ix_invitations_organization_id ON invitations (organization_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260221223428_AddOrganizationMembership') THEN
    CREATE UNIQUE INDEX "IX_invitations_token" ON invitations (token);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260221223428_AddOrganizationMembership') THEN
    CREATE INDEX ix_organization_members_organization_id ON organization_members (organization_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260221223428_AddOrganizationMembership') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260221223428_AddOrganizationMembership', '10.0.0');
    END IF;
END $EF$;
COMMIT;

