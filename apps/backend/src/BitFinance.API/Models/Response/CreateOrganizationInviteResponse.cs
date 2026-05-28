namespace BitFinance.API.Models.Response;

public record CreateInvitationResponse(Guid Id, string Token, DateTime ExpiresAt);
