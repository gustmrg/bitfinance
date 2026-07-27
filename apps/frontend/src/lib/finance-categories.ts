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
  taxes: "types.taxes",
  miscellaneous: "types.miscellaneous",
  travel: "types.travel",
  gifts: "types.gifts",
  pets: "types.pets",
  services: "types.services",
};

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
