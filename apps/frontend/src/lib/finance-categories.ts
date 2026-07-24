import type { BillCategory } from "@/api/bills/bills.types";

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
