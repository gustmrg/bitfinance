using System.Linq.Expressions;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Contexts;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BitFinance.Data.Repositories;

public class AttachmentsRepository : IAttachmentsRepository
{
    private readonly ApplicationDbContext _dbContext;

    public AttachmentsRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Attachment>> GetAllAsync()
    {
        return await _dbContext.Attachments
            .AsNoTracking()
            .OrderByDescending(a => a.UploadedAt)
            .ToListAsync();
    }

    public async Task<Attachment?> GetByIdAsync(Guid id)
    {
        return await _dbContext.Attachments
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<Attachment> CreateAsync(Attachment entity)
    {
        _dbContext.Attachments.Add(entity);
        await _dbContext.SaveChangesAsync();
        return entity;
    }

    public async Task UpdateAsync(Attachment entity)
    {
        _dbContext.Attachments.Update(entity);
        await _dbContext.SaveChangesAsync();
    }

    public Task UpdateAsync(Attachment entity, params Expression<Func<Attachment, object>>[] properties)
    {
        throw new NotImplementedException();
    }

    public async Task DeleteAsync(Attachment entity)
    {
        _dbContext.Attachments.Remove(entity);
        await _dbContext.SaveChangesAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }

    public async Task<List<Attachment>> GetByBillIdAsync(Guid billId)
    {
        return await _dbContext.Attachments
            .AsNoTracking()
            .Where(a => a.BillId == billId)
            .OrderByDescending(a => a.UploadedAt)
            .ToListAsync();
    }

    public async Task<List<Attachment>> GetByExpenseIdAsync(Guid expenseId)
    {
        return await _dbContext.Attachments
            .AsNoTracking()
            .Where(a => a.ExpenseId == expenseId)
            .OrderByDescending(a => a.UploadedAt)
            .ToListAsync();
    }

    public async Task<Attachment?> GetUserAvatarAsync(string userId)
    {
        return await _dbContext.Attachments
            .FirstOrDefaultAsync(a => a.UserId == userId && a.AttachmentType == AttachmentType.UserAvatar);
    }

    public async Task<long> GetTotalStorageByOrganizationAsync(Guid organizationId)
    {
        return await _dbContext.Attachments
            .Where(a => a.OrganizationId == organizationId)
            .SumAsync(a => a.FileSizeInBytes);
    }
}
