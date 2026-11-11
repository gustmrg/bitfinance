using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BitFinance.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddListingIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_expenses_organization_id",
                table: "expenses");

            migrationBuilder.DropIndex(
                name: "ix_bills_organization_id",
                table: "bills");

            migrationBuilder.CreateIndex(
                name: "ix_expenses_organization_id_occurred_at",
                table: "expenses",
                columns: new[] { "organization_id", "occurred_at" });

            migrationBuilder.CreateIndex(
                name: "ix_bills_organization_id_due_date",
                table: "bills",
                columns: new[] { "organization_id", "due_date" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_expenses_organization_id_occurred_at",
                table: "expenses");

            migrationBuilder.DropIndex(
                name: "ix_bills_organization_id_due_date",
                table: "bills");

            migrationBuilder.CreateIndex(
                name: "ix_expenses_organization_id",
                table: "expenses",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "ix_bills_organization_id",
                table: "bills",
                column: "organization_id");
        }
    }
}
