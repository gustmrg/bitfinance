using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BitFinance.Data.Migrations
{
    /// <inheritdoc />
    public partial class GeneralizeAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Rename table
            migrationBuilder.RenameTable(
                name: "bill_documents",
                newName: "attachments");

            // Rename primary key
            migrationBuilder.RenameIndex(
                name: "pk_bill_documents",
                table: "attachments",
                newName: "pk_attachments");

            // Rename existing index
            migrationBuilder.RenameIndex(
                name: "ix_bill_documents_bill_id",
                table: "attachments",
                newName: "ix_attachments_bill_id");

            // Rename document_type column to file_category
            migrationBuilder.RenameColumn(
                name: "document_type",
                table: "attachments",
                newName: "file_category");

            // Make bill_id nullable (was required)
            migrationBuilder.AlterColumn<Guid>(
                name: "bill_id",
                table: "attachments",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            // Change uploaded_by_user_id from Guid? to string (text)
            migrationBuilder.AlterColumn<string>(
                name: "uploaded_by_user_id",
                table: "attachments",
                type: "text",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            // Add new columns
            migrationBuilder.AddColumn<Guid>(
                name: "expense_id",
                table: "attachments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "user_id",
                table: "attachments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "organization_id",
                table: "attachments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "attachment_type",
                table: "attachments",
                type: "integer",
                nullable: false,
                defaultValue: 1); // BillDocument

            // Backfill organization_id from bills table for existing records
            migrationBuilder.Sql(
                "UPDATE attachments SET organization_id = b.organization_id FROM bills b WHERE attachments.bill_id = b.id");

            // Add check constraint: exactly one owner FK must be set
            migrationBuilder.AddCheckConstraint(
                name: "ck_attachments_single_owner",
                table: "attachments",
                sql: @"(CASE WHEN bill_id IS NOT NULL THEN 1 ELSE 0 END +
                  CASE WHEN expense_id IS NOT NULL THEN 1 ELSE 0 END +
                  CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) = 1");

            // Add foreign keys
            migrationBuilder.AddForeignKey(
                name: "fk_attachments_expenses_expense_id",
                table: "attachments",
                column: "expense_id",
                principalTable: "expenses",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_attachments_asp_net_users_user_id",
                table: "attachments",
                column: "user_id",
                principalTable: "asp_net_users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_attachments_organizations_organization_id",
                table: "attachments",
                column: "organization_id",
                principalTable: "organizations",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            // Rename existing bill FK constraint
            migrationBuilder.Sql(
                @"ALTER TABLE attachments DROP CONSTRAINT IF EXISTS fk_bill_documents_bills_bill_id;
                  ALTER TABLE attachments ADD CONSTRAINT fk_attachments_bills_bill_id
                  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE;");

            // Add indexes
            migrationBuilder.CreateIndex(
                name: "ix_attachments_expense_id",
                table: "attachments",
                column: "expense_id");

            migrationBuilder.CreateIndex(
                name: "ix_attachments_user_id",
                table: "attachments",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_attachments_organization_id",
                table: "attachments",
                column: "organization_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop new indexes
            migrationBuilder.DropIndex(name: "ix_attachments_expense_id", table: "attachments");
            migrationBuilder.DropIndex(name: "ix_attachments_user_id", table: "attachments");
            migrationBuilder.DropIndex(name: "ix_attachments_organization_id", table: "attachments");

            // Drop new foreign keys
            migrationBuilder.DropForeignKey(name: "fk_attachments_expenses_expense_id", table: "attachments");
            migrationBuilder.DropForeignKey(name: "fk_attachments_asp_net_users_user_id", table: "attachments");
            migrationBuilder.DropForeignKey(name: "fk_attachments_organizations_organization_id", table: "attachments");

            // Drop check constraint
            migrationBuilder.DropCheckConstraint(name: "ck_attachments_single_owner", table: "attachments");

            // Restore bill FK name
            migrationBuilder.Sql(
                @"ALTER TABLE attachments DROP CONSTRAINT IF EXISTS fk_attachments_bills_bill_id;
                  ALTER TABLE attachments ADD CONSTRAINT fk_bill_documents_bills_bill_id
                  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE;");

            // Drop new columns
            migrationBuilder.DropColumn(name: "expense_id", table: "attachments");
            migrationBuilder.DropColumn(name: "user_id", table: "attachments");
            migrationBuilder.DropColumn(name: "organization_id", table: "attachments");
            migrationBuilder.DropColumn(name: "attachment_type", table: "attachments");

            // Make bill_id required again
            migrationBuilder.AlterColumn<Guid>(
                name: "bill_id",
                table: "attachments",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            // Restore uploaded_by_user_id to Guid?
            migrationBuilder.AlterColumn<Guid>(
                name: "uploaded_by_user_id",
                table: "attachments",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            // Rename file_category back to document_type
            migrationBuilder.RenameColumn(
                name: "file_category",
                table: "attachments",
                newName: "document_type");

            // Rename indexes back
            migrationBuilder.RenameIndex(
                name: "ix_attachments_bill_id",
                table: "attachments",
                newName: "ix_bill_documents_bill_id");

            migrationBuilder.RenameIndex(
                name: "pk_attachments",
                table: "attachments",
                newName: "pk_bill_documents");

            // Rename table back
            migrationBuilder.RenameTable(
                name: "attachments",
                newName: "bill_documents");
        }
    }
}
