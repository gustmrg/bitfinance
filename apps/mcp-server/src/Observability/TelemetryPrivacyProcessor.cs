using System.Diagnostics;
using OpenTelemetry;

namespace BitFinance.MCP.Observability;

public sealed class TelemetryPrivacyProcessor : BaseProcessor<Activity>
{
    private static readonly string[] SensitiveFragments =
    [
        "authorization",
        "cookie",
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
        foreach (var tag in activity.TagObjects.ToArray())
        {
            if (SensitiveFragments.Any(fragment =>
                    tag.Key.Contains(fragment, StringComparison.OrdinalIgnoreCase)))
            {
                activity.SetTag(tag.Key, null);
            }
        }

        if (!string.IsNullOrEmpty(activity.StatusDescription))
        {
            activity.SetStatus(activity.Status);
        }
    }
}
