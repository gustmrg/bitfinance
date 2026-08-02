using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Repositories.Interfaces;
using BitFinance.Data.Contexts;
using BitFinance.API.Observability;
using Microsoft.EntityFrameworkCore;

namespace BitFinance.API.Services;

public class BillStatusWorkerService : BackgroundService
{
    private readonly ILogger<BillStatusWorkerService> _logger;
    private readonly IServiceScopeFactory _serviceScopeFactory;

    public BillStatusWorkerService(ILogger<BillStatusWorkerService> logger, IServiceScopeFactory serviceScopeFactory)
    {
        _logger = logger;
        _serviceScopeFactory = serviceScopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            if (_logger.IsEnabled(LogLevel.Information))
            {
                _logger.LogInformation("Worker running at: {time}", DateTimeOffset.Now);
            }

            try
            {
                await WorkerTelemetry.RunCycleAsync(
                    WorkerTelemetry.BillStatus,
                    async _ =>
                    {
                        await GenerateScheduledBills();
                        await UpdateUpcomingBills();
                        await UpdateDueBills();
                        await EnqueueBillReminders();
                    },
                    stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unhandled error in bill status worker cycle");
            }
            
            var now = DateTime.UtcNow;
            var nextHour = now.Date.AddHours(now.Hour + 1);
            var delay = nextHour - now;

            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private async Task EnqueueBillReminders()
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var organizationsRepository = scope.ServiceProvider.GetRequiredService<IOrganizationsRepository>();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var organizations = await organizationsRepository.GetAllAsync();

        foreach (var organization in organizations)
        {
            var today = organization.GetCurrentLocalDate();
            var dueSoon = today.AddDays(3);
            var bills = await dbContext.Bills.AsNoTracking()
                .Where(bill => bill.OrganizationId == organization.Id
                    && bill.Status != BillStatus.Paid
                    && bill.Status != BillStatus.Cancelled
                    && (bill.DueDate == dueSoon
                        || bill.DueDate == today
                        || (bill.DueDate < today && bill.Status == BillStatus.Overdue)))
                .ToListAsync();

            foreach (var bill in bills)
            {
                var type = NotificationRules.GetBillReminderType(bill.DueDate, today, bill.Status);
                if (type is null) continue;

                await notificationService.EnqueueAsync(
                    organization.Id,
                    type.Value,
                    bill.Id.ToString(),
                    $"bill:{bill.Id:N}:{type.Value}",
                    new NotificationEventPayload(
                        BillId: bill.Id,
                        BillDescription: bill.Description,
                        AmountDue: bill.AmountDue,
                        DueDate: bill.DueDate));
            }
        }
    }
    
    private async Task GenerateScheduledBills()
    {
        using IServiceScope scope = _serviceScopeFactory.CreateScope();
        var organizationsRepository = scope.ServiceProvider.GetRequiredService<IOrganizationsRepository>();
        var billSeriesRepository = scope.ServiceProvider.GetRequiredService<IBillSeriesRepository>();
        var billGenerationService = scope.ServiceProvider.GetRequiredService<IBillGenerationService>();

        try
        {
            var organizations = await organizationsRepository.GetAllAsync();
            var totalGenerated = 0;

            foreach (var organization in organizations)
            {
                try
                {
                    var activeSeries = await billSeriesRepository.GetAllActiveByOrganizationAsync(organization.Id);
                    if (activeSeries.Count == 0)
                        continue;

                    var horizon = BillGenerationService.GetRollingHorizon(organization);

                    foreach (var series in activeSeries)
                    {
                        var generated = await billGenerationService.GenerateOccurrencesAsync(series, horizon, organization);
                        totalGenerated += generated;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while generating scheduled bills for an organization.");
                }
            }

            if (totalGenerated > 0)
            {
                _logger.LogInformation("Generated {TotalGenerated} scheduled bills across {OrgCount} organizations at {DateTime}",
                    totalGenerated, organizations.Count, DateTimeOffset.Now);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while generating scheduled bills");
        }
    }

    private async Task UpdateUpcomingBills()
    {
        using IServiceScope scope = _serviceScopeFactory.CreateScope();
        var organizationsRepository = scope.ServiceProvider.GetRequiredService<IOrganizationsRepository>();
        var billsRepository = scope.ServiceProvider.GetRequiredService<IBillsRepository>();

        try
        {
            var organizations = await organizationsRepository.GetAllAsync();
            var totalBillsUpdated = 0;
            
            foreach (var organization in organizations)
            {
                try
                {
                    var billsUpdatedForOrg = await ProcessUpcomingBillsForOrganization(organization, billsRepository);
                    totalBillsUpdated += billsUpdatedForOrg;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while processing upcoming bills for an organization.");
                }
            }
            
            _logger.LogInformation("Updated {TotalBills} upcoming bills across {OrgCount} organizations at {DateTime}", 
                totalBillsUpdated, organizations.Count, DateTimeOffset.Now);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while updating upcoming bills");
        }
    }
    
    private async Task UpdateDueBills()
    {
        using IServiceScope scope = _serviceScopeFactory.CreateScope();
        var organizationsRepository = scope.ServiceProvider.GetRequiredService<IOrganizationsRepository>();
        var billsRepository = scope.ServiceProvider.GetRequiredService<IBillsRepository>();

        try
        {
            var organizations = await organizationsRepository.GetAllAsync();
            var totalBillsUpdated = 0;

            foreach (var organization in organizations)
            {
                try
                {
                    var billsUpdatedForOrg = await ProcessDueBillsForOrganization(organization, billsRepository);
                    totalBillsUpdated += billsUpdatedForOrg;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error while processing due bills for an organization.");
                }
            }
            
            _logger.LogInformation("Updated {TotalBills} due bills across {OrgCount} organizations at {DateTime}", 
                totalBillsUpdated, organizations.Count, DateTimeOffset.Now);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while updating due bills");
        }
    }
    
    private async Task<int> ProcessUpcomingBillsForOrganization(Organization organization, IBillsRepository billsRepository)
    {
        var todayInOrgTimeZone = organization.GetCurrentLocalDate();
        var upcomingBills = await billsRepository.GetAllByOrganizationAndStatusAsync(
            organization.Id, BillStatus.Upcoming);

        var billsToUpdate = new List<Bill>();

        foreach (var bill in upcomingBills)
        {
            var newStatus = bill.Status;
            
            if (bill.DueDate == todayInOrgTimeZone)
            {
                newStatus = BillStatus.Due;
            }
            else if (bill.DueDate < todayInOrgTimeZone)
            {
                newStatus = BillStatus.Overdue;
            }

            if (newStatus != bill.Status)
            {
                bill.Status = newStatus;
                bill.UpdatedAt = DateTime.UtcNow;
                billsToUpdate.Add(bill);
            }
        }

        if (billsToUpdate.Count > 0)
        {
            await billsRepository.UpdateRangeAsync(billsToUpdate);
            
            _logger.LogInformation("Updated {BillCount} upcoming bills for an organization.", billsToUpdate.Count);
        }
        
        return billsToUpdate.Count;
    }

    private async Task<int> ProcessDueBillsForOrganization(Organization organization, IBillsRepository billsRepository)
    {
        var todayInOrgTimeZone = organization.GetCurrentLocalDate();
        var upcomingBills = await billsRepository.GetAllByOrganizationAndStatusAsync(
            organization.Id, BillStatus.Due);
        
        var billsToUpdate = new List<Bill>();

        foreach (var bill in upcomingBills.Where(bill => bill.DueDate < todayInOrgTimeZone))
        {
            bill.Status = BillStatus.Overdue;
            bill.UpdatedAt = DateTime.UtcNow;
            billsToUpdate.Add(bill);
        }

        if (billsToUpdate.Count <= 0) return billsToUpdate.Count;
        await billsRepository.UpdateRangeAsync(billsToUpdate);
            
        _logger.LogInformation("Updated {BillCount} due bills for an organization.", billsToUpdate.Count);

        return billsToUpdate.Count;
    }
}
