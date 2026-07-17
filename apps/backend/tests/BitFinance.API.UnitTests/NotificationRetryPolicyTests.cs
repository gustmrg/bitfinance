using BitFinance.API.Services;
using Xunit;

namespace BitFinance.API.UnitTests;

public class NotificationRetryPolicyTests
{
    [Theory]
    [InlineData(1, 1)]
    [InlineData(2, 5)]
    [InlineData(3, 30)]
    [InlineData(4, 120)]
    public void GetNextAttemptAt_ReturnsConfiguredBackoff(int attempt, int minutes)
    {
        var now = new DateTime(2026, 7, 15, 12, 0, 0, DateTimeKind.Utc);

        var result = NotificationRetryPolicy.GetNextAttemptAt(attempt, now);

        Assert.Equal(now.AddMinutes(minutes), result);
    }

    [Fact]
    public void GetNextAttemptAt_StopsAfterFifthAttempt()
    {
        Assert.Null(NotificationRetryPolicy.GetNextAttemptAt(5, DateTime.UtcNow));
    }
}
