namespace BitFinance.API.Models.Response;

public record GetMeResponse(string Id, string Username, string Email, List<OrganizationResponseModel> Organizations);