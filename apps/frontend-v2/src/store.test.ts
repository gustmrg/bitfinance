import { beforeEach, describe, expect, it } from "vitest";

import { formatCurrency } from "./format";
import { useDemoStore } from "./store";

describe("BitFinance demo store", () => {
  beforeEach(() => useDemoStore.getState().resetDemo());

  it("adds and removes a bill without a backend", () => {
    const before = useDemoStore.getState().bills.length;
    useDemoStore.getState().addBill({
      description: "Prototype internet",
      category: "utilities",
      amountDue: 90,
      dueDate: new Date().toISOString(),
      seriesType: null,
      frequency: null,
      totalOccurrences: null,
    });
    const created = useDemoStore.getState().bills[0];
    expect(useDemoStore.getState().bills).toHaveLength(before + 1);
    expect(created.description).toBe("Prototype internet");
    useDemoStore.getState().deleteBill(created.id);
    expect(useDemoStore.getState().bills).toHaveLength(before);
  });

  it("marks an upcoming bill as paid", () => {
    useDemoStore.getState().markBillPaid("bill-01");
    const bill = useDemoStore.getState().bills.find((item) => item.id === "bill-01");
    expect(bill?.status).toBe("paid");
    expect(bill?.amountPaid).toBe(bill?.amountDue);
    expect(bill?.paymentDate).toBeTruthy();
  });

  it("formats the two supported money locales", () => {
    expect(formatCurrency(1234.5, "en-US")).toContain("1,234.50");
    expect(formatCurrency(1234.5, "pt-BR")).toContain("1.234,50");
  });
});
