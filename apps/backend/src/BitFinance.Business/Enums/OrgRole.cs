namespace BitFinance.Business.Enums;

/// <summary>
/// Defines the roles a user can have within an organization.
/// </summary>
public enum OrgRole
{
    /// <summary>
    /// Full control over the organization, including billing and deletion.
    /// </summary>
    Owner = 1,

    /// <summary>
    /// Can manage members and settings, but cannot delete the organization or manage billing.
    /// </summary>
    Admin = 2,

    /// <summary>
    /// Can use features within the organization's plan.
    /// </summary>
    Member = 3
}
