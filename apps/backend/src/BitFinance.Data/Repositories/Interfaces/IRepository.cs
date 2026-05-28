using System.Linq.Expressions;

namespace BitFinance.Data.Repositories.Interfaces;

public interface IRepository<T, TId> 
    where TId : IEquatable<TId> 
    where T : class
{
    Task<List<T>> GetAllAsync();
    Task<T?> GetByIdAsync(TId id);
    Task<T> CreateAsync(T entity);
    Task UpdateAsync(T entity);
    Task UpdateAsync(T entity, params Expression<Func<T, object>>[] properties);
    Task DeleteAsync(T entity);
    Task SaveChangesAsync();
}