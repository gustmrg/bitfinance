using Microsoft.Extensions.Options;

namespace BitFinance.API.Settings;

public sealed class GoogleAuthSettings
{
    public const string SectionName = "GoogleAuth";

    public string? ClientId { get; init; }
    public string? ClientSecret { get; init; }
    public string? RedirectUri { get; init; }
    public string FrontendBaseUrl { get; init; } = string.Empty;

    public bool Enabled => !string.IsNullOrWhiteSpace(ClientId);
}

public sealed class GoogleAuthSettingsValidator : IValidateOptions<GoogleAuthSettings>
{
    public ValidateOptionsResult Validate(string? name, GoogleAuthSettings options)
    {
        if (!string.IsNullOrEmpty(options.FrontendBaseUrl)
            && !Uri.TryCreate(options.FrontendBaseUrl, UriKind.Absolute, out _))
            return ValidateOptionsResult.Fail("GoogleAuth:FrontendBaseUrl must be an absolute URL when set.");

        if (!options.Enabled)
            return ValidateOptionsResult.Success;

        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(options.ClientSecret))
            errors.Add("GoogleAuth:ClientSecret is required when GoogleAuth:ClientId is set.");

        if (!Uri.TryCreate(options.RedirectUri, UriKind.Absolute, out _))
            errors.Add("GoogleAuth:RedirectUri must be an absolute URL when GoogleAuth:ClientId is set.");

        return errors.Count > 0
            ? ValidateOptionsResult.Fail(errors)
            : ValidateOptionsResult.Success;
    }
}
