using BitFinance.Business.Enums;

namespace BitFinance.Business.Entities;

/// <summary>
/// Represents an invitation for a user to join an organization with a specific role.
/// Invitations are token-based and expire after a set period.
/// </summary>
public class Invitation
{
    public Guid Id { get; set; }

    /// <summary>
    /// The organization the user is being invited to.
    /// </summary>
    public Guid OrganizationId { get; set; }

    /// <summary>
    /// The email address of the person being invited.
    /// </summary>
    public string Email { get; set; }

    /// <summary>
    /// The role the invited user will receive upon accepting.
    /// </summary>
    public OrgRole Role { get; set; }

    /// <summary>
    /// The ID of the user who created this invitation.
    /// </summary>
    public string InvitedByUserId { get; set; }

    /// <summary>
    /// The current status of the invitation (Pending, Accepted, Expired, or Revoked).
    /// </summary>
    public InvitationStatus Status { get; set; }

    /// <summary>
    /// The SHA-256 hash of the invitation token. The raw token is never stored.
    /// </summary>
    public string TokenHash { get; set; }

    /// <summary>
    /// The date and time when this invitation expires.
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// The date and time when this invitation was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Navigation property to the organization.
    /// </summary>
    public Organization Organization { get; set; }

    /// <summary>
    /// Navigation property to the user who created the invitation.
    /// </summary>
    public User InvitedBy { get; set; }
}
