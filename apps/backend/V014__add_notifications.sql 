START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715040314_AddNotifications') THEN
    CREATE TABLE notification_outbox_messages (
        id uuid NOT NULL,
        organization_id uuid NOT NULL,
        type character varying(64) NOT NULL,
        aggregate_id character varying(128),
        deduplication_key character varying(256) NOT NULL,
        payload_json jsonb NOT NULL,
        created_at timestamp(3) with time zone NOT NULL,
        processed_at timestamp(3) with time zone,
        attempts integer NOT NULL,
        next_attempt_at timestamp(3) with time zone NOT NULL,
        locked_until timestamp(3) with time zone,
        last_error character varying(2000),
        CONSTRAINT pk_notification_outbox_messages PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715040314_AddNotifications') THEN
    CREATE TABLE notification_preferences (
        user_id text NOT NULL,
        organization_id uuid NOT NULL,
        email_bill_reminders_enabled boolean NOT NULL DEFAULT TRUE,
        created_at timestamp(3) with time zone NOT NULL,
        updated_at timestamp(3) with time zone,
        CONSTRAINT "PK_notification_preferences" PRIMARY KEY (user_id, organization_id),
        CONSTRAINT fk_notification_preferences_asp_net_users_user_id FOREIGN KEY (user_id) REFERENCES asp_net_users (id) ON DELETE CASCADE,
        CONSTRAINT fk_notification_preferences_organizations_organization_id FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715040314_AddNotifications') THEN
    CREATE TABLE notifications (
        id uuid NOT NULL,
        source_event_id uuid NOT NULL,
        organization_id uuid NOT NULL,
        recipient_user_id text NOT NULL,
        type character varying(64) NOT NULL,
        payload_json jsonb NOT NULL,
        action_path character varying(500) NOT NULL,
        created_at timestamp(3) with time zone NOT NULL,
        read_at timestamp(3) with time zone,
        CONSTRAINT pk_notifications PRIMARY KEY (id),
        CONSTRAINT fk_notifications_asp_net_users_recipient_user_id FOREIGN KEY (recipient_user_id) REFERENCES asp_net_users (id) ON DELETE CASCADE,
        CONSTRAINT fk_notifications_organizations_organization_id FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715040314_AddNotifications') THEN
    CREATE TABLE provider_webhook_receipts (
        provider_event_id character varying(256) NOT NULL,
        received_at timestamp(3) with time zone NOT NULL,
        CONSTRAINT "PK_provider_webhook_receipts" PRIMARY KEY (provider_event_id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715040314_AddNotifications') THEN
    CREATE TABLE notification_deliveries (
        id uuid NOT NULL,
        notification_id uuid NOT NULL,
        channel character varying(32) NOT NULL,
        status character varying(32) NOT NULL,
        attempts integer NOT NULL,
        next_attempt_at timestamp(3) with time zone NOT NULL,
        locked_until timestamp(3) with time zone,
        provider_message_id character varying(256),
        provider_event_at timestamp(3) with time zone,
        sent_at timestamp(3) with time zone,
        last_error character varying(2000),
        CONSTRAINT pk_notification_deliveries PRIMARY KEY (id),
        CONSTRAINT fk_notification_deliveries_notifications_notification_id FOREIGN KEY (notification_id) REFERENCES notifications (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715040314_AddNotifications') THEN
    CREATE UNIQUE INDEX "IX_notification_deliveries_notification_id_channel" ON notification_deliveries (notification_id, channel);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715040314_AddNotifications') THEN
    CREATE INDEX "IX_notification_deliveries_provider_message_id" ON notification_deliveries (provider_message_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715040314_AddNotifications') THEN
    CREATE INDEX "IX_notification_deliveries_status_next_attempt_at_locked_until" ON notification_deliveries (status, next_attempt_at, locked_until);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715040314_AddNotifications') THEN
    CREATE UNIQUE INDEX "IX_notification_outbox_messages_deduplication_key" ON notification_outbox_messages (deduplication_key);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715040314_AddNotifications') THEN
    CREATE INDEX "IX_notification_outbox_messages_processed_at_next_attempt_at_l~" ON notification_outbox_messages (processed_at, next_attempt_at, locked_until);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715040314_AddNotifications') THEN
    CREATE INDEX ix_notification_preferences_organization_id ON notification_preferences (organization_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715040314_AddNotifications') THEN
    CREATE INDEX "IX_notifications_organization_id_recipient_user_id_read_at_cre~" ON notifications (organization_id, recipient_user_id, read_at, created_at);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715040314_AddNotifications') THEN
    CREATE INDEX ix_notifications_recipient_user_id ON notifications (recipient_user_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715040314_AddNotifications') THEN
    CREATE UNIQUE INDEX "IX_notifications_source_event_id_recipient_user_id" ON notifications (source_event_id, recipient_user_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715040314_AddNotifications') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260715040314_AddNotifications', '10.0.0');
    END IF;
END $EF$;
COMMIT;

