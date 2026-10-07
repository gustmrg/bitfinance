using System.Net;
using BitFinance.MCP.Services;
using Xunit;

namespace BitFinance.MCP.UnitTests;

public sealed class BitFinanceApiExceptionTests
{
    [Fact]
    public void Constructor_RemovesQueryAndFragmentFromPath()
    {
        const string querySentinel = "PRIVATE_QUERY_SENTINEL";
        const string fragmentSentinel = "PRIVATE_FRAGMENT_SENTINEL";

        var exception = new BitFinanceApiException(
            HttpStatusCode.BadRequest,
            HttpMethod.Get.Method,
            $"/api/v1/expenses?description={querySentinel}#{fragmentSentinel}");

        Assert.Equal("/api/v1/expenses", exception.Path);
        Assert.DoesNotContain(querySentinel, exception.Message);
        Assert.DoesNotContain(querySentinel, exception.ToString());
        Assert.DoesNotContain(fragmentSentinel, exception.Message);
        Assert.DoesNotContain(fragmentSentinel, exception.ToString());
    }

    [Fact]
    public void Constructor_HasNoResponseBodySurface()
    {
        const string responseSentinel = "PRIVATE_RESPONSE_BODY_SENTINEL";

        var exception = new BitFinanceApiException(
            HttpStatusCode.InternalServerError,
            HttpMethod.Post.Method,
            "/api/v1/identity/login");

        Assert.DoesNotContain(responseSentinel, exception.Message);
        Assert.DoesNotContain(responseSentinel, exception.ToString());
        Assert.Null(typeof(BitFinanceApiException).GetProperty("ResponseBody"));
    }
}
