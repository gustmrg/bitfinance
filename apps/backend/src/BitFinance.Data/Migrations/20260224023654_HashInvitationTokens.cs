using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BitFinance.Data.Migrations
{
    /// <inheritdoc />
    public partial class HashInvitationTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "token",
                table: "invitations",
                newName: "token_hash");

            migrationBuilder.RenameIndex(
                name: "IX_invitations_token",
                table: "invitations",
                newName: "IX_invitations_token_hash");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "token_hash",
                table: "invitations",
                newName: "token");

            migrationBuilder.RenameIndex(
                name: "IX_invitations_token_hash",
                table: "invitations",
                newName: "IX_invitations_token");
        }
    }
}
