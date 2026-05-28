namespace BitFinance.API.Models.Request;

public record GetBillsRequest(int Page = 1, int PageSize = 20);