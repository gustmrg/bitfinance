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
    }

    public int BacklogQueryCount { get; private set; }

    public void RecordFetched(int count) => Record("fetched", count);

    public void RecordDelivered(int count = 1) => Record("delivered", count);

    public void RecordRescheduled(int count = 1) => Record("rescheduled", count);

    public void RecordTerminalFailure(int count = 1) => Record("terminal_failure", count);

    public async Task RefreshBacklogAsync(ApplicationDbContext dbContext, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        await RefreshBacklogAsync(
            async token =>
            {
                var result = await dbContext.NotificationOutboxMessages
                    .AsNoTracking()
                    .Where(message => message.ProcessedAt == null)
                    .GroupBy(_ => 1)
                    .Select(group => new OutboxBacklogSnapshot(
                        group.Count(),
                        group.Min(message => (DateTime?)message.CreatedAt)))
                    .SingleOrDefaultAsync(token);
                return result ?? new OutboxBacklogSnapshot(0, null);
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

            var backlog = await query(cancellationToken);

            _backlog = backlog.Count;
            _oldestAgeSeconds = backlog.Oldest is { } oldest
                ? Math.Max(0, (now.UtcDateTime - oldest).TotalSeconds)
                : 0;
            _lastRefresh = now;
            BacklogQueryCount++;
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

    private static void Record(string outcome, int count)
    {
        if (count <= 0)
        {
            return;
        }

        try
        {
            ItemCount.Add(count, new KeyValuePair<string, object?>("outcome", outcome));
        }
        catch
        {
            // Telemetry is best-effort and must never change dispatcher behavior.
        }
    }
}

public sealed record OutboxBacklogSnapshot(int Count, DateTime? Oldest);
