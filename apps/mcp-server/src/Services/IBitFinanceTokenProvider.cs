namespace BitFinance.MCP.Services;

public interface IBitFinanceTokenProvider
{
    Task<string> GetAccessTokenAsync(CancellationToken cancellationToken = default);
    Task<string> GetAgentUserIdAsync(CancellationToken cancellationToken = default);
}
