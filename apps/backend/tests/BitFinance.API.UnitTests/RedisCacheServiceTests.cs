using BitFinance.Business.Entities;
using BitFinance.Data.Caching;
using FluentAssertions;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Xunit;

namespace BitFinance.API.UnitTests;

public class RedisCacheServiceTests
{
    private static RedisCacheService CreateService() =>
        new(new MemoryDistributedCache(Options.Create(new MemoryDistributedCacheOptions())),
            new DistributedCacheEntryOptions());

    [Fact]
    public async Task SetAsync_BillWithSeriesAndAttachments_DoesNotThrowOnReferenceCycles()
    {
        var cache = CreateService();
        var series = new BillSeries { Id = Guid.NewGuid(), Description = "Rent", IsActive = true };
        var bill = new Bill { Id = Guid.NewGuid(), Description = "Rent", Notes = "Apartment 12", BillSeries = series };
        series.Bills.Add(bill);
        bill.Attachments.Add(new Attachment { Id = Guid.NewGuid(), Bill = bill, FileName = "a", OriginalFileName = "a.pdf", ContentType = "application/pdf", StoragePath = "p" });

        await cache.SetAsync("bill", bill);
        var cached = await cache.GetAsync<Bill>("bill");

        cached!.Notes.Should().Be("Apartment 12");
        cached.BillSeries!.IsActive.Should().BeTrue();
        cached.Attachments.Should().ContainSingle();
    }

    [Fact]
    public async Task GetAsync_RepeatedHits_KeepReturningTheCachedValue()
    {
        var cache = CreateService();
        await cache.SetAsync("bill", new Bill { Id = Guid.NewGuid(), Description = "Water", Notes = "Meter 3" });

        for (var i = 0; i < 3; i++)
        {
            var cached = await cache.GetAsync<Bill>("bill");
            cached!.Notes.Should().Be("Meter 3");
        }
    }
}
