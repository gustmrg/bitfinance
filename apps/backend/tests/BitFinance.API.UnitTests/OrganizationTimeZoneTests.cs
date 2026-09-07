using BitFinance.Business.Entities;
using FluentAssertions;
using Xunit;

namespace BitFinance.API.UnitTests;

public class OrganizationTimeZoneTests
{
    private readonly Organization _organization = new()
    {
        TimeZoneId = "America/Fortaleza"
    };

    [Fact]
    public void GetLocalDate_UtcTimestampAfterLocalEndOfDay_ReturnsPreviousUtcDate()
    {
        var utcTimestamp = new DateTime(2026, 8, 5, 2, 59, 59, DateTimeKind.Utc);

        var result = _organization.GetLocalDate(utcTimestamp);

        result.Should().Be(new DateOnly(2026, 8, 4));
    }

    [Fact]
    public void GetLocalDate_DateOnlyInput_PreservesCalendarDate()
    {
        var dateOnlyInput = new DateTime(2026, 8, 4, 0, 0, 0, DateTimeKind.Unspecified);

        var result = _organization.GetLocalDate(dateOnlyInput);

        result.Should().Be(new DateOnly(2026, 8, 4));
    }
}
