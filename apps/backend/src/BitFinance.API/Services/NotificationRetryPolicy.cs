namespace BitFinance.API.Services;

public static class NotificationRetryPolicy
{
    private static readonly TimeSpan[] Delays =
    [
        TimeSpan.FromMinutes(1),
        TimeSpan.FromMinutes(5),
        TimeSpan.FromMinutes(30),
        TimeSpan.FromHours(2),
    ];

    public static DateTime? GetNextAttemptAt(int attempt, DateTime now) =>
        attempt >= 1 && attempt <= Delays.Length ? now.Add(Delays[attempt - 1]) : null;
}
