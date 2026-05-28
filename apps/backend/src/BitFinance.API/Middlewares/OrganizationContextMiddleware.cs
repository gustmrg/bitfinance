using BitFinance.Data.Security.Interfaces;

namespace BitFinance.API.Middlewares;

public class OrganizationContextMiddleware
{
    private readonly RequestDelegate _next;

    public OrganizationContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }
    
    public async Task InvokeAsync(HttpContext context, IOrganizationContext organizationContext)
    {
        var organizationId = context.Request.Headers["X-Organization-Id"].FirstOrDefault();
        organizationContext.SetOrganization(Guid.ParseExact(organizationId,"N"));
        await _next(context);
    }
}