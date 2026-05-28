namespace BitFinance.API.Settings;

public static class StoragePathBuilder
{
    public static string ForBill(Guid organizationId, Guid billId)
        => $"organizations/{organizationId}/bills/{billId}";

    public static string ForExpense(Guid organizationId, Guid expenseId)
        => $"organizations/{organizationId}/expenses/{expenseId}";

    public static string ForUserAvatar(string userId)
        => $"users/{userId}/avatar";
}
