import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Bill } from "@/api/bills/bills.types";
import { buildMarkPaidInput } from "@/pages/bills/mark-paid";

const bill: Bill = {
  id: "bill-1",
  description: "Internet",
  notes: null,
  category: "utilities",
  status: "overdue",
  amountDue: 120.5,
  amountPaid: null,
  dueDate: "2026-06-10",
  paymentDate: null,
  billSeriesId: "series-1",
  occurrenceNumber: 2,
  totalOccurrences: null,
  billSeriesType: "recurring",
  billSeriesFrequency: "monthly",
  billSeriesIsActive: true,
  documents: [],
};

describe("buildMarkPaidInput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T14:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("pays the full amount due now and keeps the bill's own fields", () => {
    expect(buildMarkPaidInput(bill)).toEqual({
      description: "Internet",
      notes: "",
      category: "utilities",
      status: "paid",
      dueDate: "2026-06-10",
      paymentDate: "2026-06-15T14:30:00.000Z",
      amountDue: 120.5,
      amountPaid: 120.5,
    });
  });

  it("does not send series fields, so paying one occurrence leaves the series alone", () => {
    const input = buildMarkPaidInput(bill);

    expect(input).not.toHaveProperty("frequency");
    expect(input).not.toHaveProperty("installments");
  });
});
