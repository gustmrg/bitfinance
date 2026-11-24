using System.Text.Json.Serialization;
using BitFinance.Business.Enums;

namespace BitFinance.API.Models;

public record CreateApiKeyRequest(string Name, List<ApiKeyOrganizationRequest> Organizations, DateTime? ExpiresAt);

public record ApiKeyOrganizationRequest(
    Guid OrganizationId,
    [property: JsonConverter(typeof(ApiKeyAccessConverter))] ApiKeyAccess Access);

public record CreateApiKeyResponse(Guid Id, string Name, string Prefix, string Secret);

public record ApiKeyResponse(
    Guid Id,
    string Name,
    string Prefix,
    DateTime CreatedAt,
    DateTime? ExpiresAt,
    DateTime? LastUsedAt,
    List<ApiKeyOrganizationResponse> Organizations);

public record ApiKeyOrganizationResponse(
    Guid OrganizationId,
    string Name,
    [property: JsonConverter(typeof(ApiKeyAccessConverter))] ApiKeyAccess Access);

// Accepts only the names as text; the default converter would also take numbers.
public sealed class ApiKeyAccessConverter() : JsonStringEnumConverter<ApiKeyAccess>(allowIntegerValues: false);
