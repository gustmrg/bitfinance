namespace BitFinance.API.Services.Interfaces;

public interface ITransactionRunner
{
    Task ExecuteAsync(Func<Task> operation, CancellationToken cancellationToken = default);
}
