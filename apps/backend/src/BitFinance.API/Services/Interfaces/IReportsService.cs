using BitFinance.API.Models.Response;
using BitFinance.Business.Entities;

namespace BitFinance.API.Services.Interfaces;

/// <summary>
/// Builds aggregated spending reports for an organization.
/// </summary>
public interface IReportsService
{
    /// <summary>
    /// Aggregates expenses and bills per month and per category for the last <paramref name="months"/> months,
    /// including the current month, using the organization's time zone.
    /// </summary>
    Task<ReportResponse> GetReportAsync(Organization organization, int months);
}
