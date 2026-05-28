using BitFinance.Business.Enums;

namespace BitFinance.API.Models.Request;

public record CreateBillRequest(
    string Description, 
    string Category, 
    string Status, 
    DateTime DueDate, 
    DateTime? PaymentDate, 
    decimal AmountDue, 
    decimal? AmountPaid);