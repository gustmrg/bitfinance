import type { BillCategory } from "@/api/bills/bills.types";
import type { PaymentMethod } from "@/api/expenses/expenses.types";

export const categoryLabels: Record<string, string> = {
  housing: "types.housing",
  utilities: "types.utilities",
  food: "types.food",
  transportation: "types.transportation",
  healthcare: "types.healthcare",
  subscriptions: "types.subscriptions",
  education: "types.education",
  insurance: "types.insurance",
  personal: "types.personal",
  clothing: "types.clothing",
  debt: "types.debt",
  savings: "types.savings",
  entertainment: "types.entertainment",
  taxes: "types.taxes",
  miscellaneous: "types.miscellaneous",
  pets: "types.pets",
  services: "types.services",
};

export function categoryLabel(category: string): string {
  return categoryLabels[category] ?? "types.miscellaneous";
}

export const categories = Object.keys(categoryLabels) as [BillCategory, ...BillCategory[]];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "paymentMethods.cash",
  creditCard: "paymentMethods.creditCard",
  debitCard: "paymentMethods.debitCard",
  pix: "paymentMethods.pix",
  bankTransfer: "paymentMethods.bankTransfer",
  boleto: "paymentMethods.boleto",
  other: "paymentMethods.other",
};

export const paymentMethods = Object.keys(paymentMethodLabels) as [
  PaymentMethod,
  ...PaymentMethod[],
];
