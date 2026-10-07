using System.Net;
using System.Net.Http.Headers;
using BitFinance.MCP.Health;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Xunit;

namespace BitFinance.MCP.UnitTests;

public sealed class BackendReadinessHealthCheckTests
{
    [Theory]
    [InlineData(HttpStatusCode.OK, HealthStatus.Healthy)]
    [InlineData(HttpStatusCode.ServiceUnavailable, HealthStatus.Unhealthy)]
    public async Task CheckHealthAsync_MapsBackendStatusWithoutAuthentication(
        HttpStatusCode statusCode,
        HealthStatus expectedStatus)
    {
        var handler = new StubHandler(_ => new HttpResponseMessage(statusCode));
        var healthCheck = CreateHealthCheck(handler);

        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        Assert.Equal(expectedStatus, result.Status);
        Assert.Equal("/health/ready", handler.RequestUri?.AbsolutePath);
        Assert.Null(handler.Authorization);
    }

    [Fact]
    public async Task CheckHealthAsync_WhenRequestTimesOut_ReturnsSanitizedUnhealthy()
    {
        const string sentinel = "PRIVATE_TIMEOUT_DETAIL_SENTINEL";
        var handler = new StubHandler(_ => throw new TaskCanceledException(sentinel));
        var healthCheck = CreateHealthCheck(handler);

        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        Assert.Equal(HealthStatus.Unhealthy, result.Status);
        Assert.DoesNotContain(sentinel, result.Description);
        Assert.Null(result.Exception);
    }

    [Fact]
    public async Task CheckHealthAsync_WhenNetworkFails_ReturnsSanitizedUnhealthy()
    {
        const string sentinel = "PRIVATE_BACKEND_HOST_SENTINEL";
        var handler = new StubHandler(_ => throw new HttpRequestException(sentinel));
        var healthCheck = CreateHealthCheck(handler);

        var result = await healthCheck.CheckHealthAsync(new HealthCheckContext());

        Assert.Equal(HealthStatus.Unhealthy, result.Status);
        Assert.DoesNotContain(sentinel, result.Description);
        Assert.Null(result.Exception);
    }

    private static BackendReadinessHealthCheck CreateHealthCheck(HttpMessageHandler handler)
    {
        var client = new HttpClient(handler)
        {
            BaseAddress = new Uri("http://bitfinance-api:8080")
        };
        return new BackendReadinessHealthCheck(new StubHttpClientFactory(client));
    }

    private sealed class StubHttpClientFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name)
        {
            Assert.Equal(BackendReadinessHealthCheck.ClientName, name);
            return client;
        }
    }

    private sealed class StubHandler(
        Func<HttpRequestMessage, HttpResponseMessage> responseFactory) : HttpMessageHandler
    {
        public Uri? RequestUri { get; private set; }
        public AuthenticationHeaderValue? Authorization { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            RequestUri = request.RequestUri;
            Authorization = request.Headers.Authorization;
            return Task.FromResult(responseFactory(request));
        }
    }
}
