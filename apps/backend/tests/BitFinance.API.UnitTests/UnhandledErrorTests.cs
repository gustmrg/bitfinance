using System.Net;
using BitFinance.API.Controllers;
using BitFinance.API.Middlewares;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Exceptions;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BitFinance.API.UnitTests;

/// <summary>
/// An unexpected failure must surface as a server error, not as a 400 that blames the client.
/// </summary>
public class UnhandledErrorTests
{
    [Fact]
    public async Task ExpensesController_RepositoryFailure_ReachesTheGlobalHandler()
    {
        var repository = new Mock<IExpensesRepository>();
        repository
            .Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<Guid>()))
            .ThrowsAsync(new InvalidOperationException("Database unavailable"));
        var controller = new ExpensesController(
            Mock.Of<ILogger<ExpensesController>>(),
            repository.Object,
            Mock.Of<IExpensesService>(),
            Mock.Of<IAttachmentService>());

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => controller.GetExpenseById(Guid.NewGuid(), Guid.NewGuid()));
    }

    [Fact]
    public async Task GlobalExceptionHandler_UnexpectedFailure_ReturnsInternalServerErrorWithoutDetails()
    {
        var (statusCode, body) = await HandleAsync(new InvalidOperationException("secret database detail"));

        Assert.Equal(HttpStatusCode.InternalServerError, statusCode);
        Assert.DoesNotContain("secret database detail", body);
    }

    [Fact]
    public async Task GlobalExceptionHandler_ValidationFailure_ReturnsBadRequest()
    {
        var (statusCode, _) = await HandleAsync(new RequestValidationException("File type is not allowed."));

        Assert.Equal(HttpStatusCode.BadRequest, statusCode);
    }

    private static async Task<(HttpStatusCode StatusCode, string Body)> HandleAsync(Exception exception)
    {
        var middleware = new GlobalExceptionHandlerMiddleware(
            Mock.Of<ILogger<GlobalExceptionHandlerMiddleware>>());
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await middleware.InvokeAsync(context, _ => throw exception);

        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body);
        return ((HttpStatusCode)context.Response.StatusCode, await reader.ReadToEndAsync());
    }
}
