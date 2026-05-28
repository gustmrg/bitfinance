using Amazon.Runtime;
using Amazon.S3;
using BitFinance.API.Middlewares;
using BitFinance.API.Services;
using BitFinance.API.Services.Interfaces;
using BitFinance.API.Settings;
using BitFinance.Business.Interfaces;
using BitFinance.Data.Caching;
using BitFinance.Data.Repositories;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Options;

namespace BitFinance.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddDependencyInjection(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHostedService<BillStatusWorkerService>();
        services.AddHostedService<RefreshTokenCleanupService>();

        services.AddScoped<IBillsRepository, BillsRepository>();
        services.AddScoped<IOrganizationsRepository, OrganizationsRepository>();
        services.AddScoped<IUsersRepository, UsersRepository>();
        services.AddScoped<IExpensesRepository, ExpensesRepository>();
        services.AddScoped<IInvitationsRepository, InvitationsRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IAttachmentsRepository, AttachmentsRepository>();

        services.AddScoped<IUsersService, UsersService>();
        services.AddScoped<IBillsService, BillsService>();
        services.AddScoped<IExpensesService, ExpensesService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IFileValidationService, FileValidationService>();
        services.AddScoped<IAttachmentService, AttachmentService>();
        services.AddScoped<ICookieService, CookieService>();
        services.AddScoped<IOrganizationsService, OrganizationsService>();
        services.AddScoped<IInvitationsService, InvitationsService>();

        services.AddSingleton<IValidateOptions<JwtSettings>, JwtSettingsValidator>();
        services.AddOptions<JwtSettings>()
            .Bind(configuration.GetSection(JwtSettings.SectionName))
            .ValidateOnStart();

        services.AddSingleton<IValidateOptions<StorageSettings>, StorageSettingsValidator>();
        services.AddOptions<StorageSettings>()
            .Bind(configuration.GetSection(StorageSettings.SectionName))
            .ValidateOnStart();
        services.AddFileStorageProvider(configuration);

        services.AddSingleton<ICacheService, RedisCacheService>();
        services.AddSingleton<DistributedCacheEntryOptions>();
        services.AddTransient<GlobalExceptionHandlerMiddleware>();

        return services;
    }

    private static IServiceCollection AddFileStorageProvider(this IServiceCollection services, IConfiguration configuration)
    {
        var region = configuration.GetValue<string>("Storage:Region") ?? "us-east-1";
        var serviceUrl = configuration.GetValue<string>("Storage:ServiceUrl");

        if (!string.IsNullOrWhiteSpace(serviceUrl))
        {
            var s3Config = new AmazonS3Config
            {
                ServiceURL = serviceUrl,
                ForcePathStyle = true
            };
            var accessKey = configuration.GetValue<string>("AWS_ACCESS_KEY_ID") ?? "";
            var secretKey = configuration.GetValue<string>("AWS_SECRET_ACCESS_KEY") ?? "";
            var credentials = new BasicAWSCredentials(accessKey, secretKey);
            services.AddSingleton<IAmazonS3>(_ => new AmazonS3Client(credentials, s3Config));
        }
        else
        {
            services.AddSingleton<IAmazonS3>(_ => new AmazonS3Client(Amazon.RegionEndpoint.GetBySystemName(region)));
        }

        services.AddScoped<IFileStorageService, S3FileStorageService>();

        return services;
    }
}