namespace BitFinance.API.Extensions;

public static class CachingExtensions
{
    public static IServiceCollection AddCaching(this IServiceCollection services, IConfiguration configuration)
    {
        var cacheEnabled = configuration.GetValue<bool>("AppSettings:CacheEnabled");

        if (cacheEnabled)
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = configuration.GetConnectionString("Cache");
                options.InstanceName = "BitFinance";
            });
        }
        else
        {
            services.AddDistributedMemoryCache();
        }

        return services;
    }
}