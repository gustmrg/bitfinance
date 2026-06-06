using System.ComponentModel.DataAnnotations;

namespace BitFinance.API.InputModels;

public record RegisterInputModel(
    [Required] string FirstName,
    [Required] string LastName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password);
