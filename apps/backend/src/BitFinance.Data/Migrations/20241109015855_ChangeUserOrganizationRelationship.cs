using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BitFinance.Data.Migrations
{
    /// <inheritdoc />
    public partial class ChangeUserOrganizationRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_asp_net_users_organization_organization_id",
                table: "asp_net_users");

            migrationBuilder.DropForeignKey(
                name: "fk_bills_organization_organization_id",
                table: "bills");

            migrationBuilder.DropPrimaryKey(
                name: "pk_organization",
                table: "organizations");

            migrationBuilder.DropIndex(
                name: "ix_asp_net_users_organization_id",
                table: "asp_net_users");

            migrationBuilder.DropColumn(
                name: "organization_id",
                table: "asp_net_users");

            migrationBuilder.AddPrimaryKey(
                name: "pk_organizations",
                table: "organizations",
                column: "id");

            migrationBuilder.CreateTable(
                name: "organization_user",
                columns: table => new
                {
                    members_id = table.Column<string>(type: "text", nullable: false),
                    organizations_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_organization_user", x => new { x.members_id, x.organizations_id });
                    table.ForeignKey(
                        name: "fk_organization_user_asp_net_users_members_id",
                        column: x => x.members_id,
                        principalTable: "asp_net_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_organization_user_organizations_organizations_id",
                        column: x => x.organizations_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_organization_user_organizations_id",
                table: "organization_user",
                column: "organizations_id");

            migrationBuilder.AddForeignKey(
                name: "fk_bills_organizations_organization_id",
                table: "bills",
                column: "organization_id",
                principalTable: "organizations",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_bills_organizations_organization_id",
                table: "bills");

            migrationBuilder.DropTable(
                name: "organization_user");

            migrationBuilder.DropPrimaryKey(
                name: "pk_organizations",
                table: "organizations");

            migrationBuilder.AddColumn<Guid>(
                name: "organization_id",
                table: "asp_net_users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "pk_organization",
                table: "organizations",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "ix_asp_net_users_organization_id",
                table: "asp_net_users",
                column: "organization_id");

            migrationBuilder.AddForeignKey(
                name: "fk_asp_net_users_organization_organization_id",
                table: "asp_net_users",
                column: "organization_id",
                principalTable: "organizations",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_bills_organization_organization_id",
                table: "bills",
                column: "organization_id",
                principalTable: "organizations",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
