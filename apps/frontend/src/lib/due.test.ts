import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { daysUntil, dueState } from "@/lib/due";

describe("daysUntil", () => {
  it("counts whole calendar days, ignoring the time of day", () => {
    const lateToday = new Date(2026, 5, 15, 23, 59);

    expect(daysUntil("2026-06-16", lateToday)).toBe(1);
    expect(daysUntil("2026-06-15", lateToday)).toBe(0);
    expect(daysUntil("2026-06-10", lateToday)).toBe(-5);
  });

  it("reads a date-only prefix as a local date", () => {
    expect(daysUntil("2026-06-18T00:00:00Z", new Date(2026, 5, 15))).toBe(3);
  });

  it("counts across a month boundary", () => {
    expect(daysUntil("2026-07-01", new Date(2026, 5, 29))).toBe(2);
  });
});

describe("dueState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 15, 12, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("treats paid and cancelled bills as settled whatever the due date", () => {
    expect(dueState("2026-06-01", "paid")).toEqual({ kind: "paid" });
    expect(dueState("2026-06-01", "cancelled")).toEqual({ kind: "cancelled" });
  });

  it("marks a past due date as overdue even before the status is updated", () => {
    expect(dueState("2026-06-12", "upcoming")).toEqual({ kind: "overdue", days: 3 });
  });

  it("keeps an overdue status overdue with zero days when the date is not in the past", () => {
    expect(dueState("2026-06-15", "overdue")).toEqual({ kind: "overdue", days: 0 });
  });

  it("names today and tomorrow", () => {
    expect(dueState("2026-06-15", "due")).toEqual({ kind: "today" });
    expect(dueState("2026-06-16", "upcoming")).toEqual({ kind: "tomorrow" });
  });

  it("splits soon from later at three days", () => {
    expect(dueState("2026-06-18", "upcoming")).toEqual({ kind: "soon", days: 3 });
    expect(dueState("2026-06-19", "upcoming")).toEqual({ kind: "later", days: 4 });
  });
});
