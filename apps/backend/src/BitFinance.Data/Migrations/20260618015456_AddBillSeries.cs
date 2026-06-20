using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BitFinance.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBillSeries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "bill_series_id",
                table: "bills",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "occurrence_number",
                table: "bills",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "total_occurrences",
                table: "bills",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "bill_series",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    category = table.Column<string>(type: "text", nullable: false),
                    frequency = table.Column<string>(type: "text", nullable: false),
                    amount_due = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    total_occurrences = table.Column<int>(type: "integer", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    next_occurrence_number = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    stopped_at = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_bill_series", x => x.id);
                    table.CheckConstraint("ck_bill_series_amount_non_negative", "amount_due >= 0");
                    table.CheckConstraint("ck_bill_series_next_occurrence_positive", "next_occurrence_number > 0");
                    table.ForeignKey(
                        name: "fk_bill_series_organizations_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_bills_bill_series_id",
                table: "bills",
                column: "bill_series_id");

            migrationBuilder.CreateIndex(
                name: "ix_bill_series_organization_id",
                table: "bill_series",
                column: "organization_id");

            migrationBuilder.AddForeignKey(
                name: "fk_bills_bill_series_bill_series_id",
                table: "bills",
                column: "bill_series_id",
                principalTable: "bill_series",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_bills_bill_series_bill_series_id",
                table: "bills");

            migrationBuilder.DropTable(
                name: "bill_series");

            migrationBuilder.DropIndex(
                name: "ix_bills_bill_series_id",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "bill_series_id",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "occurrence_number",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "total_occurrences",
                table: "bills");
        }
    }
}
