using BitFinance.API.Observability;

namespace BitFinance.API.Services;

public sealed class NotificationDispatchWorkerService(
    IServiceScopeFactory scopeFactory,
    ILogger<NotificationDispatchWorkerService> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(15);
    private DateOnly _lastCleanupDate;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await WorkerTelemetry.RunCycleAsync(
                    WorkerTelemetry.NotificationDispatch,
                    async cancellationToken =>
                    {
                        await using var scope = scopeFactory.CreateAsyncScope();
                        var dispatcher = scope.ServiceProvider.GetRequiredService<NotificationDispatcher>();
                        await dispatcher.ProcessAsync(cancellationToken);

                        var today = DateOnly.FromDateTime(DateTime.UtcNow);
                        if (_lastCleanupDate != today)
                        {
                            await dispatcher.CleanupAsync(cancellationToken);
                            _lastCleanupDate = today;
                        }
                    },
                    stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Notification dispatcher cycle failed");
            }

            try
            {
                await Task.Delay(PollInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
