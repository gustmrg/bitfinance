using Microsoft.Extensions.Options;

namespace BitFinance.API.Settings;

public sealed class NotificationOptions
{
    public const string SectionName = "Notifications";

    public bool EmailEnabled { get; init; }
    public string? ResendApiToken { get; init; }
    public string? ResendWebhookSecret { get; init; }
    public string? FromAddress { get; init; }
    public string FrontendBaseUrl { get; init; } = "http://localhost:5174";
}

public sealed class NotificationOptionsValidator : IValidateOptions<NotificationOptions>
{
    public ValidateOptionsResult Validate(string? name, NotificationOptions options)
    {
        if (!Uri.TryCreate(options.FrontendBaseUrl, UriKind.Absolute, out _))
            return ValidateOptionsResult.Fail("Notifications:FrontendBaseUrl must be an absolute URL.");

        if (!options.EmailEnabled)
            return ValidateOptionsResult.Success;

        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(options.ResendApiToken)) missing.Add("ResendApiToken");
        if (string.IsNullOrWhiteSpace(options.ResendWebhookSecret)) missing.Add("ResendWebhookSecret");
        if (string.IsNullOrWhiteSpace(options.FromAddress)) missing.Add("FromAddress");

        return missing.Count == 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail($"Notifications email is enabled but these settings are missing: {string.Join(", ", missing)}.");
    }
}
