using System.Net;
using System.Text.Json;
using BitFinance.API.Models.Response;
using Microsoft.AspNetCore.Mvc;

namespace BitFinance.API.Middlewares;

public class GlobalExceptionHandlerMiddleware : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);

            ExceptionResponse response = e switch
            {
                ApplicationException _ => new ExceptionResponse(HttpStatusCode.BadRequest, "Application error occurred."),
                UnauthorizedAccessException _ => new ExceptionResponse(HttpStatusCode.Unauthorized, "Unauthorized."),
                _ => new ExceptionResponse(HttpStatusCode.InternalServerError, "Internal server error. Please retry later.")
            };

            context.Response.StatusCode = (int)response.StatusCode;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(response);
        }
    }
}