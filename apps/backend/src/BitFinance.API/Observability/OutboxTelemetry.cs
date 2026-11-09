using System.Diagnostics.Metrics;
using BitFinance.Data.Contexts;
using Microsoft.EntityFrameworkCore;

namespace BitFinance.API.Observability;

public sealed class OutboxTelemetry : IDisposable
{
    private static readonly Counter<long> ItemCount = BitFinanceTelemetry.Meter.CreateCounter<long>(
        "bitfinance.notification.dispatch.item.count",
        unit: "{item}",
        description: "Aggregated notification dispatch outcomes.");

    private readonly SemaphoreSlim _refreshLock = new(1, 1);
    private DateTimeOffset _lastRefresh = DateTimeOffset.MinValue;
    private long _backlog;
    private double _oldestAgeSeconds;
    private long _deliveryBacklog;
    private double _oldestDeliveryAgeSeconds;

    public OutboxTelemetry()
    {
        BitFinanceTelemetry.Meter.CreateObservableGauge(
            "bitfinance.notification.outbox.backlog",
            () => _backlog,
            unit: "{item}",
            description: "Pending notification outbox messages.");
        BitFinanceTelemetry.Meter.CreateObservableGauge(
            "bitfinance.notification.outbox.oldest_age",
            () => _oldestAgeSeconds,
            unit: "s",
            description: "Age of the oldest pending notification outbox message.");
        BitFinanceTelemetry.Meter.CreateObservableGauge(
            "bitfinance.notification.delivery.backlog",
            () => _deliveryBacklog,
            unit: "{item}",
            description: "Pending or processing notification deliveries.");
        BitFinanceTelemetry.Meter.CreateObservableGauge(
            "bitfinance.notification.delivery.oldest_age",
            () => _oldestDeliveryAgeSeconds,
            unit: "s",
            description: "Age of the oldest pending or processing notification delivery.");
    }

    public int BacklogQueryCount { get; private set; }

    public void RecordOutboxFetched(int count) => Record("outbox", "fetched", count);

    public void RecordOutboxDelivered(int count = 1) => Record("outbox", "delivered", count);

    public void RecordOutboxRescheduled(int count = 1) => RecordFailure("outbox", "rescheduled", count);

    public void RecordOutboxTerminalFailure(int count = 1) => RecordFailure("outbox", "terminal_failure", count);

    public void RecordDeliveryFetched(int count) => Record("delivery", "fetched", count);

    public void RecordDeliveryDelivered(int count = 1) => Record("delivery", "delivered", count);

    public void RecordDeliveryRescheduled(int count = 1) => RecordFailure("delivery", "rescheduled", count);

    public void RecordDeliveryTerminalFailure(int count = 1) => RecordFailure("delivery", "terminal_failure", count);

    public async Task RefreshBacklogAsync(ApplicationDbContext dbContext, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        await RefreshBacklogAsync(
            async token =>
            {
                var outbox = await dbContext.NotificationOutboxMessages
                    .AsNoTracking()
                    .Where(message => message.ProcessedAt == null)
                    .GroupBy(_ => 1)
                    .Select(group => new OutboxBacklogSnapshot(
                        group.Count(),
                        group.Min(message => (DateTime?)message.CreatedAt)))
                    .SingleOrDefaultAsync(token);
                var deliveries = await dbContext.NotificationDeliveries
                    .AsNoTracking()
                    .Where(delivery => delivery.Status == BitFinance.Business.Enums.NotificationDeliveryStatus.Pending
                        || delivery.Status == BitFinance.Business.Enums.NotificationDeliveryStatus.Processing)
                    .GroupBy(_ => 1)
                    .Select(group => new DeliveryBacklogSnapshot(
                        group.Count(),
                        group.Min(delivery => (DateTime?)delivery.Notification.CreatedAt)))
                    .SingleOrDefaultAsync(token);
                return (outbox ?? new OutboxBacklogSnapshot(0, null)) with
                {
                    DeliveryCount = deliveries?.Count ?? 0,
                    OldestDelivery = deliveries?.Oldest
                };
            },
            now,
            cancellationToken);
    }

    public async Task TryRefreshBacklogAsync(
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        try
        {
            await RefreshBacklogAsync(dbContext, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            // The additional telemetry query must never prevent dispatching.
        }
    }

    public async Task TryRefreshBacklogAsync(
        Func<CancellationToken, Task<OutboxBacklogSnapshot>> query,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await RefreshBacklogAsync(query, now, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch
        {
            // The additional telemetry query must never prevent dispatching.
        }
    }

    public async Task RefreshBacklogAsync(
        Func<CancellationToken, Task<OutboxBacklogSnapshot>> query,
        DateTimeOffset now,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(query);

        if (now - _lastRefresh < TimeSpan.FromMinutes(1))
        {
            return;
        }

        await _refreshLock.WaitAsync(cancellationToken);
        try
        {
            if (now - _lastRefresh < TimeSpan.FromMinutes(1))
            {
                return;
            }

            // Back off after failures too: observability must not hammer a failing DB.
            _lastRefresh = now;
            BacklogQueryCount++;
            var backlog = await query(cancellationToken);

            _backlog = backlog.Count;
            _oldestAgeSeconds = backlog.Oldest is { } oldest
                ? Math.Max(0, (now.UtcDateTime - oldest).TotalSeconds)
                : 0;
            _deliveryBacklog = backlog.DeliveryCount;
            _oldestDeliveryAgeSeconds = backlog.OldestDelivery is { } oldestDelivery
                ? Math.Max(0, (now.UtcDateTime - oldestDelivery).TotalSeconds)
                : 0;
        }
        finally
        {
            _refreshLock.Release();
        }
    }

    public void Dispose()
    {
        _refreshLock.Dispose();
    }

    private static void RecordFailure(string stage, string outcome, int count)
    {
        WorkerTelemetry.MarkCurrentCycleFailed();
        Record(stage, outcome, count);
    }

    private static void Record(string stage, string outcome, int count)
    {
        if (count <= 0)
        {
            return;
        }

        try
        {
            ItemCount.Add(count,
                new KeyValuePair<string, object?>("stage", stage),
                new KeyValuePair<string, object?>("outcome", outcome));
        }
        catch
        {
            // Telemetry is best-effort and must never change dispatcher behavior.
        }
    }
}

public sealed record OutboxBacklogSnapshot(
    int Count,
    DateTime? Oldest,
    int DeliveryCount = 0,
    DateTime? OldestDelivery = null);

public sealed record DeliveryBacklogSnapshot(int Count, DateTime? Oldest);
