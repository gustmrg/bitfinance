using BitFinance.API.Middlewares;
using Microsoft.AspNetCore.HttpOverrides;
using Scalar.AspNetCore;

namespace BitFinance.API.Extensions;

public static class MiddlewareExtensions
{
    public static IServiceCollection AddHttpOptions(this IServiceCollection services)
    {
        services.AddCors();

        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
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

        app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
            .ExcludeFromDescription();

        return app;
    }
}