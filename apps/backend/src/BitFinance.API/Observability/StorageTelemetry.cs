using System.Diagnostics;
using System.Diagnostics.Metrics;
using System.Net;
using Amazon.S3;

namespace BitFinance.API.Observability;

public static class StorageOperations
{
    public const string Put = "put";
    public const string Get = "get";
    public const string Head = "head";
    public const string Delete = "delete";
}

public static class StorageTelemetry
{
    private static readonly HashSet<string> OperationNames =
        [StorageOperations.Put, StorageOperations.Get, StorageOperations.Head, StorageOperations.Delete];

    private static readonly Histogram<double> Duration = BitFinanceTelemetry.Meter.CreateHistogram<double>(
        "bitfinance.storage.operation.duration",
        unit: "s",
        description: "Duration of object storage requests by operation and outcome.");

    public static async Task<T> TrackAsync<T>(string operation, Func<Task<T>> request)
    {
        if (!OperationNames.Contains(operation))
            throw new ArgumentOutOfRangeException(nameof(operation), "Storage operation is not registered.");

        var startedAt = Stopwatch.GetTimestamp();
        var activity = StartActivity(operation);
        var outcome = "success";
        try
        {
            return await request();
        }
        catch (AmazonS3Exception exception) when (exception.StatusCode == HttpStatusCode.NotFound)
        {
            outcome = "not_found";
            throw;
        }
        catch (OperationCanceledException)
        {
            outcome = "cancelled";
            throw;
        }
        catch (Exception)
        {
            outcome = "error";
            throw;
        }
        finally
        {
            Complete(activity, operation, outcome, Stopwatch.GetElapsedTime(startedAt).TotalSeconds);
        }
    }

    private static Activity? StartActivity(string operation)
    {
        try
        {
            var activity = BitFinanceTelemetry.ActivitySource.StartActivity($"storage.{operation}", ActivityKind.Client);
            activity?.SetTag("storage.operation", operation);
            return activity;
        }
        catch
        {
            return null;
        }
    }

    private static void Complete(Activity? activity, string operation, string outcome, double durationSeconds)
    {
        try
        {
            if (activity is not null)
            {
                activity.SetTag("outcome", outcome);
                if (outcome == "error")
                    activity.SetStatus(ActivityStatusCode.Error);
                activity.Dispose();
            }

            Duration.Record(durationSeconds,
                new KeyValuePair<string, object?>("storage.operation", operation),
                new KeyValuePair<string, object?>("outcome", outcome));
        }
        catch
        {
        }
    }
}
