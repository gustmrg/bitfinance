using BitFinance.Business.Entities;
using BitFinance.Business.Enums;

namespace BitFinance.API.Services;

public static class NotificationRules
{
    public static NotificationType? GetBillReminderType(DateOnly dueDate, DateOnly today, BillStatus status)
    {
        if (status is BillStatus.Paid or BillStatus.Cancelled)
            return null;

        if (dueDate == today.AddDays(3))
            return NotificationType.BillDueSoon;

        if (dueDate == today)
            return NotificationType.BillDueToday;

        if (dueDate < today && status == BillStatus.Overdue)
            return NotificationType.BillOverdue;

        return null;
    }

    public static IReadOnlyList<string> GetMembershipRecipientIds(IEnumerable<OrganizationMember> members) =>
        members
            .Where(member => member.Role is OrgRole.Owner or OrgRole.Admin)
            .Select(member => member.UserId)
            .Distinct(StringComparer.Ordinal)
            .ToList();

    public static bool CanSendBillEmail(
        PlanTier effectivePlanTier,
        bool preferenceEnabled,
        bool deliveryConfigured) =>
        deliveryConfigured
        && preferenceEnabled
        && PlanEntitlement.For(effectivePlanTier).HasEmailNotifications;
}
