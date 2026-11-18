using System.Security.Claims;
using Asp.Versioning;
using BitFinance.API.Authentication;
using BitFinance.API.Models;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BitFinance.API.Controllers;

[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/api-keys")]
public class ApiKeysController : ControllerBase
{
    private readonly IApiKeysService _apiKeysService;

    public ApiKeysController(IApiKeysService apiKeysService)
    {
        _apiKeysService = apiKeysService;
    }

    [HttpGet]
    [EndpointSummary("List API keys")]
    [EndpointDescription("Returns the signed-in user's API keys that have not been revoked, including expired ones.")]
    public async Task<ActionResult<List<ApiKeyResponse>>> GetApiKeys()
    {
        var keys = await _apiKeysService.ListAsync(GetUserId());
        return Ok(keys.Select(ToResponse).ToList());
    }

    [HttpPost]
    [EndpointSummary("Create an API key")]
    [EndpointDescription("Creates a personal API key limited to the given organizations. The secret is returned only once.")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CreateApiKeyResponse>> CreateApiKey([FromBody] CreateApiKeyRequest request)
    {
        var scopes = request.Organizations
            .Select(organization => new ApiKeyScope(organization.OrganizationId, organization.Access))
            .ToList();

        var result = await _apiKeysService.CreateAsync(GetUserId(), request.Name, scopes, request.ExpiresAt);
        if (!result.IsSuccess)
            return ToErrorResponse(result.Error);

        var (apiKey, secret) = result.Value;
        return StatusCode(StatusCodes.Status201Created, new CreateApiKeyResponse(apiKey.Id, apiKey.Name, apiKey.Prefix, secret));
    }

    [HttpDelete("{apiKeyId:guid}")]
    [EndpointSummary("Revoke an API key")]
    [EndpointDescription("Revokes one of the signed-in user's API keys. Agents using it lose access immediately.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RevokeApiKey(Guid apiKeyId)
    {
        var result = await _apiKeysService.RevokeAsync(GetUserId(), apiKeyId);
        return result.IsSuccess ? NoContent() : ToErrorResponse(result.Error);
    }

    [HttpGet("current")]
    [AllowApiKey]
    [EndpointSummary("Describe the calling API key")]
    [EndpointDescription("For API key callers: the key and the organizations it can access, with the access level of each.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiKeyResponse>> GetCurrentApiKey()
    {
        if (HttpContext.Items[typeof(ApiKey)] is not ApiKey apiKey)
            return NotFound(new { error = "This request was not authenticated with an API key." });

        var organizations = await _apiKeysService.GetAccessibleOrganizationsAsync(apiKey);
        return Ok(ToResponse(apiKey) with { Organizations = organizations.Select(ToResponse).ToList() });
    }

    private static ApiKeyResponse ToResponse(ApiKey apiKey) => new(
        apiKey.Id,
        apiKey.Name,
        apiKey.Prefix,
        apiKey.CreatedAt,
        apiKey.ExpiresAt,
        apiKey.LastUsedAt,
        apiKey.Organizations.Select(ToResponse).OrderBy(organization => organization.Name).ToList());

    private static ApiKeyOrganizationResponse ToResponse(ApiKeyOrganization scope) =>
        new(scope.OrganizationId, scope.Organization.Name, scope.Access);

    private ActionResult ToErrorResponse(Error error) => error.Type switch
    {
        ErrorType.Invalid => BadRequest(new { error = error.Message }),
        _ => NotFound(new { error = error.Message }),
    };

    // [Authorize] guarantees an authenticated user, and both schemes set the user ID.
    private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
}
