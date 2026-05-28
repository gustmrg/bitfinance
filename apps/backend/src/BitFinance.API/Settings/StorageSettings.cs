using Microsoft.Extensions.Options;

namespace BitFinance.API.Settings;

public class StorageSettings
{
    public const string SectionName = "Storage";

    public string BucketName { get; set; } = string.Empty;
    public string Region { get; set; } = "us-east-1";
    public string Prefix { get; set; } = string.Empty;
    public string ServiceUrl { get; set; } = string.Empty;
}

public class StorageSettingsValidator : IValidateOptions<StorageSettings>
{
    public ValidateOptionsResult Validate(string? name, StorageSettings options)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(options.BucketName))
            errors.Add("Storage:BucketName is required.");

        if (string.IsNullOrWhiteSpace(options.Region))
            errors.Add("Storage:Region is required.");

        return errors.Count > 0
            ? ValidateOptionsResult.Fail(errors)
            : ValidateOptionsResult.Success;
    }
}