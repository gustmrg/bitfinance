using BitFinance.API.Health;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Xunit;

namespace BitFinance.API.UnitTests;

public sealed class DistributedCacheHealthCheckTests
{
    [Fact]
    public async Task CheckHealthAsync_WhenCacheResponds_ReturnsHealthyWithoutWriting()
    {
        var cache = new StubDistributedCache();
        var healthCheck = new DistributedCacheHealthCheck(cache);

        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        Assert.Equal(HealthStatus.Healthy, result.Status);
        Assert.Equal(1, cache.ReadCount);
        Assert.Equal(0, cache.WriteCount);
        Assert.Equal(0, cache.RemoveCount);
    }

    [Fact]
    public async Task CheckHealthAsync_WhenCacheThrows_ReturnsSanitizedUnhealthyResult()
    {
        const string sentinel = "PRIVATE_CACHE_ENDPOINT_SENTINEL";
        var cache = new StubDistributedCache(new InvalidOperationException(sentinel));
        var healthCheck = new DistributedCacheHealthCheck(cache);

        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        Assert.Equal(HealthStatus.Unhealthy, result.Status);
        Assert.DoesNotContain(sentinel, result.Description);
        Assert.Null(result.Exception);
    }

    private sealed class StubDistributedCache(Exception? readException = null) : IDistributedCache
    {
        public int ReadCount { get; private set; }
        public int WriteCount { get; private set; }
        public int RemoveCount { get; private set; }

        public byte[]? Get(string key)
        {
            ReadCount++;
            return readException is null ? null : throw readException;
        }

        public Task<byte[]?> GetAsync(string key, CancellationToken token = default)
        {
            ReadCount++;
            return readException is null
                ? Task.FromResult<byte[]?>(null)
                : Task.FromException<byte[]?>(readException);
        }

        public void Refresh(string key)
        {
        }

        public Task RefreshAsync(string key, CancellationToken token = default) => Task.CompletedTask;

        public void Remove(string key)
        {
            RemoveCount++;
        }

        public Task RemoveAsync(string key, CancellationToken token = default)
        {
            RemoveCount++;
            return Task.CompletedTask;
        }

        public void Set(string key, byte[] value, DistributedCacheEntryOptions options)
        {
            WriteCount++;
        }

        public Task SetAsync(
            string key,
            byte[] value,
            DistributedCacheEntryOptions options,
            CancellationToken token = default)
        {
            WriteCount++;
            return Task.CompletedTask;
        }
    }
}
