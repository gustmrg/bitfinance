namespace BitFinance.API.Models.Request;

public record CreateExpensesBatchRequest(
    IReadOnlyList<CreateExpenseBatchItemRequest> Items);
