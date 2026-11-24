using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BitFinance.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddApiKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "api_keys",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    prefix = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    key_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    last_used_at = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true),
                    revoked_at = table.Column<DateTime>(type: "timestamp(3) with time zone", precision: 3, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_api_keys", x => x.id);
                    table.ForeignKey(
                        name: "fk_api_keys_asp_net_users_user_id",
                        column: x => x.user_id,
                        principalTable: "asp_net_users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "api_key_organizations",
                columns: table => new
                {
                    api_key_id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    access = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_api_key_organizations", x => new { x.api_key_id, x.organization_id });
                    table.ForeignKey(
                        name: "fk_api_key_organization_api_keys_api_key_id",
                        column: x => x.api_key_id,
                        principalTable: "api_keys",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_api_key_organization_organizations_organization_id",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_api_key_organization_organization_id",
                table: "api_key_organizations",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "IX_api_keys_key_hash",
                table: "api_keys",
                column: "key_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_api_keys_user_id",
                table: "api_keys",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "api_key_organizations");

            migrationBuilder.DropTable(
                name: "api_keys");
        }
    }
}
