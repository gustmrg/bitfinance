using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BitFinance.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanceNotesAndExpensePaymentMethod : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "notes",
                table: "expenses",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "payment_method",
                table: "expenses",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "notes",
                table: "bills",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "notes",
                table: "bill_series",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "notes",
                table: "expenses");

            migrationBuilder.DropColumn(
                name: "payment_method",
                table: "expenses");

            migrationBuilder.DropColumn(
                name: "notes",
                table: "bills");

            migrationBuilder.DropColumn(
                name: "notes",
                table: "bill_series");
        }
    }
}
