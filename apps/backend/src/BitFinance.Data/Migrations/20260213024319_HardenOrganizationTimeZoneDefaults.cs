using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BitFinance.Data.Migrations
{
    /// <inheritdoc />
    public partial class HardenOrganizationTimeZoneDefaults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE organizations
                SET timezone_id = 'America/Sao_Paulo'
                WHERE timezone_id IS NULL OR btrim(timezone_id) = '';

                UPDATE organizations
                SET timezone_id = REPLACE(timezone_id, ' ', '_')
                WHERE timezone_id LIKE '% %';
                """);

            migrationBuilder.AlterColumn<string>(
                name: "timezone_id",
                table: "organizations",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "America/Sao_Paulo",
                oldClrType: typeof(string),
                oldType: "character varying(150)",
                oldMaxLength: 150);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "timezone_id",
                table: "organizations",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(150)",
                oldMaxLength: 150,
                oldDefaultValue: "America/Sao_Paulo");
        }
    }
}
