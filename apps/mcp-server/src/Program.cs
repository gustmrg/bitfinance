using System.Net.Http.Headers;
using BitFinance.MCP.Configuration;
using BitFinance.MCP.Extensions;
using BitFinance.MCP.Observability;
using BitFinance.MCP.Services;
using Microsoft.Extensions.Logging;
using ModelContextProtocol.Server;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddConfiguration(builder.Configuration.GetSection("Logging"));
if (!builder.Environment.IsDevelopment())
{
    builder.Logging.AddFilter("Microsoft", LogLevel.Warning);
    builder.Logging.AddFilter("System", LogLevel.Warning);
    builder.Logging.AddFilter("ModelContextProtocol", LogLevel.Warning);
}
builder.AddBitFinanceObservability();

var bitFinanceOptions = BitFinanceOptions.FromConfiguration(builder.Configuration);
builder.Services.AddSingleton(bitFinanceOptions);
builder.Services.AddMcpHealthChecks(bitFinanceOptions);
builder.Services.AddHttpContextAccessor();
builder.Services.AddTransient<ForwardApiKeyHandler>();
builder.Services.AddHttpClient(BitFinanceApiClient.ClientName, client =>
    {
        client.BaseAddress = bitFinanceOptions.ApiBaseUrl;
        client.Timeout = TimeSpan.FromSeconds(30);
    })
    .AddHttpMessageHandler<ForwardApiKeyHandler>();

builder.Services.AddSingleton<IBitFinanceApiClient, BitFinanceApiClient>();

builder.Services
    .AddMcpServer()
    .WithHttpTransport(options =>
    {
        options.Stateless = true;
    })
    .WithRequestFilters(filters =>
    {
        filters.AddCallToolFilter(McpToolTelemetryFilter.Create());
    })
    .WithToolsFromAssembly();

var app = builder.Build();

app.MapMcpHealthChecks();

// Each agent authenticates with its own BitFinance API key, which the API validates on every call.
// Requests without one are turned away here, before reaching the MCP handler.
app.UseWhen(
    context => context.Request.Path.StartsWithSegments("/mcp"),
    branch =>
    {
        branch.Use(async (context, next) =>
        {
            if (!AuthenticationHeaderValue.TryParse(context.Request.Headers.Authorization, out var authorization) ||
                !string.Equals(authorization.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase) ||
                authorization.Parameter?.StartsWith("bf_", StringComparison.Ordinal) != true)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.Headers.WWWAuthenticate = "Bearer";
                return;
            }

            await next(context);
        });
    });

app.MapMcp("/mcp");

await app.RunAsync();
