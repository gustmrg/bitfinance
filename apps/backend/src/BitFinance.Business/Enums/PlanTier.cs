namespace BitFinance.Business.Enums;

/// <summary>
/// Defines the subscription plan tiers available for organizations.
/// Each tier maps to a set of entitlements defined in <see cref="Entities.PlanEntitlement"/>.
/// </summary>
public enum PlanTier
{
    /// <summary>
    /// Free tier with basic limits and no premium features.
    /// </summary>
    Free = 1,

    /// <summary>
    /// Basic paid tier with increased limits, file attachments, and email notifications.
    /// </summary>
    Basic = 2,

    /// <summary>
    /// Premium tier with the highest limits, API access, and custom reports.
    /// </summary>
    Premium = 3
}
