using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Contexts;
using Microsoft.EntityFrameworkCore;

namespace BitFinance.API.Data;

public static class SeedData
{
    public static void SeedDatabase(WebApplication app)
    {
        var isDatabaseSeedEnabled = app.Configuration.GetValue<bool>("AppSettings:DatabaseSeedEnabled");

        if (!isDatabaseSeedEnabled)
        {
            Console.WriteLine("Database seeding is disabled. Skipping...");
            return; 
        }
    
        using var scope = app.Services.CreateScope();
        var services = scope.ServiceProvider;
    
        try
        {
            var context = services.GetRequiredService<ApplicationDbContext>();
            context.Database.Migrate();
            context.Database.EnsureCreated();
            Initialize(services);
        }
        catch (Exception ex)
        {
            var logger = services.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "An error occurred seeding the DB: {ExceptionMessage}", ex.Message);
            Console.WriteLine("An error has occurred and could not seed database");
        }
    }
    
    private static void Initialize(IServiceProvider serviceProvider)
    {
        using (var dbContext = new ApplicationDbContext(
                   serviceProvider.GetRequiredService<DbContextOptions<ApplicationDbContext>>()))
        {
            // Look for any Bills.
            if (dbContext.Bills.Any())
            {
                return;   // DB has been seeded
            }

            PopulateTestData(dbContext);
        }
    }
    
    private static void PopulateTestData(ApplicationDbContext dbContext)
    {
        foreach (var item in dbContext.Bills)
        {
            dbContext.Remove(item);
        }
        dbContext.SaveChanges();

        Bill bill1 = new()
        {
            Description = "Internet Bill",
            Category = BillCategory.Utilities,
            Status = BillStatus.Overdue,
            CreatedAt = DateTime.UtcNow.AddHours(-3),
            DueDate = DateOnly.FromDateTime(DateTime.UtcNow),
            PaymentDate = null,
            AmountDue = 120M,
            AmountPaid = null
        };
        
        Bill bill2 = new()
        {
            Description = "Electricity Bill",
            Category = BillCategory.Utilities,
            Status = BillStatus.Paid,
            CreatedAt = DateTime.UtcNow.AddHours(-3),
            DueDate = DateOnly.FromDateTime(DateTime.UtcNow),
            PaymentDate = DateTime.Now.ToUniversalTime().AddHours(-3),
            AmountDue = 800M,
            AmountPaid = 800M
        };
        
        Bill bill3 = new()
        {
            Description = "Health Insurance",
            Category = BillCategory.Healthcare,
            Status = BillStatus.Paid,
            CreatedAt = DateTime.UtcNow.AddHours(-3),
            DueDate = DateOnly.FromDateTime(DateTime.UtcNow),
            PaymentDate = DateTime.UtcNow.AddHours(-3).AddDays(-2),
            AmountDue = 500M,
            AmountPaid = 500M
        };
        
        Bill bill4 = new()
        {
            Description = "Car Insurance",
            Category = BillCategory.Insurance,
            Status = BillStatus.Due,
            CreatedAt = DateTime.UtcNow.AddHours(-3),
            DueDate = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(10),
            AmountDue = 1000M
        };
        
        Bill bill5 = new()
        {
            Description = "Streaming Subscription",
            Category = BillCategory.Entertainment,
            Status = BillStatus.Due,
            CreatedAt = DateTime.UtcNow.AddHours(-3),
            DueDate = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(15),
            AmountDue = 49.90M
        };

        Bill bill6 = new() 
        {
            Description = "Rent Payment",
            Category = BillCategory.Housing,
            Status = BillStatus.Paid,
            CreatedAt = DateTime.UtcNow.AddHours(-3),
            DueDate = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-2),
            PaymentDate = DateTime.UtcNow.AddHours(-3),
            AmountDue = 2000M,
            AmountPaid = 2000M
        };

        Bill bill7 = new()
        {
            Description = "Online Course Subscription",
            Category = BillCategory.Education,
            Status = BillStatus.Cancelled,
            CreatedAt = DateTime.UtcNow.AddHours(-3),
            DueDate = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(20),
            AmountDue = 250M
        };
        
        dbContext.AddRange(bill1, bill2, bill3, bill4, bill5, bill6, bill7);

        dbContext.SaveChanges();
    }
}