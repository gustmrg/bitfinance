using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Repositories.Interfaces;

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
                await UpdateUpcomingBills();
                await UpdateDueBills();
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
                    _logger.LogError(ex,
                        "Error while processing upcoming bills for organization {OrgId} ({OrgName}) with timezone {TimeZone}",
                        organization.Id, organization.Name, organization.TimeZoneId);
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
                    _logger.LogError(ex,
                        "Error while processing due bills for organization {OrgId} ({OrgName}) with timezone {TimeZone}",
                        organization.Id, organization.Name, organization.TimeZoneId);
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
            
            _logger.LogInformation("Updated {BillCount} bills for organization {OrgId} ({OrgName}) in timezone {TimeZone}", 
                billsToUpdate.Count, organization.Id, organization.Name, organization.TimeZoneId);
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
            
        _logger.LogInformation("Updated {BillCount} bills for organization {OrgId} ({OrgName}) in timezone {TimeZone}", 
            billsToUpdate.Count, organization.Id, organization.Name, organization.TimeZoneId);

        return billsToUpdate.Count;
    }
}
