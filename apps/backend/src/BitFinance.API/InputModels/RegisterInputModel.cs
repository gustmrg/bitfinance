using System.ComponentModel.DataAnnotations;

namespace BitFinance.API.InputModels;

public record RegisterInputModel(
    [property: Required] string FirstName,
    [property: Required] string LastName,
    [property: Required, EmailAddress] string Email,
    [property: Required, MinLength(8)] string Password);
