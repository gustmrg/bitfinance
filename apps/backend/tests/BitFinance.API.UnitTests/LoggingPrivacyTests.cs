using BitFinance.API.Middlewares;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Xunit;

namespace BitFinance.API.UnitTests;

public sealed class LoggingPrivacyTests
{
    [Fact]
    public async Task GlobalExceptionHandler_DoesNotLogRequestQuery()
    {
        const string querySentinel = "PRIVATE_REQUEST_QUERY_SENTINEL";
        var logger = new RecordingLogger<GlobalExceptionHandlerMiddleware>();
        var middleware = new GlobalExceptionHandlerMiddleware(logger);
        var context = new DefaultHttpContext();
        context.Request.QueryString = new QueryString($"?description={querySentinel}");
        context.Response.Body = new MemoryStream();
        var exception = new InvalidOperationException("Safe failure category.");

        await middleware.InvokeAsync(context, _ => throw exception);

        var entry = Assert.Single(logger.Entries);
        Assert.Same(exception, entry.Exception);
        Assert.Equal(1000, entry.EventId.Id);
        Assert.Equal("UnhandledRequestException", entry.EventId.Name);
        Assert.DoesNotContain(querySentinel, entry.Message);
        Assert.DoesNotContain(querySentinel, entry.Exception?.ToString());

        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body);
        Assert.DoesNotContain(querySentinel, await reader.ReadToEndAsync());
    }

    private sealed class RecordingLogger<T> : ILogger<T>
    {
        public List<LogEntry> Entries { get; } = [];

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            Entries.Add(new LogEntry(logLevel, eventId, exception, formatter(state, exception)));
        }
    }

    private sealed record LogEntry(
        LogLevel Level,
        EventId EventId,
        Exception? Exception,
        string Message);
}
