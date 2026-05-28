using Microsoft.Extensions.Options;

namespace BitFinance.API.Settings;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpirationInMinutes { get; set; } = 120;
}

public class JwtSettingsValidator : IValidateOptions<JwtSettings>
{
    public ValidateOptionsResult Validate(string? name, JwtSettings options)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(options.Key))
            errors.Add("Jwt:Key is required.");

        if (string.IsNullOrWhiteSpace(options.Issuer))
            errors.Add("Jwt:Issuer is required.");

        if (string.IsNullOrWhiteSpace(options.Audience))
            errors.Add("Jwt:Audience is required.");

        if (options.ExpirationInMinutes <= 0)
            errors.Add("Jwt:ExpirationInMinutes must be greater than 0.");

        return errors.Count > 0
            ? ValidateOptionsResult.Fail(errors)
            : ValidateOptionsResult.Success;
    }
}
