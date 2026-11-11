using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;

namespace BitFinance.API.Extensions;

/// <summary>
/// Request limits for the anonymous identity endpoints, counted per client IP address.
/// </summary>
public sealed class AuthRateLimitSettings
{
    public const string SectionName = "RateLimiting:Auth";

    /// <summary>
    /// Login and registration attempts allowed per client in one window.
    /// </summary>
    public int CredentialPermitLimit { get; set; } = 10;

    /// <summary>
    /// Token refreshes allowed per client in one window.
    /// </summary>
    public int RefreshPermitLimit { get; set; } = 60;

    public int WindowSeconds { get; set; } = 60;
}

public static class RateLimitPolicies
{
    /// <summary>
    /// Endpoints that check or create credentials: login and registration.
    /// </summary>
    public const string Credentials = "auth-credentials";

    /// <summary>
    /// The token refresh endpoint, which every signed-in client calls routinely.
    /// </summary>
    public const string Refresh = "auth-refresh";
}

public static class RateLimitingExtensions
{
    private const string UnknownClient = "unknown";

    public static IServiceCollection AddAuthRateLimiting(this IServiceCollection services, IConfiguration configuration)
    {
        var settings = configuration.GetSection(AuthRateLimitSettings.SectionName).Get<AuthRateLimitSettings>()
                       ?? new AuthRateLimitSettings();

        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, cancellationToken) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter =
                        Math.Ceiling(retryAfter.TotalSeconds).ToString(CultureInfo.InvariantCulture);
                }

                await context.HttpContext.Response.WriteAsJsonAsync(
                    new { message = "Too many requests. Please try again later." }, cancellationToken);
            };

            options.AddPolicy(RateLimitPolicies.Credentials,
                httpContext => CreatePartition(httpContext, settings.CredentialPermitLimit, settings.WindowSeconds));
            options.AddPolicy(RateLimitPolicies.Refresh,
                httpContext => CreatePartition(httpContext, settings.RefreshPermitLimit, settings.WindowSeconds));
        });

        return services;
    }

    /// <summary>
    /// Builds the fixed-window partition for a request, keyed by the client IP address.
    /// </summary>
    public static RateLimitPartition<string> CreatePartition(HttpContext httpContext, int permitLimit, int windowSeconds)
    {
        var clientKey = httpContext.Connection.RemoteIpAddress?.ToString() ?? UnknownClient;

        return RateLimitPartition.GetFixedWindowLimiter(clientKey, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = permitLimit,
            Window = TimeSpan.FromSeconds(windowSeconds),
            QueueLimit = 0
        });
    }
}
