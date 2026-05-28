using Microsoft.AspNetCore.HttpLogging;
using Serilog;
using Serilog.Events;

namespace BitFinance.API.Extensions;

public static class LoggingExtensions
{
    public static ConfigureHostBuilder AddLogging(this ConfigureHostBuilder host, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Database");
        
        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Information)
            .WriteTo.Console()
            .CreateLogger();

        host.UseSerilog(Log.Logger);
        
        return host;
    }
    
    public static IServiceCollection AddCustomHttpLogging(this IServiceCollection services)
    {
        services.AddHttpLogging(options =>
        {
            options.LoggingFields = HttpLoggingFields.Request | HttpLoggingFields.Response;
        });

        return services;
    }
}