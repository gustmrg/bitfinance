using System.Net;
using Amazon.S3;
using Amazon.S3.Model;
using BitFinance.API.Health;
using BitFinance.API.Settings;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace BitFinance.API.UnitTests;

public sealed class ObjectStorageHealthCheckTests
{
    private readonly Mock<IAmazonS3> _s3 = new();

    [Fact]
    public async Task ExistingProbeObject_IsHealthyWithoutWriting()
    {
        _s3.Setup(s3 => s3.GetObjectMetadataAsync(It.IsAny<GetObjectMetadataRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GetObjectMetadataResponse());

        var result = await Check("files");

        Assert.Equal(HealthStatus.Healthy, result.Status);
        _s3.Verify(s3 => s3.GetObjectMetadataAsync(
            It.Is<GetObjectMetadataRequest>(request => request.BucketName == "bucket" && request.Key == "files/health/storage-probe"),
            It.IsAny<CancellationToken>()), Times.Once);
        _s3.Verify(s3 => s3.PutObjectAsync(It.IsAny<PutObjectRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData(HttpStatusCode.NotFound)]
    [InlineData(HttpStatusCode.Forbidden)]
    public async Task MissingProbeObject_IsCreatedOnce(HttpStatusCode status)
    {
        _s3.Setup(s3 => s3.GetObjectMetadataAsync(It.IsAny<GetObjectMetadataRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new AmazonS3Exception("missing") { StatusCode = status });
        _s3.Setup(s3 => s3.PutObjectAsync(It.IsAny<PutObjectRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PutObjectResponse());

        var result = await Check(prefix: "");

        Assert.Equal(HealthStatus.Healthy, result.Status);
        _s3.Verify(s3 => s3.PutObjectAsync(
            It.Is<PutObjectRequest>(request => request.Key == "health/storage-probe"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RejectedWrite_IsUnhealthyWithoutDetails()
    {
        _s3.Setup(s3 => s3.GetObjectMetadataAsync(It.IsAny<GetObjectMetadataRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new AmazonS3Exception("denied") { StatusCode = HttpStatusCode.Forbidden });
        _s3.Setup(s3 => s3.PutObjectAsync(It.IsAny<PutObjectRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new AmazonS3Exception("InvalidAccessKeyId secret-detail"));

        var result = await Check("files");

        Assert.Equal(HealthStatus.Unhealthy, result.Status);
        Assert.Null(result.Exception);
        Assert.DoesNotContain("secret-detail", result.Description);
    }

    [Fact]
    public async Task UnreachableStorage_IsUnhealthy()
    {
        _s3.Setup(s3 => s3.GetObjectMetadataAsync(It.IsAny<GetObjectMetadataRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("connection refused"));

        var result = await Check("files");

        Assert.Equal(HealthStatus.Unhealthy, result.Status);
        _s3.Verify(s3 => s3.PutObjectAsync(It.IsAny<PutObjectRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    private Task<HealthCheckResult> Check(string prefix)
    {
        var check = new ObjectStorageHealthCheck(
            _s3.Object,
            Options.Create(new StorageSettings { BucketName = "bucket", Prefix = prefix }));
        return check.CheckHealthAsync(new HealthCheckContext());
    }
}
