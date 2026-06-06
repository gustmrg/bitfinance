using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using BitFinance.MCP.Configuration;
using BitFinance.MCP.Services;
using Microsoft.Extensions.Logging;
using ModelContextProtocol.Server;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.AddConsole(consoleLogOptions =>
{
    // Keep logs away from MCP response bodies when running behind HTTP streaming.
    consoleLogOptions.LogToStandardErrorThreshold = LogLevel.Trace;
});

var mcpBearerToken = builder.Configuration["BITFINANCE_MCP_BEARER_TOKEN"];
if (string.IsNullOrWhiteSpace(mcpBearerToken))
{
    throw new InvalidOperationException("BITFINANCE_MCP_BEARER_TOKEN must be configured.");
}

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
    .WithHttpTransport(options =>
    {
        options.Stateless = true;
    })
    .WithToolsFromAssembly();

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.UseWhen(
    context => context.Request.Path.StartsWithSegments("/mcp"),
    branch =>
    {
        branch.Use(async (context, next) =>
        {
            if (!AuthenticationHeaderValue.TryParse(context.Request.Headers.Authorization, out var authorization) ||
                !string.Equals(authorization.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase) ||
                string.IsNullOrEmpty(authorization.Parameter) ||
                !TokenMatches(mcpBearerToken, authorization.Parameter))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return;
            }

            await next(context);
        });
    });

app.MapMcp("/mcp");

await app.RunAsync();

static bool TokenMatches(string expectedToken, string actualToken)
{
    var expectedBytes = Encoding.UTF8.GetBytes(expectedToken);
    var actualBytes = Encoding.UTF8.GetBytes(actualToken);

    return expectedBytes.Length == actualBytes.Length &&
        CryptographicOperations.FixedTimeEquals(expectedBytes, actualBytes);
}
