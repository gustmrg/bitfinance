namespace BitFinance.API.Models.Request;

public record CreateExpensesBatchRequest(
    string CreatedBy,
    IReadOnlyList<CreateExpenseBatchItemRequest> Items);
