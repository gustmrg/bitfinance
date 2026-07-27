namespace BitFinance.Business.Enums;

/// <summary>
/// Represents how an expense was paid.
/// </summary>
public enum PaymentMethod
{
    Cash = 0,
    CreditCard = 1,
    DebitCard = 2,
    Pix = 3,
    BankTransfer = 4,
    Boleto = 5,
    Other = 6
}
