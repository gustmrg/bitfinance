using BitFinance.API.Services.Interfaces;
using BitFinance.Data.Contexts;

namespace BitFinance.API.Services;

public sealed class EfTransactionRunner(ApplicationDbContext dbContext) : ITransactionRunner
{
    public async Task ExecuteAsync(Func<Task> operation, CancellationToken cancellationToken = default)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        await operation();
        await transaction.CommitAsync(cancellationToken);
    }
}
