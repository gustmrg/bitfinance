using BitFinance.Business.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace BitFinance.API.Authentication;

/// <summary>
/// Marks the endpoints an API key may call. Every other endpoint rejects API keys, so new endpoints stay closed
/// to agents until someone opts them in.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class AllowApiKeyAttribute : Attribute;

/// <summary>
/// Applies an API key's limits on top of the owner's own permissions: only endpoints marked with
/// <see cref="AllowApiKeyAttribute"/>, only the key's organizations, and only reads where the key is read-only.
/// </summary>
public class ApiKeyScopeFilter : IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        if (!ApiKeyClaims.IsApiKey(user))
            return;

        if (!context.ActionDescriptor.EndpointMetadata.OfType<AllowApiKeyAttribute>().Any())
        {
            context.Result = Forbidden("API keys cannot use this endpoint.");
            return;
        }

        if (!Guid.TryParse(context.RouteData.Values["organizationId"]?.ToString(), out var organizationId))
            return;

        var access = ApiKeyClaims.GetAccess(user, organizationId);
        if (access is null)
        {
            context.Result = Forbidden("This API key has no access to this organization.");
            return;
        }

        var method = context.HttpContext.Request.Method;
        if (access == ApiKeyAccess.Read && !HttpMethods.IsGet(method) && !HttpMethods.IsHead(method))
            context.Result = Forbidden("This API key has read-only access to this organization.");
    }

    private static ObjectResult Forbidden(string message) =>
        new(new { error = message }) { StatusCode = StatusCodes.Status403Forbidden };
}
