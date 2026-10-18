using System.Security.Claims;

namespace BitFinance.API.Models;

public record GoogleIdentity(string Subject, string Email, bool EmailVerified, string FirstName, string LastName)
{
    public static GoogleIdentity? FromPrincipal(ClaimsPrincipal principal)
    {
        var subject = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        var email = principal.FindFirstValue(ClaimTypes.Email);

        if (string.IsNullOrEmpty(subject) || string.IsNullOrEmpty(email))
            return null;

        return new GoogleIdentity(
            subject,
            email,
            string.Equals(principal.FindFirstValue("email_verified"), "true", StringComparison.OrdinalIgnoreCase),
            principal.FindFirstValue(ClaimTypes.GivenName) ?? string.Empty,
            principal.FindFirstValue(ClaimTypes.Surname) ?? string.Empty);
    }
}
