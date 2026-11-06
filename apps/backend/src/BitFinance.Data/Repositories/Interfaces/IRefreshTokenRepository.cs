using BitFinance.Business.Entities;

namespace BitFinance.Data.Repositories.Interfaces;

public interface IRefreshTokenRepository : IRepository<RefreshToken, Guid>
{
    Task<RefreshToken?> GetByTokenHashAsync(string tokenHash);

    Task<List<RefreshToken>> GetActiveTokensByUserIdAsync(string userId);

    Task<List<RefreshToken>> GetTokensByFamilyIdAsync(Guid familyId);

    Task RevokeTokenFamilyAsync(Guid familyId, string reason);

    Task RevokeAllUserTokensAsync(string userId, string reason);

    /// <summary>Atomically persists a successor and revokes the still-active predecessor.</summary>
    Task<bool> TryRotateAsync(Guid currentTokenId, RefreshToken successor);

    Task<int> CleanupExpiredTokensAsync(DateTime olderThan);
}
