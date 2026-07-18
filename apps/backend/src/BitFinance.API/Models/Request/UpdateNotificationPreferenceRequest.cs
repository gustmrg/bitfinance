using System.ComponentModel.DataAnnotations;

namespace BitFinance.API.Models.Request;

public sealed class UpdateNotificationPreferenceRequest
{
    [Required]
    public bool EmailBillRemindersEnabled { get; init; }
}
