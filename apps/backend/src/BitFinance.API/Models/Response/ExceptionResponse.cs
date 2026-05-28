using System.Net;

namespace BitFinance.API.Models.Response;

public record ExceptionResponse(HttpStatusCode StatusCode, string Description);