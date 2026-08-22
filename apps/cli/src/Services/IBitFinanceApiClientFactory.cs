using BitFinance.Cli.Configuration;

namespace BitFinance.Cli.Services;

public interface IBitFinanceApiClientFactory
{
    IBitFinanceApiClient Create(CliConfiguration configuration);
}

public sealed class BitFinanceApiClientFactory : IBitFinanceApiClientFactory
{
    public IBitFinanceApiClient Create(CliConfiguration configuration)
    {
        var httpClient = new HttpClient
        {
            BaseAddress = configuration.ApiBaseUrl,
            Timeout = TimeSpan.FromSeconds(30)
        };

        return new BitFinanceApiClient(httpClient, configuration);
    }
}
