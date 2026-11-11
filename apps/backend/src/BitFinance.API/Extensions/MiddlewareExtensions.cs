using BitFinance.API.Middlewares;
using Microsoft.AspNetCore.HttpOverrides;
using Scalar.AspNetCore;

namespace BitFinance.API.Extensions;

public static class MiddlewareExtensions
{
    public const string KnownProxyNetworksSection = "ForwardedHeaders:KnownNetworks";

    public static IServiceCollection AddHttpOptions(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddCors();

        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

            // Loopback proxies are trusted by default. A reverse proxy reaching the API from another
            // address (the Docker bridge gateway, for instance) must be listed here, or every request
            // appears to come from the proxy and per-client limits collapse into a single shared one.
            foreach (var network in configuration.GetSection(KnownProxyNetworksSection).Get<string[]>() ?? [])
            {
                if (!string.IsNullOrWhiteSpace(network))
                    options.KnownIPNetworks.Add(System.Net.IPNetwork.Parse(network.Trim()));
            }
        });

        return services;
    }

    public static WebApplication ConfigureMiddleware(this WebApplication app, IConfiguration configuration)
    {
        app.UseCors(options =>
        {
            var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();

            options.WithOrigins(allowedOrigins ?? [])
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });

        app.UseForwardedHeaders();
        app.UseRateLimiter();
        app.UseAuthentication();
        app.UseAuthorization();

        app.MapOpenApi();
        app.MapScalarApiReference(options =>
        {
            options
                .WithTitle("BitFinance API")
                .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
        });
        app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

        if (app.Environment.IsDevelopment())
        {
            app.ApplyMigrations();
        }

        if (app.Environment.IsProduction())
        {
            app.UseHsts();
        }

        app.UseHttpsRedirection();
        app.MapControllers();

        app.MapBitFinanceHealthChecks();

        return app;
    }
}
