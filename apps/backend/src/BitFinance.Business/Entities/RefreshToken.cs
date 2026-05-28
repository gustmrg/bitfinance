namespace BitFinance.Business.Entities;

/// <summary>
/// Represents a refresh token used for JWT token rotation.
/// Tokens belong to a family to support reuse detection.
/// </summary>
public class RefreshToken
{
    /// <summary>
    /// Unique identifier for the refresh token.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// The SHA-256 hash of the raw token value. The raw token is never stored.
    /// </summary>
    public string TokenHash { get; set; } = string.Empty;

    /// <summary>
    /// The ID of the user this token was issued to.
    /// </summary>
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Navigation property to the token owner.
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// Groups related tokens into a family for reuse detection. All rotated tokens share the same family ID.
    /// </summary>
    public Guid TokenFamilyId { get; set; }

    /// <summary>
    /// The date and time when this token expires.
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Indicates whether this token has been explicitly revoked.
    /// </summary>
    public bool IsRevoked { get; set; }

    /// <summary>
    /// The date and time when this token was revoked, if applicable.
    /// </summary>
    public DateTime? RevokedAt { get; set; }

    /// <summary>
    /// The reason this token was revoked (e.g., "token reuse detected", "user logout").
    /// </summary>
    public string? RevokedReason { get; set; }

    /// <summary>
    /// The ID of the token that replaced this one during rotation.
    /// </summary>
    public Guid? ReplacedByTokenId { get; set; }

    /// <summary>
    /// Navigation property to the token that replaced this one.
    /// </summary>
    public RefreshToken? ReplacedByToken { get; set; }

    /// <summary>
    /// The date and time when this token was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// The IP address of the client that requested this token.
    /// </summary>
    public string? CreatedByIp { get; set; }

    /// <summary>
    /// The User-Agent header of the client that requested this token.
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// Returns <c>true</c> if the token has passed its expiration date.
    /// </summary>
    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;

    /// <summary>
    /// Returns <c>true</c> if the token is neither revoked nor expired.
    /// </summary>
    public bool IsActive => !IsRevoked && !IsExpired;
}
