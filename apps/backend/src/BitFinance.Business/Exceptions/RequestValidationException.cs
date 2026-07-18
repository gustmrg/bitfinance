namespace BitFinance.Business.Exceptions;

public sealed class RequestValidationException(string message) : ApplicationException(message);
