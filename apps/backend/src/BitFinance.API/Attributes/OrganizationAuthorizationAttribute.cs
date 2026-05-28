using BitFinance.API.Filters;
using BitFinance.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc.Filters;

namespace BitFinance.API.Attributes;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class OrganizationAuthorizationAttribute : Attribute, IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        // Resolve the filter's dependencies from DI
        var userService = context.HttpContext.RequestServices.GetRequiredService<IUsersService>();

        // Create and execute the filter
        var filter = new OrganizationAuthorizationFilter(userService);
        await filter.OnAuthorizationAsync(context);
    }
}