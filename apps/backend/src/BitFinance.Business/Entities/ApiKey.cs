using BitFinance.Business.Enums;

namespace BitFinance.Business.Entities;

/// <summary>
/// A personal key that lets an agent call the API as its owner, limited to the organizations listed in
/// <see cref="Organizations"/>. Only a hash of the key is stored.
/// </summary>
public class ApiKey
{
    public Guid Id { get; set; }

    public string UserId { get; set; } = string.Empty;

    public User User { get; set; } = null!;

    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// The first characters of the key, kept so people can tell their keys apart.
    /// </summary>
    public string Prefix { get; set; } = string.Empty;

    public string KeyHash { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? ExpiresAt { get; set; }

    public DateTime? LastUsedAt { get; set; }

    public DateTime? RevokedAt { get; set; }

    public ICollection<ApiKeyOrganization> Organizations { get; set; } = new List<ApiKeyOrganization>();
}

public class ApiKeyOrganization
{
    public Guid ApiKeyId { get; set; }

    public Guid OrganizationId { get; set; }

    public Organization Organization { get; set; } = null!;

    public ApiKeyAccess Access { get; set; }
}
