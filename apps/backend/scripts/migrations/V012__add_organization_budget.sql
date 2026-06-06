START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260531120000_AddOrganizationBudget') THEN
    CREATE TABLE budgets (
        id uuid NOT NULL,
        organization_id uuid NOT NULL,
        amount numeric(10,2) NOT NULL,
        created_at timestamp(3) with time zone NOT NULL,
        updated_at timestamp(3) with time zone,
        CONSTRAINT pk_budgets PRIMARY KEY (id),
        CONSTRAINT ck_budgets_amount_non_negative CHECK (amount >= 0),
        CONSTRAINT fk_budgets_organizations_organization_id FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260531120000_AddOrganizationBudget') THEN
    CREATE UNIQUE INDEX ix_budgets_organization_id ON budgets (organization_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260531120000_AddOrganizationBudget') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260531120000_AddOrganizationBudget', '10.0.0');
    END IF;
END $EF$;
COMMIT;
