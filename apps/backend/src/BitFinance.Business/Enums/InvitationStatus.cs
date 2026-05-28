namespace BitFinance.Business.Enums;

/// <summary>
/// Represents the lifecycle status of an organization invitation.
/// </summary>
public enum InvitationStatus
{
    /// <summary>
    /// The invitation has been sent and is awaiting a response.
    /// </summary>
    Pending = 0,

    /// <summary>
    /// The invitation was accepted and the user has joined the organization.
    /// </summary>
    Accepted = 1,

    /// <summary>
    /// The invitation expired before being accepted.
    /// </summary>
    Expired = 2,

    /// <summary>
    /// The invitation was revoked by an organization admin or owner.
    /// </summary>
    Revoked = 3
}
