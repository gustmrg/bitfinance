using System.Diagnostics;
using System.Diagnostics.Metrics;
using BitFinance.Business.Exceptions;

namespace BitFinance.API.Observability;

public static class AuthFlows
{
    public const string PasswordLogin = "password_login";
    public const string PasswordRegister = "password_register";
    public const string GoogleLogin = "google_login";
    public const string GoogleLink = "google_link";
    public const string TokenRefresh = "token_refresh";
}

public static class AuthOutcomes
{
    public const string Success = "success";
    public const string InvalidCredentials = "invalid_credentials";
    public const string LockedOut = "locked_out";
    public const string Rejected = "rejected";
    public const string InvalidToken = "invalid_token";
    public const string ReuseDetected = "reuse_detected";
}

public static class DomainEntities
{
    public const string Bill = "bill";
    public const string BillSeries = "bill_series";
    public const string Expense = "expense";
}

public static class DomainOperations
{
    public const string Created = "created";
    public const string Updated = "updated";
    public const string Paid = "paid";
    public const string Deleted = "deleted";
    public const string Stopped = "stopped";
}

public static class AttachmentKinds
{
    public const string Bill = "bill";
    public const string Expense = "expense";
    public const string Avatar = "avatar";
}

public static class BusinessTelemetry
{
    private static readonly HashSet<string> AuthFlowNames =
    [
        AuthFlows.PasswordLogin, AuthFlows.PasswordRegister, AuthFlows.GoogleLogin,
        AuthFlows.GoogleLink, AuthFlows.TokenRefresh
    ];

    private static readonly HashSet<string> AuthOutcomeNames =
    [
        AuthOutcomes.Success, AuthOutcomes.InvalidCredentials, AuthOutcomes.LockedOut,
        AuthOutcomes.Rejected, AuthOutcomes.InvalidToken, AuthOutcomes.ReuseDetected
    ];

    private static readonly HashSet<string> EntityNames =
        [DomainEntities.Bill, DomainEntities.BillSeries, DomainEntities.Expense];

    private static readonly HashSet<string> OperationNames =
    [
        DomainOperations.Created, DomainOperations.Updated, DomainOperations.Paid,
        DomainOperations.Deleted, DomainOperations.Stopped
    ];

    private static readonly HashSet<string> AttachmentKindNames =
        [AttachmentKinds.Bill, AttachmentKinds.Expense, AttachmentKinds.Avatar];

    private static readonly Counter<long> AuthAttempts = BitFinanceTelemetry.Meter.CreateCounter<long>(
        "bitfinance.auth.attempt.count",
        unit: "{attempt}",
        description: "Authentication attempts by flow and outcome.");

    private static readonly Counter<long> DomainOperationCount = BitFinanceTelemetry.Meter.CreateCounter<long>(
        "bitfinance.domain.operation.count",
        unit: "{operation}",
        description: "Completed changes to bills, bill series and expenses.");

    private static readonly Counter<long> AttachmentUploads = BitFinanceTelemetry.Meter.CreateCounter<long>(
        "bitfinance.attachment.upload.count",
        unit: "{upload}",
        description: "Attachment and avatar uploads by kind and outcome.");

    private static readonly Histogram<long> AttachmentUploadSize = BitFinanceTelemetry.Meter.CreateHistogram<long>(
        "bitfinance.attachment.upload.size",
        unit: "By",
        description: "Size of stored attachments and avatars.",
        advice: new InstrumentAdvice<long>
        {
            HistogramBucketBoundaries = [10_000, 50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000, 25_000_000]
        });

    public static void RecordAuthAttempt(string flow, string outcome)
    {
        if (!AuthFlowNames.Contains(flow) || !AuthOutcomeNames.Contains(outcome))
            throw new ArgumentOutOfRangeException(nameof(flow), "Authentication flow or outcome is not registered.");

        Safely(() => AuthAttempts.Add(1,
            new KeyValuePair<string, object?>("auth.flow", flow),
            new KeyValuePair<string, object?>("outcome", outcome)));
    }

    public static void RecordDomainOperation(string entity, string operation, int count = 1)
    {
        if (!EntityNames.Contains(entity) || !OperationNames.Contains(operation))
            throw new ArgumentOutOfRangeException(nameof(entity), "Domain entity or operation is not registered.");

        if (count <= 0)
            return;

        Safely(() => DomainOperationCount.Add(count,
            new KeyValuePair<string, object?>("domain.entity", entity),
            new KeyValuePair<string, object?>("domain.operation", operation)));
    }

    public static async Task<T> TrackUploadAsync<T>(string kind, Func<Task<T>> upload, Func<T, long> sizeOf)
    {
        if (!AttachmentKindNames.Contains(kind))
            throw new ArgumentOutOfRangeException(nameof(kind), "Attachment kind is not registered.");

        T result;
        try
        {
            result = await upload();
        }
        catch (Exception exception)
        {
            RecordUpload(kind, UploadOutcome(exception), null);
            throw;
        }

        RecordUpload(kind, "success", sizeOf(result));
        return result;
    }

    public static string UploadOutcome(Exception exception) => exception switch
    {
        RequestValidationException => "rejected",
        PlanLimitExceededException => "plan_limit",
        KeyNotFoundException => "not_found",
        OperationCanceledException => "cancelled",
        _ => "error"
    };

    private static void RecordUpload(string kind, string outcome, long? size)
    {
        Safely(() =>
        {
            var tags = new TagList
            {
                { "attachment.kind", kind },
                { "outcome", outcome }
            };
            AttachmentUploads.Add(1, tags);
            if (size is { } bytes)
                AttachmentUploadSize.Record(bytes, new KeyValuePair<string, object?>("attachment.kind", kind));
        });
    }

    private static void Safely(Action record)
    {
        try
        {
            record();
        }
        catch
        {
        }
    }
}
