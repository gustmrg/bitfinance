namespace BitFinance.API.InputModels;

public record RegisterInputModel(string FirstName, string LastName, string Email, string Password, string ConfirmPassword);