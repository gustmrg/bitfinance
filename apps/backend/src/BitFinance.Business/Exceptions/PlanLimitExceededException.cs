namespace BitFinance.Business.Exceptions;

public class PlanLimitExceededException(string message) : Exception(message);
