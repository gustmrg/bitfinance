using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using BitFinance.MCP.Configuration;
using BitFinance.MCP.Extensions;
using BitFinance.MCP.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Console;
using ModelContextProtocol.Server;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddConfiguration(builder.Configuration.GetSection("Logging"));
builder.Services.Configure<ConsoleLoggerOptions>(options =>
{
    // Keep logs away from MCP response bodies when running behind HTTP streaming.
    options.LogToStandardErrorThreshold = LogLevel.Trace;
});
if (builder.Environment.IsDevelopment())
{
    builder.Logging.AddSimpleConsole(options =>
    {
        options.ColorBehavior = LoggerColorBehavior.Enabled;
        options.IncludeScopes = true;
        options.SingleLine = true;
        options.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffzzz ";
    });
}
else
{
    builder.Logging.AddFilter("Microsoft", LogLevel.Warning);
    builder.Logging.AddFilter("System", LogLevel.Warning);
    builder.Logging.AddJsonConsole(options =>
    {
        options.IncludeScopes = true;
        options.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffzzz";
        options.UseUtcTimestamp = true;
    });
}

var mcpBearerToken = builder.Configuration["BITFINANCE_MCP_BEARER_TOKEN"];
if (string.IsNullOrWhiteSpace(mcpBearerToken))
{
    throw new InvalidOperationException("BITFINANCE_MCP_BEARER_TOKEN must be configured.");
}

var bitFinanceOptions = BitFinanceOptions.FromConfiguration(builder.Configuration);
builder.Services.AddSingleton(bitFinanceOptions);
builder.Services.AddMcpHealthChecks(bitFinanceOptions);
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

app.MapMcpHealthChecks();

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
