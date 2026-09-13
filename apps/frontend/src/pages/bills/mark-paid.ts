import { Bill, BillInput } from "@/api/bills/bills.types";

export function buildMarkPaidInput(bill: Bill): Omit<BillInput, "frequency" | "installments"> {
  return {
    description: bill.description,
    notes: bill.notes ?? "",
    category: bill.category,
    status: "paid",
    dueDate: bill.dueDate,
    paymentDate: new Date().toISOString(),
    amountDue: bill.amountDue,
    amountPaid: bill.amountDue,
  };
}
