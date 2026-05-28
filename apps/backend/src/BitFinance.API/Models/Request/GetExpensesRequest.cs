namespace BitFinance.API.Models.Request;

public record GetExpensesRequest(Guid OrganizationId, int Page = 1, int PageSize = 20);