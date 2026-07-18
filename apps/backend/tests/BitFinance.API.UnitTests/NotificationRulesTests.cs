using BitFinance.API.Services;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using Xunit;

namespace BitFinance.API.UnitTests;

public class NotificationRulesTests
{
    [Theory]
    [InlineData(3, BillStatus.Upcoming, NotificationType.BillDueSoon)]
    [InlineData(0, BillStatus.Due, NotificationType.BillDueToday)]
    [InlineData(-1, BillStatus.Overdue, NotificationType.BillOverdue)]
    public void GetBillReminderType_ReturnsExpectedStage(
        int daysFromToday,
        BillStatus status,
        NotificationType expected)
    {
        var today = new DateOnly(2026, 7, 15);

        var result = NotificationRules.GetBillReminderType(today.AddDays(daysFromToday), today, status);

        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData(BillStatus.Paid)]
    [InlineData(BillStatus.Cancelled)]
    public void GetBillReminderType_DoesNotNotifyNonPayableBills(BillStatus status)
    {
        var today = new DateOnly(2026, 7, 15);

        var result = NotificationRules.GetBillReminderType(today, today, status);

        Assert.Null(result);
    }

    [Fact]
    public void GetMembershipRecipients_ReturnsOwnersAndAdminsOnly()
    {
        var members = new[]
        {
            new OrganizationMember { UserId = "owner", Role = OrgRole.Owner },
            new OrganizationMember { UserId = "admin", Role = OrgRole.Admin },
            new OrganizationMember { UserId = "member", Role = OrgRole.Member },
        };

        var recipients = NotificationRules.GetMembershipRecipientIds(members);

        Assert.Equal(["admin", "owner"], recipients.OrderBy(value => value));
    }

    [Theory]
    [InlineData(PlanTier.Free, true, true, false)]
    [InlineData(PlanTier.Basic, false, true, false)]
    [InlineData(PlanTier.Basic, true, false, false)]
    [InlineData(PlanTier.Basic, true, true, true)]
    [InlineData(PlanTier.Premium, true, true, true)]
    public void CanSendBillEmail_EnforcesEntitlementPreferenceAndConfiguration(
        PlanTier tier,
        bool preferenceEnabled,
        bool deliveryConfigured,
        bool expected)
    {
        var result = NotificationRules.CanSendBillEmail(tier, preferenceEnabled, deliveryConfigured);

        Assert.Equal(expected, result);
    }
}
