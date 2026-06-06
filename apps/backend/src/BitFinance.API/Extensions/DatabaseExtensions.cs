using BitFinance.Business.Entities;
using BitFinance.Data.Contexts;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BitFinance.API.Extensions;

public static class DatabaseExtensions
{
    private const int RequiredPasswordLength = 8;

    public static IServiceCollection AddDatabaseContext(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Database");
        
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("Database connection string not found in configuration or Key Vault.");
        
        services.AddDbContext<ApplicationDbContext>(options => 
            options.UseNpgsql(connectionString));

        services.Configure<IdentityOptions>(options =>
        {
            options.Password.RequiredLength = RequiredPasswordLength;
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;
        });

        services.AddIdentityCore<User>()
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders();

        services.AddIdentityApiEndpoints<User>()
            .AddEntityFrameworkStores<ApplicationDbContext>();
        
        return services;
    }
}
