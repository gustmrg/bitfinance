using BitFinance.Business.Entities;
using BitFinance.Data.Contexts;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BitFinance.API.UnitTests;

public sealed class NotificationPersistenceModelTests
{
    [Fact]
    public void Model_ConfiguresDurableNotificationTablesAndDeduplicationIndexes()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql("Host=localhost;Database=bitfinance_model;Username=postgres;Password=postgres")
            .Options;
        using var context = new ApplicationDbContext(options);

        Assert.Equal("notification_outbox_messages", context.Model.FindEntityType(typeof(NotificationOutboxMessage))?.GetTableName());
        Assert.Equal("notifications", context.Model.FindEntityType(typeof(Notification))?.GetTableName());
        Assert.Equal("notification_deliveries", context.Model.FindEntityType(typeof(NotificationDelivery))?.GetTableName());
        Assert.Equal("notification_preferences", context.Model.FindEntityType(typeof(NotificationPreference))?.GetTableName());

        var outbox = context.Model.FindEntityType(typeof(NotificationOutboxMessage));
        Assert.Contains(outbox!.GetIndexes(), index => index.IsUnique
            && index.Properties.Select(property => property.Name).SequenceEqual([nameof(NotificationOutboxMessage.DeduplicationKey)]));

        var notification = context.Model.FindEntityType(typeof(Notification));
        Assert.Contains(notification!.GetIndexes(), index => index.IsUnique
            && index.Properties.Select(property => property.Name).SequenceEqual([
                nameof(Notification.SourceEventId), nameof(Notification.RecipientUserId)]));
    }
}
