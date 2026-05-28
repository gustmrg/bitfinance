using System.Security.Claims;
using BitFinance.API.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace BitFinance.API.Filters;

public class OrganizationAuthorizationFilter(IUsersService usersService) : IAsyncAuthorizationFilter
{
    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var requestOrganizationId = context.RouteData.Values["organizationId"]?.ToString();
        
        if (string.IsNullOrEmpty(requestOrganizationId) || !Guid.TryParse(requestOrganizationId, out var organizationId))
        {
            context.Result = new BadRequestObjectResult("Organization Id is invalid.");
            return;
        }
        
        var userId = context.HttpContext.User.Claims.FirstOrDefault(a => a.Type == ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            context.Result = new UnauthorizedObjectResult("User is not authenticated.");
            return;
        }
        
        // Check if the user belongs to the organization
        if (!await usersService.IsUserInOrganizationAsync(userId, organizationId))
        {
            context.Result = new ForbidResult("You do not have access to this organization.");
        }
    }
}