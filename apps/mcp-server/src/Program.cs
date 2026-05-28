using BitFinance.MCP.Configuration;
using BitFinance.MCP.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ModelContextProtocol.Server;

var builder = Host.CreateApplicationBuilder(args);
builder.Logging.AddConsole(consoleLogOptions =>
{
    // Configure all logs to go to stderr
    consoleLogOptions.LogToStandardErrorThreshold = LogLevel.Trace;
});

var bitFinanceOptions = BitFinanceOptions.FromConfiguration(builder.Configuration);
builder.Services.AddSingleton(bitFinanceOptions);
builder.Services.AddHttpClient(BitFinanceApiClient.ClientName, client =>
{
    client.BaseAddress = bitFinanceOptions.ApiBaseUrl;
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddSingleton<IBitFinanceTokenProvider, BitFinanceTokenProvider>();
builder.Services.AddSingleton<IBitFinanceApiClient, BitFinanceApiClient>();

builder.Services
    .AddMcpServer()
    .WithStdioServerTransport()
    .WithToolsFromAssembly();

await builder.Build().RunAsync();
