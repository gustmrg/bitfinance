using System.Net;
using System.Text;
using Amazon.S3;
using Amazon.S3.Model;
using BitFinance.API.Settings;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using OpenTelemetry;

namespace BitFinance.API.Health;

public sealed class ObjectStorageHealthCheck(
    IAmazonS3 s3Client,
    IOptions<StorageSettings> settings) : IHealthCheck
{
    public const string ProbeObjectName = "health/storage-probe";

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        using var suppressTracing = SuppressInstrumentationScope.Begin();
        var bucket = settings.Value.BucketName;
        var key = ProbeKey(settings.Value.Prefix);

        try
        {
            await s3Client.GetObjectMetadataAsync(new GetObjectMetadataRequest
            {
                BucketName = bucket,
                Key = key
            }, cancellationToken);
            return HealthCheckResult.Healthy();
        }
        catch (AmazonS3Exception exception) when (exception.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Forbidden)
        {
            return await CreateProbeObjectAsync(bucket, key, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            return HealthCheckResult.Unhealthy("Object storage is unavailable.");
        }
    }

    public static string ProbeKey(string? prefix) =>
        string.IsNullOrWhiteSpace(prefix) ? ProbeObjectName : $"{prefix}/{ProbeObjectName}";

    private async Task<HealthCheckResult> CreateProbeObjectAsync(
        string bucket,
        string key,
        CancellationToken cancellationToken)
    {
        try
        {
            using var content = new MemoryStream(Encoding.UTF8.GetBytes("ok"));
            await s3Client.PutObjectAsync(new PutObjectRequest
            {
                BucketName = bucket,
                Key = key,
                InputStream = content,
                ContentType = "text/plain"
            }, cancellationToken);
            return HealthCheckResult.Healthy();
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            return HealthCheckResult.Unhealthy("Object storage is unavailable.");
        }
    }
}
