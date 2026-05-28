using Azure.Extensions.AspNetCore.Configuration.Secrets;
using Azure.Identity;

namespace BitFinance.API.Extensions;

public static class AzureConfigurationExtensions
{
    public static WebApplicationBuilder AddAzureKeyVault(this WebApplicationBuilder builder)
    {
        if (!builder.Environment.IsProduction())
        {
            return builder;
        }
        
        var keyVaultUrl = builder.Configuration.GetSection("KeyVault:Url").Value;
        
        if (string.IsNullOrWhiteSpace(keyVaultUrl))
        {
            throw new InvalidOperationException("Azure Key Vault URL is not configured. Please set 'KeyVault:Url' in configuration.");
        }
        
        var clientId = Environment.GetEnvironmentVariable("AZURE_CLIENT_ID");
        var clientSecret = Environment.GetEnvironmentVariable("AZURE_CLIENT_SECRET");
        var tenantId = Environment.GetEnvironmentVariable("AZURE_TENANT_ID");
        
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret) || string.IsNullOrWhiteSpace(tenantId))
            throw new InvalidOperationException("Azure credentials are not configured. " +
                                                "Please set AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and AZURE_TENANT_ID environment variables.");
        
        try
        {
            var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
            
            builder.Configuration.AddAzureKeyVault(new Uri(keyVaultUrl), credential, new KeyVaultSecretManager());
            
            Console.WriteLine("Azure Key Vault configuration added successfully");

            return builder;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to configure Azure Key Vault: {ex.Message}", ex);
        }
    }
}