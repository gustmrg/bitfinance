using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace BitFinance.Business.Entities;

/// <summary>
/// Represents an application user, extending ASP.NET Identity with profile information.
/// </summary>
public class User : IdentityUser
{
    /// <summary>
    /// The user's first name.
    /// </summary>
    public string FirstName { get; set; } = string.Empty;

    /// <summary>
    /// The user's last name.
    /// </summary>
    public string LastName { get; set; } = string.Empty;

    /// <summary>
    /// The organizations this user is a member of, including their roles.
    /// </summary>
    public ICollection<OrganizationMember> OrganizationMemberships { get; set; } = new List<OrganizationMember>();

    /// <summary>
    /// The user's personal settings and preferences.
    /// </summary>
    public UserSettings Settings { get; set; } = new();

    public Attachment? Avatar { get; set; }

    [NotMapped]
    public string FullName => $"{FirstName} {LastName}";
}
