using BitFinance.Business.Enums;

namespace BitFinance.API.Models.Request;

public record CreateInvitationRequest(string Email, OrgRole? Role);
