import type { Bill, Expense, Member, Organization, User } from "./types";

const day = (offset: number) => {
  const value = new Date();
  value.setHours(12, 0, 0, 0);
  value.setDate(value.getDate() + offset);
  return value.toISOString();
};

export const demoUser: User = {
  id: "user-01",
  firstName: "Marina",
  lastName: "Costa",
  email: "marina@bitfinance.dev",
  avatarUrl: "https://i.pravatar.cc/96?img=47",
};

export const demoOrganizations: Organization[] = [
  {
    id: "org-01",
    name: "Costa household",
    timezone: "America/Fortaleza",
    budget: 5200,
    createdAt: day(-420),
  },
  {
    id: "org-02",
    name: "Side project",
    timezone: "America/Sao_Paulo",
    budget: 1800,
    createdAt: day(-120),
  },
];

export const demoMembers: Member[] = [
  { id: "member-01", name: "Marina Costa", email: "marina@bitfinance.dev", role: "Owner", joinedAt: day(-420), initials: "MC" },
  { id: "member-02", name: "Rafael Costa", email: "rafael@bitfinance.dev", role: "Admin", joinedAt: day(-390), initials: "RC" },
  { id: "member-03", name: "Joana Lima", email: "joana@bitfinance.dev", role: "Member", joinedAt: day(-68), initials: "JL" },
];

export const demoBills: Bill[] = [
  { id: "bill-01", description: "Apartment rent", category: "housing", status: "upcoming", amountDue: 1800, amountPaid: null, dueDate: day(2), paymentDate: null, seriesType: "recurring", frequency: "monthly", occurrence: null, totalOccurrences: null, seriesActive: true, documents: [] },
  { id: "bill-02", description: "Electricity", category: "utilities", status: "due", amountDue: 218.45, amountPaid: null, dueDate: day(-1), paymentDate: null, seriesType: null, frequency: null, occurrence: null, totalOccurrences: null, seriesActive: false, documents: [{ id: "doc-01", fileName: "enel-june-invoice.pdf", fileCategory: "Boleto" }] },
  { id: "bill-03", description: "Health insurance", category: "healthcare", status: "upcoming", amountDue: 449.9, amountPaid: null, dueDate: day(6), paymentDate: null, seriesType: "recurring", frequency: "monthly", occurrence: null, totalOccurrences: null, seriesActive: true, documents: [] },
  { id: "bill-04", description: "Flight installment", category: "transportation", status: "paid", amountDue: 320, amountPaid: 320, dueDate: day(-8), paymentDate: day(-9), seriesType: "installment", frequency: "monthly", occurrence: 4, totalOccurrences: 10, seriesActive: true, documents: [] },
  { id: "bill-05", description: "Design software", category: "subscriptions", status: "upcoming", amountDue: 89, amountPaid: null, dueDate: day(11), paymentDate: null, seriesType: "recurring", frequency: "annually", occurrence: null, totalOccurrences: null, seriesActive: true, documents: [] },
  { id: "bill-06", description: "Internet", category: "utilities", status: "overdue", amountDue: 119.9, amountPaid: null, dueDate: day(-5), paymentDate: null, seriesType: null, frequency: null, occurrence: null, totalOccurrences: null, seriesActive: false, documents: [] },
  { id: "bill-07", description: "School materials", category: "education", status: "cancelled", amountDue: 76.2, amountPaid: null, dueDate: day(-12), paymentDate: null, seriesType: null, frequency: null, occurrence: null, totalOccurrences: null, seriesActive: false, documents: [] },
];

export const demoExpenses: Expense[] = [
  { id: "expense-01", description: "Weekly groceries", category: "food", amount: 284.7, status: "paid", occurredAt: day(-1), createdBy: "user-01", documents: [] },
  { id: "expense-02", description: "Ride to airport", category: "transportation", amount: 47.8, status: "paid", occurredAt: day(-2), createdBy: "user-01", documents: [] },
  { id: "expense-03", description: "Dinner with friends", category: "food", amount: 126, status: "pending", occurredAt: day(-4), createdBy: "user-02", documents: [{ id: "doc-02", fileName: "dinner-receipt.jpg", fileCategory: "Receipt" }] },
  { id: "expense-04", description: "Pharmacy", category: "healthcare", amount: 74.35, status: "paid", occurredAt: day(-6), createdBy: "user-01", documents: [] },
  { id: "expense-05", description: "New desk lamp", category: "personal", amount: 159.9, status: "pending", occurredAt: day(-8), createdBy: "user-01", documents: [] },
  { id: "expense-06", description: "Weekend beach trip", category: "travel", amount: 390, status: "paid", occurredAt: day(-11), createdBy: "user-02", documents: [] },
  { id: "expense-07", description: "Birthday gift", category: "gifts", amount: 80, status: "paid", occurredAt: day(-14), createdBy: "user-01", documents: [] },
];
