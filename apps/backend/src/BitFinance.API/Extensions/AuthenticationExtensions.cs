using System.Text;
using BitFinance.API.Controllers;
using BitFinance.API.Services;
using BitFinance.API.Settings;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace BitFinance.API.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSettings = new JwtSettings();
        configuration.GetSection(JwtSettings.SectionName).Bind(jwtSettings);

        var authentication = services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key))
                };
            });

        var googleSettings = new GoogleAuthSettings();
        configuration.GetSection(GoogleAuthSettings.SectionName).Bind(googleSettings);

        if (googleSettings.Enabled && Uri.TryCreate(googleSettings.RedirectUri, UriKind.Absolute, out var redirectUri))
        {
            authentication.AddOpenIdConnect(GoogleAuthService.LoginProvider, "Google", options =>
            {
                options.Authority = "https://accounts.google.com";
                options.ClientId = googleSettings.ClientId;
                options.ClientSecret = googleSettings.ClientSecret;
                options.ResponseType = OpenIdConnectResponseType.Code;
                options.CallbackPath = redirectUri.AbsolutePath;
                options.SignInScheme = IdentityConstants.ExternalScheme;
                options.Prompt = "select_account";
                options.Scope.Clear();
                options.Scope.Add("openid");
                options.Scope.Add("email");
                options.Scope.Add("profile");

                options.Events.OnRedirectToIdentityProvider = context =>
                {
                    context.ProtocolMessage.RedirectUri = redirectUri.AbsoluteUri;
                    return Task.CompletedTask;
                };

                options.Events.OnRemoteFailure = context =>
                {
                    var isLink = context.Properties?.Items.ContainsKey(ExternalIdentityController.LinkUserIdKey) == true;
                    var path = isLink ? "/account/settings" : "/auth/sign-in";
                    context.Response.Redirect($"{googleSettings.FrontendBaseUrl.TrimEnd('/')}{path}?googleError=failed");
                    context.HandleResponse();
                    return Task.CompletedTask;
                };
            });
        }

        return services;
    }
}
