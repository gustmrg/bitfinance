using System.Collections.Concurrent;
using System.Diagnostics.Metrics;
using System.Net;
using Amazon.S3;
using BitFinance.API.Health;
using BitFinance.API.Observability;
using BitFinance.Business.Exceptions;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Xunit;

namespace BitFinance.API.UnitTests;

[Collection(TelemetryTestCollection.Name)]
public sealed class BusinessTelemetryTests
{
    [Fact]
    public void AuthAttempts_UseOnlyRegisteredFlowsAndOutcomes()
    {
        var measurements = new ConcurrentBag<CapturedMeasurement>();
        using var listener = CreateMeterListener(measurements);

        BusinessTelemetry.RecordAuthAttempt(AuthFlows.PasswordLogin, AuthOutcomes.LockedOut);

        var attempt = Assert.Single(measurements, item => item.Name == "bitfinance.auth.attempt.count");
        Assert.Equal(AuthFlows.PasswordLogin, attempt.Tag("auth.flow"));
        Assert.Equal(AuthOutcomes.LockedOut, attempt.Tag("outcome"));
        Assert.Equal(2, attempt.Tags.Count);
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            BusinessTelemetry.RecordAuthAttempt("user@example.com", AuthOutcomes.Success));
    }

    [Fact]
    public void DomainOperations_RecordBatchSizeAndSkipEmptyBatches()
    {
        var measurements = new ConcurrentBag<CapturedMeasurement>();
        using var listener = CreateMeterListener(measurements);

        BusinessTelemetry.RecordDomainOperation(DomainEntities.Expense, DomainOperations.Created, 3);
        BusinessTelemetry.RecordDomainOperation(DomainEntities.Bill, DomainOperations.Deleted, 0);

        var operation = Assert.Single(measurements, item => item.Name == "bitfinance.domain.operation.count");
        Assert.Equal(3, operation.Value);
        Assert.Equal(DomainEntities.Expense, operation.Tag("domain.entity"));
        Assert.Equal(DomainOperations.Created, operation.Tag("domain.operation"));
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            BusinessTelemetry.RecordDomainOperation("invoice", DomainOperations.Created));
    }

    [Fact]
    public async Task TrackUpload_RecordsSizeOnSuccessAndOutcomeOnFailure()
    {
        var measurements = new ConcurrentBag<CapturedMeasurement>();
        using var listener = CreateMeterListener(measurements);

        var stored = await BusinessTelemetry.TrackUploadAsync(
            AttachmentKinds.Bill, () => Task.FromResult(2048L), size => size);
        var rejection = new RequestValidationException("File type is not allowed.");
        var thrown = await Assert.ThrowsAsync<RequestValidationException>(() =>
            BusinessTelemetry.TrackUploadAsync<long>(
                AttachmentKinds.Avatar, () => Task.FromException<long>(rejection), size => size));

        Assert.Equal(2048L, stored);
        Assert.Same(rejection, thrown);
        var uploads = measurements.Where(item => item.Name == "bitfinance.attachment.upload.count").ToList();
        Assert.Contains(uploads, item => item.Tag("attachment.kind") == AttachmentKinds.Bill && item.Tag("outcome") == "success");
        Assert.Contains(uploads, item => item.Tag("attachment.kind") == AttachmentKinds.Avatar && item.Tag("outcome") == "rejected");
        var size = Assert.Single(measurements, item => item.Name == "bitfinance.attachment.upload.size");
        Assert.Equal(2048, size.Value);
        Assert.Equal("By", size.Unit);
    }

    [Theory]
    [InlineData(typeof(PlanLimitExceededException), "plan_limit")]
    [InlineData(typeof(KeyNotFoundException), "not_found")]
    [InlineData(typeof(InvalidOperationException), "error")]
    public void UploadOutcome_MapsExceptionsToFixedValues(Type exceptionType, string expected)
    {
        var exception = (Exception)Activator.CreateInstance(exceptionType, "detail")!;

        Assert.Equal(expected, BusinessTelemetry.UploadOutcome(exception));
    }

    [Fact]
    public async Task StorageOperations_DistinguishMissingObjectsFromErrors()
    {
        var measurements = new ConcurrentBag<CapturedMeasurement>();
        using var listener = CreateMeterListener(measurements);

        await StorageTelemetry.TrackAsync(StorageOperations.Put, () => Task.FromResult(true));
        await Assert.ThrowsAsync<AmazonS3Exception>(() => StorageTelemetry.TrackAsync<bool>(
            StorageOperations.Head,
            () => throw new AmazonS3Exception("missing") { StatusCode = HttpStatusCode.NotFound }));
        await Assert.ThrowsAsync<AmazonS3Exception>(() => StorageTelemetry.TrackAsync<bool>(
            StorageOperations.Get,
            () => throw new AmazonS3Exception("denied") { StatusCode = HttpStatusCode.Forbidden }));

        var durations = measurements.Where(item => item.Name == "bitfinance.storage.operation.duration").ToList();
        Assert.Equal(3, durations.Count);
        Assert.Contains(durations, item => item.Tag("storage.operation") == "put" && item.Tag("outcome") == "success");
        Assert.Contains(durations, item => item.Tag("storage.operation") == "head" && item.Tag("outcome") == "not_found");
        Assert.Contains(durations, item => item.Tag("storage.operation") == "get" && item.Tag("outcome") == "error");
    }

    [Fact]
    public async Task DependencyStatus_ReportsLastPublishedResult()
    {
        var measurements = new ConcurrentBag<CapturedMeasurement>();
        using var listener = CreateMeterListener(measurements);
        var publisher = new DependencyStatusPublisher();

        await publisher.PublishAsync(Report(HealthStatus.Healthy), default);
        await publisher.PublishAsync(Report(HealthStatus.Unhealthy), default);
        listener.RecordObservableInstruments();

        var status = Assert.Single(measurements, item =>
            item.Name == "bitfinance.dependency.status" && item.Tag("dependency") == "storage");
        Assert.Equal(0, status.Value);
    }

    private static HealthReport Report(HealthStatus status) => new(
        new Dictionary<string, HealthReportEntry>
        {
            ["storage"] = new(status, null, TimeSpan.Zero, null, null, ["dependency"])
        },
        TimeSpan.Zero);

    private static MeterListener CreateMeterListener(ConcurrentBag<CapturedMeasurement> measurements)
    {
        var listener = new MeterListener();
        listener.InstrumentPublished = (instrument, meterListener) =>
        {
            if (instrument.Meter.Name == BitFinanceTelemetry.MeterName)
                meterListener.EnableMeasurementEvents(instrument);
        };
        listener.SetMeasurementEventCallback<int>((instrument, value, tags, _) =>
            measurements.Add(CapturedMeasurement.Create(instrument, value, tags)));
        listener.SetMeasurementEventCallback<long>((instrument, value, tags, _) =>
            measurements.Add(CapturedMeasurement.Create(instrument, value, tags)));
        listener.SetMeasurementEventCallback<double>((instrument, value, tags, _) =>
            measurements.Add(CapturedMeasurement.Create(instrument, value, tags)));
        listener.Start();
        return listener;
    }

    private sealed record CapturedMeasurement(
        string Name,
        string? Unit,
        double Value,
        IReadOnlyDictionary<string, object?> Tags)
    {
        public string? Tag(string name) => Tags.TryGetValue(name, out var value) ? value?.ToString() : null;

        public static CapturedMeasurement Create<T>(
            Instrument instrument,
            T value,
            ReadOnlySpan<KeyValuePair<string, object?>> tags) where T : struct =>
            new(instrument.Name, instrument.Unit, Convert.ToDouble(value),
                tags.ToArray().ToDictionary(tag => tag.Key, tag => tag.Value));
    }
}
