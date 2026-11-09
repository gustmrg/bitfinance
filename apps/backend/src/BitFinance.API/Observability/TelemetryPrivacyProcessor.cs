using System.Diagnostics;
using OpenTelemetry;

namespace BitFinance.API.Observability;

public sealed class TelemetryPrivacyProcessor : BaseProcessor<Activity>
{
    private static readonly string[] SensitiveFragments =
    [
        "authorization",
        "cookie",
        "connection_string",
        "db.statement",
        "db.query",
        "db.command",
        "db.parameter",
        "http.request.header",
        "http.response.header",
        "url.full",
        "url.path",
        "url.query",
        "http.url",
        "http.target",
        "user_agent",
        "user."
    ];

    public override void OnEnd(Activity activity)
    {
        var containsDatabaseStatement = activity.TagObjects.Any(tag =>
            tag.Key.Contains("db.statement", StringComparison.OrdinalIgnoreCase) ||
            tag.Key.Contains("db.query", StringComparison.OrdinalIgnoreCase) ||
            tag.Key.Contains("db.command", StringComparison.OrdinalIgnoreCase));

        foreach (var tag in activity.TagObjects.ToArray())
        {
            if (IsSensitive(tag.Key))
            {
                activity.SetTag(tag.Key, null);
            }
        }

        if (containsDatabaseStatement)
        {
            activity.DisplayName = "postgresql.command";
        }

        if (!string.IsNullOrEmpty(activity.StatusDescription))
        {
            activity.SetStatus(activity.Status);
        }
    }

    private static bool IsSensitive(string key) =>
        SensitiveFragments.Any(fragment => key.Contains(fragment, StringComparison.OrdinalIgnoreCase));
}
