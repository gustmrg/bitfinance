namespace BitFinance.API.Extensions;

public static class LoggingExtensions
{
    public static WebApplicationBuilder AddSafeLogging(this WebApplicationBuilder builder)
    {
        builder.Logging.ClearProviders();
        builder.Logging.AddConfiguration(builder.Configuration.GetSection("Logging"));
        // AddBitFinanceObservability registers the sanitized console and OTLP sinks.
        return builder;
    }
}
