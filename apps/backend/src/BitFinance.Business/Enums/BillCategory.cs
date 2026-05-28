namespace BitFinance.Business.Enums;

/// <summary>
/// Categorizes a bill by the type of expense it represents.
/// </summary>
public enum BillCategory
{
    /// <summary>
    /// Rent, mortgage, or other housing-related bills.
    /// </summary>
    Housing = 0,

    /// <summary>
    /// Vehicle payments, fuel, public transit, or commuting costs.
    /// </summary>
    Transportation = 1,

    /// <summary>
    /// Groceries, dining, or food delivery services.
    /// </summary>
    Food = 2,

    /// <summary>
    /// Electricity, water, gas, internet, or phone bills.
    /// </summary>
    Utilities = 3,

    /// <summary>
    /// Clothing and apparel purchases.
    /// </summary>
    Clothing = 4,

    /// <summary>
    /// Medical bills, prescriptions, or health-related services.
    /// </summary>
    Healthcare = 5,

    /// <summary>
    /// Health, auto, home, or other insurance premiums.
    /// </summary>
    Insurance = 6,

    /// <summary>
    /// Personal care or other individual expenses.
    /// </summary>
    Personal = 7,

    /// <summary>
    /// Loan repayments or credit card payments.
    /// </summary>
    Debt = 8,

    /// <summary>
    /// Contributions to savings accounts or investments.
    /// </summary>
    Savings = 9,

    /// <summary>
    /// Tuition, courses, or educational material expenses.
    /// </summary>
    Education = 10,

    /// <summary>
    /// Streaming services, events, or recreational activities.
    /// </summary>
    Entertainment = 11,

    /// <summary>
    /// Bills that do not fit into other categories.
    /// </summary>
    Miscellaneous = 12,

    /// <summary>
    /// Recurring subscription services (e.g., SaaS, memberships).
    /// </summary>
    Subscriptions = 13,

    /// <summary>
    /// Tax payments or tax-related obligations.
    /// </summary>
    Taxes = 14,

    /// <summary>
    /// Pet care, veterinary bills, or pet supplies.
    /// </summary>
    Pets = 15
}
