START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    ALTER TABLE bill_documents RENAME TO attachments;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    ALTER INDEX pk_bill_documents RENAME TO pk_attachments;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    ALTER INDEX ix_bill_documents_bill_id RENAME TO ix_attachments_bill_id;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    ALTER TABLE attachments RENAME COLUMN document_type TO file_category;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    ALTER TABLE attachments ALTER COLUMN bill_id DROP NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    ALTER TABLE attachments ALTER COLUMN uploaded_by_user_id TYPE text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    ALTER TABLE attachments ADD expense_id uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    ALTER TABLE attachments ADD user_id text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    ALTER TABLE attachments ADD organization_id uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    ALTER TABLE attachments ADD attachment_type integer NOT NULL DEFAULT 1;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    UPDATE attachments SET organization_id = b.organization_id FROM bills b WHERE attachments.bill_id = b.id
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    ALTER TABLE attachments ADD CONSTRAINT ck_attachments_single_owner CHECK ((CASE WHEN bill_id IS NOT NULL THEN 1 ELSE 0 END +
                      CASE WHEN expense_id IS NOT NULL THEN 1 ELSE 0 END +
                      CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) = 1);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    ALTER TABLE attachments ADD CONSTRAINT fk_attachments_expenses_expense_id FOREIGN KEY (expense_id) REFERENCES expenses (id) ON DELETE CASCADE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    ALTER TABLE attachments ADD CONSTRAINT fk_attachments_asp_net_users_user_id FOREIGN KEY (user_id) REFERENCES asp_net_users (id) ON DELETE CASCADE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    ALTER TABLE attachments ADD CONSTRAINT fk_attachments_organizations_organization_id FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    ALTER TABLE attachments DROP CONSTRAINT IF EXISTS fk_bill_documents_bills_bill_id;
                      ALTER TABLE attachments ADD CONSTRAINT fk_attachments_bills_bill_id
                      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    CREATE INDEX ix_attachments_expense_id ON attachments (expense_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    CREATE UNIQUE INDEX ix_attachments_user_id ON attachments (user_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    CREATE INDEX ix_attachments_organization_id ON attachments (organization_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260313000212_GeneralizeAttachments') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260313000212_GeneralizeAttachments', '10.0.0');
    END IF;
END $EF$;
COMMIT;

