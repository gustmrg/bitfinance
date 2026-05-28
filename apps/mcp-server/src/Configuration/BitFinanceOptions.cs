using Microsoft.Extensions.Configuration;

namespace BitFinance.MCP.Configuration;

public sealed class BitFinanceOptions
{
    public Uri ApiBaseUrl { get; init; } = null!;
    public string AgentEmail { get; init; } = string.Empty;
    public string AgentPassword { get; init; } = string.Empty;
    public Guid? DefaultOrganizationId { get; init; }
    public string ApiVersion { get; init; } = "1";

    public static BitFinanceOptions FromConfiguration(IConfiguration configuration)
    {
        var apiBaseUrl = configuration["BITFINANCE_API_BASE_URL"];
        var agentEmail = configuration["BITFINANCE_AGENT_EMAIL"];
        var agentPassword = configuration["BITFINANCE_AGENT_PASSWORD"];
        var apiVersion = configuration["BITFINANCE_API_VERSION"];
        var defaultOrganizationIdValue = configuration["BITFINANCE_DEFAULT_ORGANIZATION_ID"];

        if (string.IsNullOrWhiteSpace(apiBaseUrl))
        {
            throw new InvalidOperationException("BITFINANCE_API_BASE_URL is required.");
        }

        if (!Uri.TryCreate(apiBaseUrl, UriKind.Absolute, out var parsedApiBaseUrl))
        {
            throw new InvalidOperationException("BITFINANCE_API_BASE_URL must be an absolute URL.");
        }

        if (string.IsNullOrWhiteSpace(agentEmail))
        {
            throw new InvalidOperationException("BITFINANCE_AGENT_EMAIL is required.");
        }

        if (string.IsNullOrWhiteSpace(agentPassword))
        {
            throw new InvalidOperationException("BITFINANCE_AGENT_PASSWORD is required.");
        }

        Guid? defaultOrganizationId = null;
        if (!string.IsNullOrWhiteSpace(defaultOrganizationIdValue))
        {
            if (!Guid.TryParse(defaultOrganizationIdValue, out var parsedOrganizationId))
            {
                throw new InvalidOperationException("BITFINANCE_DEFAULT_ORGANIZATION_ID must be a valid GUID when provided.");
            }

            defaultOrganizationId = parsedOrganizationId;
        }

        return new BitFinanceOptions
        {
            ApiBaseUrl = parsedApiBaseUrl,
            AgentEmail = agentEmail,
            AgentPassword = agentPassword,
            DefaultOrganizationId = defaultOrganizationId,
            ApiVersion = string.IsNullOrWhiteSpace(apiVersion) ? "1" : apiVersion
        };
    }
}
