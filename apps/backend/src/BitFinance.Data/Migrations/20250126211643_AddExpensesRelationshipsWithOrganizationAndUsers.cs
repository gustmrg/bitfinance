using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BitFinance.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExpensesRelationshipsWithOrganizationAndUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "expires_at",
                table: "organization_invites",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "created_by_user_id",
                table: "expenses",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "ix_expenses_created_by_user_id",
                table: "expenses",
                column: "created_by_user_id");

            migrationBuilder.AddForeignKey(
                name: "fk_expenses_asp_net_users_created_by_user_id",
                table: "expenses",
                column: "created_by_user_id",
                principalTable: "asp_net_users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_expenses_asp_net_users_created_by_user_id",
                table: "expenses");

            migrationBuilder.DropIndex(
                name: "ix_expenses_created_by_user_id",
                table: "expenses");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "expenses");

            migrationBuilder.AlterColumn<DateTime>(
                name: "expires_at",
                table: "organization_invites",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");
        }
    }
}
