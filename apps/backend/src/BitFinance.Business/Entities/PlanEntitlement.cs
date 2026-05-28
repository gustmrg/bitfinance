using BitFinance.Business.Enums;

namespace BitFinance.Business.Entities;

/// <summary>
/// Defines the resource limits and feature flags for a subscription plan tier.
/// This is a static, in-code mapping — no database table is involved.
/// Use <see cref="For"/> to retrieve the entitlements for a given <see cref="PlanTier"/>.
/// </summary>
public record PlanEntitlement
{
    /// <summary>
    /// Maximum number of members allowed in the organization.
    /// </summary>
    public int MaxMembers { get; init; }

    /// <summary>
    /// Maximum number of bills the organization can create per month.
    /// </summary>
    public int MaxBillsPerMonth { get; init; }

    /// <summary>
    /// Maximum number of expenses the organization can create per month.
    /// </summary>
    public int MaxExpensesPerMonth { get; init; }

    /// <summary>
    /// Maximum file storage in bytes for bill document attachments.
    /// </summary>
    public long MaxStorageBytes { get; init; }

    /// <summary>
    /// Whether the organization can attach files to bills.
    /// </summary>
    public bool HasFileAttachments { get; init; }

    /// <summary>
    /// Whether the organization has access to the API for integrations.
    /// </summary>
    public bool HasApiAccess { get; init; }

    /// <summary>
    /// Whether the organization can generate custom reports.
    /// </summary>
    public bool HasCustomReports { get; init; }

    /// <summary>
    /// Whether the organization receives email notifications.
    /// </summary>
    public bool HasEmailNotifications { get; init; }

    private static readonly Dictionary<PlanTier, PlanEntitlement> Entitlements = new()
    {
        [PlanTier.Free] = new PlanEntitlement
        {
            MaxMembers = 2,
            MaxBillsPerMonth = 20,
            MaxExpensesPerMonth = 20,
            MaxStorageBytes = 50L * 1024 * 1024, // 50 MB
            HasFileAttachments = false,
            HasApiAccess = false,
            HasCustomReports = false,
            HasEmailNotifications = false,
        },
        [PlanTier.Basic] = new PlanEntitlement
        {
            MaxMembers = 10,
            MaxBillsPerMonth = 100,
            MaxExpensesPerMonth = 100,
            MaxStorageBytes = 1L * 1024 * 1024 * 1024, // 1 GB
            HasFileAttachments = true,
            HasApiAccess = false,
            HasCustomReports = false,
            HasEmailNotifications = true,
        },
        [PlanTier.Premium] = new PlanEntitlement
        {
            MaxMembers = int.MaxValue,
            MaxBillsPerMonth = int.MaxValue,
            MaxExpensesPerMonth = int.MaxValue,
            MaxStorageBytes = 10L * 1024 * 1024 * 1024, // 10 GB
            HasFileAttachments = true,
            HasApiAccess = true,
            HasCustomReports = true,
            HasEmailNotifications = true,
        },
    };

    /// <summary>
    /// Returns the entitlements for the specified plan tier.
    /// </summary>
    /// <param name="tier">The plan tier to look up.</param>
    /// <returns>The <see cref="PlanEntitlement"/> for the given tier.</returns>
    public static PlanEntitlement For(PlanTier tier) =>
        Entitlements.GetValueOrDefault(tier, Entitlements[PlanTier.Free]);
}
