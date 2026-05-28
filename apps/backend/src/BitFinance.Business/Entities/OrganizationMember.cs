using BitFinance.Business.Enums;

namespace BitFinance.Business.Entities;

/// <summary>
/// Represents the membership of a user in an organization, including their role.
/// Uses a composite key of (UserId, OrganizationId).
/// </summary>
public class OrganizationMember
{
    /// <summary>
    /// The ID of the user who is a member of the organization.
    /// </summary>
    public string UserId { get; set; }

    /// <summary>
    /// The ID of the organization the user belongs to.
    /// </summary>
    public Guid OrganizationId { get; set; }

    /// <summary>
    /// The user's role within the organization (Owner, Admin, or Member).
    /// </summary>
    public OrgRole Role { get; set; }

    /// <summary>
    /// The date and time when the user joined the organization.
    /// </summary>
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Navigation property to the user.
    /// </summary>
    public User User { get; set; }

    /// <summary>
    /// Navigation property to the organization.
    /// </summary>
    public Organization Organization { get; set; }
}
