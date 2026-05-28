using BitFinance.API.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.AddAzureKeyVault();

builder.Services.AddHttpOptions();
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddDatabaseContext(builder.Configuration);
builder.Services.AddDependencyInjection(builder.Configuration);
builder.Services.AddCaching(builder.Configuration);
builder.Services.AddApiDocumentation();
builder.Services.AddCustomHttpLogging();

builder.Host.AddLogging(builder.Configuration);

var app = builder.Build();

app.ConfigureMiddleware(builder.Configuration);

app.Run();