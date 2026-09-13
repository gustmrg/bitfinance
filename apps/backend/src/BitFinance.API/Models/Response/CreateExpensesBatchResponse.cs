namespace BitFinance.API.Models.Response;

public class CreateExpensesBatchResponse
{
    public IReadOnlyList<CreateExpenseResponse> Data { get; set; } = [];
}
