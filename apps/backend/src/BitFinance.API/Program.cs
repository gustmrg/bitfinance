using BitFinance.API.Extensions;
using BitFinance.Data.Contexts;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.AddAzureKeyVault();

builder.Services.AddHttpOptions();
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddDatabaseContext(builder.Configuration);
builder.Services.AddDependencyInjection(builder.Configuration);
builder.Services.AddCaching(builder.Configuration);
builder.Services.AddBitFinanceHealthChecks(builder.Configuration);
builder.Services.AddApiDocumentation();
builder.AddSafeLogging();

var app = builder.Build();

if (args.Contains("--migrate", StringComparer.OrdinalIgnoreCase))
{
    await using var scope = app.Services.CreateAsyncScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.MigrateAsync();
    return;
}

app.ConfigureMiddleware(builder.Configuration);

app.Run();
