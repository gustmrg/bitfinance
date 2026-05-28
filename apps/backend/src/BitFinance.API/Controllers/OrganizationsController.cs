using System.Security.Claims;
using Asp.Versioning;
using BitFinance.API.Attributes;
using BitFinance.API.Models;
using BitFinance.API.Models.Request;
using BitFinance.API.Models.Response;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BitFinance.API.Controllers;

[ApiController]
[Authorize]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/organizations")]
public class OrganizationsController : ControllerBase
{
    private readonly IOrganizationsService _organizationsService;
    private readonly IInvitationsService _invitationsService;
    private readonly IUsersService _usersService;

    public OrganizationsController(
        IOrganizationsService organizationsService,
        IInvitationsService invitationsService,
        IUsersService usersService)
    {
        _organizationsService = organizationsService;
        _invitationsService = invitationsService;
        _usersService = usersService;
    }

    [HttpGet]
    [EndpointSummary("List user organizations")]
    [EndpointDescription("Returns all organizations the authenticated user is a member of.")]
    public async Task<IActionResult> GetOrganizations()
    {
        var userId = User.Claims.FirstOrDefault(a => a.Type == ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId)) return BadRequest("Invalid user");

        var user = await _usersService.GetUserByIdAsync(userId);

        if (user == null) return BadRequest("Invalid user");

        var organizations = await _organizationsService.GetAllByUserIdAsync(userId);

        var response = organizations
            .Select(o => new OrganizationResponseModel(o.Id, o.Name))
            .ToList();

        return Ok(response);
    }

    [HttpGet("{organizationId:guid}")]
    [EndpointSummary("Get organization details")]
    [EndpointDescription("Returns the details and member list of a specific organization.")]
    public async Task<IActionResult> GetOrganizationById(Guid organizationId)
    {
        var organization = await _organizationsService.GetByIdAsync(organizationId);

        if (organization is null) return NotFound();

        var response = new GetOrganizationByIdResponse
        {
            Id = organization.Id,
            Name = organization.Name,
            CreatedAt = organization.CreatedAt,
            UpdatedAt = organization.UpdatedAt,
        };

        foreach (var membership in organization.Members)
        {
            var user = membership.User;
            response.Members.Add(new UserResponseModel(user.Id, user.UserName ?? string.Empty, user.Email ?? string.Empty));
        }

        return Ok(response);
    }

    [HttpPost]
    [EndpointSummary("Create an organization")]
    [EndpointDescription("Creates a new organization and adds the authenticated user as the first member.")]
    public async Task<IActionResult> CreateOrganization(CreateOrganizationRequest request)
    {
        var userId = User.Claims.FirstOrDefault(a => a.Type == ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId)) return BadRequest("Invalid user");

        var user = await _usersService.GetUserByIdAsync(userId);

        if (user == null) return BadRequest("Invalid user");

        var organization = await _organizationsService.CreateAsync(request.Name, user.Id);

        return CreatedAtAction(nameof(GetOrganizationById), new { organizationId = organization.Id }, new OrganizationResponseModel(organization.Id, organization.Name));
    }

    [HttpPatch("{organizationId:guid}")]
    [EndpointSummary("Update an organization")]
    [EndpointDescription("Updates the details of a specific organization.")]
    public async Task<IActionResult> UpdateOrganization(Guid organizationId, [FromBody] UpdateOrganizationRequest request)
    {
        var organization = await _organizationsService.UpdateAsync(organizationId, request.Name);

        if (organization is null) return NotFound();

        return Ok(new OrganizationResponseModel(organization.Id, organization.Name));
    }

    [HttpPost("{organizationId:guid}/invite")]
    [OrganizationAuthorization]
    [EndpointSummary("Create an invitation")]
    [EndpointDescription("Creates an invitation for a user to join the organization, valid for 24 hours.")]
    public async Task<IActionResult> CreateInvite([FromRoute] Guid organizationId, [FromBody] CreateInvitationRequest request)
    {
        var userId = User.Claims.FirstOrDefault(a => a.Type == ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId)) return BadRequest("Invalid user");

        var result = await _invitationsService.CreateInvitationAsync(
            organizationId, request.Email, request.Role ?? OrgRole.Member, userId);

        if (!result.Success)
        {
            return result.Error switch
            {
                CreateInvitationError.NotAuthorized => Forbid(),
                CreateInvitationError.OrganizationNotFound => NotFound(result.ErrorMessage),
                CreateInvitationError.PlanLimitReached => StatusCode(403, new { error = result.ErrorMessage }),
                _ => BadRequest(result.ErrorMessage),
            };
        }

        var invitation = result.Invitation!;
        return Ok(new CreateInvitationResponse(invitation.Id, result.RawToken!, invitation.ExpiresAt));
    }

    [HttpPost("join")]
    [EndpointSummary("Join an organization")]
    [EndpointDescription("Adds the authenticated user to an organization using a valid invitation token.")]
    public async Task<IActionResult> JoinOrganization([FromQuery] string token)
    {
        var userId = User.Claims.FirstOrDefault(a => a.Type == ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId)) return BadRequest("Invalid user");

        var user = await _usersService.GetUserByIdAsync(userId);

        if (user == null) return NotFound("Invalid user");

        var result = await _invitationsService.JoinOrganizationAsync(token, user.Id, user.Email ?? string.Empty);

        if (!result.Success)
        {
            return result.Error switch
            {
                JoinOrganizationError.InvalidToken => NotFound(result.ErrorMessage),
                JoinOrganizationError.OrganizationNotFound => NotFound(result.ErrorMessage),
                JoinOrganizationError.EmailMismatch => BadRequest(result.ErrorMessage),
                _ => BadRequest(result.ErrorMessage),
            };
        }

        return Ok();
    }
}
