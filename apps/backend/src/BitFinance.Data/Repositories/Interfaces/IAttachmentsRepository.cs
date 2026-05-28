using BitFinance.Business.Entities;

namespace BitFinance.Data.Repositories.Interfaces;

public interface IAttachmentsRepository : IRepository<Attachment, Guid>
{
    Task<List<Attachment>> GetByBillIdAsync(Guid billId);
    Task<List<Attachment>> GetByExpenseIdAsync(Guid expenseId);
    Task<Attachment?> GetUserAvatarAsync(string userId);
    Task<long> GetTotalStorageByOrganizationAsync(Guid organizationId);
}
