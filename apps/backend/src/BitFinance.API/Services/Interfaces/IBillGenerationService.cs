using BitFinance.Business.Entities;

namespace BitFinance.API.Services.Interfaces;

/// <summary>
/// Generates <see cref="Bill"/> occurrences from a <see cref="BillSeries"/> schedule.
/// Used at bill creation time and by the background worker to maintain a rolling generation horizon.
/// </summary>
public interface IBillGenerationService
{
    /// <summary>
    /// Generates pending occurrences for a series up to the supplied horizon date.
    /// </summary>
    /// <param name="series">The series to generate occurrences for.</param>
    /// <param name="horizonDate">The inclusive maximum due date for generated occurrences.</param>
    /// <param name="organization">The owning organization, used for status computation.</param>
    /// <returns>The number of occurrences generated.</returns>
    Task<int> GenerateOccurrencesAsync(BillSeries series, DateOnly horizonDate, Organization organization);
}
