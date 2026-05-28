namespace BitFinance.Business.Enums;

/// <summary>
/// Categorizes an expense by the type of spending it represents.
/// </summary>
public enum ExpenseCategory
{
    /// <summary>
    /// Rent, mortgage, or other housing-related expenses.
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
    /// Electricity, water, gas, internet, or phone expenses.
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
    /// Travel and vacation expenses.
    /// </summary>
    Travel = 12,

    /// <summary>
    /// Pet care, veterinary bills, or pet supplies.
    /// </summary>
    Pets = 13,

    /// <summary>
    /// Gifts and donations.
    /// </summary>
    Gifts = 14,

    /// <summary>
    /// Expenses that do not fit into other categories.
    /// </summary>
    Miscellaneous = 15,

    /// <summary>
    /// Recurring subscription services (e.g., SaaS, memberships).
    /// </summary>
    Subscriptions = 16,

    /// <summary>
    /// Tax payments or tax-related expenses.
    /// </summary>
    Taxes = 17
}
