using System.ComponentModel.DataAnnotations;

namespace BitFinance.API.Attributes;

public class MaxFileSizeAttribute : ValidationAttribute
{
    private readonly long _maxFileSize;

    public MaxFileSizeAttribute(long maxFileSize)
    {
        _maxFileSize = maxFileSize;
    }
    
    protected override ValidationResult IsValid(object? value, ValidationContext validationContext)
    {
        if (value is IFormFile file)
        {
            if (file.Length > _maxFileSize)
            {
                var megabytes = _maxFileSize / 1024 / 1024;
                return new ValidationResult($"File size cannot exceed {megabytes}MB");
            }
        }

        return ValidationResult.Success!;
    }
}