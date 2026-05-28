using System.Collections.Concurrent;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;

namespace BitFinance.Data.Caching;

public class RedisCacheService : ICacheService
{
    private static ConcurrentDictionary<string, bool> CacheKeys = new();
    private readonly IDistributedCache _cache;
    private readonly DistributedCacheEntryOptions _options;

    public RedisCacheService(IDistributedCache cache, DistributedCacheEntryOptions options)
    {
        _cache = cache;
        _options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(3600),
            SlidingExpiration = TimeSpan.FromSeconds(1800)
        };
    }

    public string GenerateKey<T>(string entityId)
    {
        StringBuilder cacheKeyBuilder = new StringBuilder();
        var entityType = typeof(T);
        string entityNamespacePrefix = "_" + entityType.Namespace;
        string assemblyVersionPrefix = "_" + entityType.Assembly.GetName().Version;
        string entityTypeNamePrefix = "_" + entityType.Name;
        
        cacheKeyBuilder.Append(entityNamespacePrefix);
        cacheKeyBuilder.Append(assemblyVersionPrefix);
        cacheKeyBuilder.Append(entityTypeNamePrefix);

        if (!string.IsNullOrWhiteSpace(entityId))
        {
            cacheKeyBuilder.Append($"_{entityId}");
        }
        
        return cacheKeyBuilder.ToString();
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default) 
        where T : class
    {
        string? cachedValue = await _cache.GetStringAsync(key, cancellationToken);

        if (cachedValue is null)
        {
            return null;
        }

        T? value = JsonSerializer.Deserialize<T>(cachedValue);
        
        await SetAsync(key, cachedValue, cancellationToken);

        return value;
    }

    public async Task<T> GetAsync<T>(string key, Func<Task<T>> factory, CancellationToken cancellationToken = default)
        where T : class
    {
        T? cachedValue = await GetAsync<T>(key, cancellationToken);

        if (cachedValue is not null)
        {
            return cachedValue;
        }

        cachedValue = await factory();

        await SetAsync(key, cachedValue, cancellationToken);
        
        return cachedValue;
    }

    public async Task SetAsync<T>(string key, T value, CancellationToken cancellationToken = default) 
        where T : class
    {
        string cacheValue = JsonSerializer.Serialize(value);

        await _cache.SetStringAsync(key, cacheValue, _options, cancellationToken);

        CacheKeys.TryAdd(key, true);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan expirationTime, CancellationToken cancellationToken = default)
        where T : class
    {
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expirationTime
        };
        
        string cacheValue = JsonSerializer.Serialize(value);

        await _cache.SetStringAsync(key, cacheValue,  options, cancellationToken);

        CacheKeys.TryAdd(key, true);
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        await _cache.RemoveAsync(key, cancellationToken);

        CacheKeys.TryRemove(key, out bool _);
    }

    public async Task RemoveByPrefixAsync(string prefixKey, CancellationToken cancellationToken = default)
    {
        // foreach (string key in CacheKeys.Keys)
        // {
        //     if (key.StartsWith(prefixKey))
        //     {
        //         await RemoveAsync(key, cancellationToken);
        //     }
        // }

        IEnumerable<Task> tasks = CacheKeys.Keys
            .Where(k => k.StartsWith(prefixKey))
            .Select(k => RemoveAsync(k, cancellationToken));

        await Task.WhenAll(tasks);
    }
}