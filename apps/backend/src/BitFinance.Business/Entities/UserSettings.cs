namespace BitFinance.Business.Entities;

/// <summary>
/// Stores user-specific settings and preferences such as language and time zone.
/// </summary>
public class UserSettings
{
    /// <summary>
    /// The ID of the user these settings belong to.
    /// </summary>
    public string UserId { get; set; }

    /// <summary>
    /// The user's preferred language/locale (e.g., "en-US", "pt-BR").
    /// </summary>
    public string? PreferredLanguage { get; set; } = "en-US";

    /// <summary>
    /// The user's preferred IANA time zone identifier (e.g., "America/Sao_Paulo").
    /// </summary>
    public string? TimeZoneId { get; set; } = "America/Sao_Paulo";

    /// <summary>
    /// The date and time when these settings were created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// The date and time when these settings were last updated.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property to the user.
    /// </summary>
    public User User { get; set; }
}
