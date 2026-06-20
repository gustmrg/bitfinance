START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260618015456_AddBillSeries') THEN
    ALTER TABLE bills ADD bill_series_id uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260618015456_AddBillSeries') THEN
    ALTER TABLE bills ADD occurrence_number integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260618015456_AddBillSeries') THEN
    ALTER TABLE bills ADD total_occurrences integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260618015456_AddBillSeries') THEN
    CREATE TABLE bill_series (
        id uuid NOT NULL,
        description text NOT NULL,
        category text NOT NULL,
        frequency text NOT NULL,
        amount_due numeric(10,2) NOT NULL,
        start_date date NOT NULL,
        total_occurrences integer,
        is_active boolean NOT NULL,
        next_occurrence_number integer NOT NULL,
        created_at timestamp(3) with time zone NOT NULL,
        updated_at timestamp(3) with time zone,
        stopped_at timestamp(3) with time zone,
        organization_id uuid NOT NULL,
        CONSTRAINT pk_bill_series PRIMARY KEY (id),
        CONSTRAINT ck_bill_series_amount_non_negative CHECK (amount_due >= 0),
        CONSTRAINT ck_bill_series_next_occurrence_positive CHECK (next_occurrence_number > 0),
        CONSTRAINT fk_bill_series_organizations_organization_id FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260618015456_AddBillSeries') THEN
    CREATE INDEX ix_bills_bill_series_id ON bills (bill_series_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260618015456_AddBillSeries') THEN
    CREATE INDEX ix_bill_series_organization_id ON bill_series (organization_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260618015456_AddBillSeries') THEN
    ALTER TABLE bills ADD CONSTRAINT fk_bills_bill_series_bill_series_id FOREIGN KEY (bill_series_id) REFERENCES bill_series (id) ON DELETE SET NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260618015456_AddBillSeries') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260618015456_AddBillSeries', '10.0.0');
    END IF;
END $EF$;
COMMIT;
