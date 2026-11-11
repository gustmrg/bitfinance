import { describe, expect, it } from "vitest";

import { formatCurrency, formatDate, formatLongDate, initials, inputDate } from "@/lib/format";

// Intl separates the currency symbol with a non-breaking space in pt-BR.
const plainSpaces = (value: string) => value.replace(/\s/g, " ");

describe("formatCurrency", () => {
  it("formats US dollars by default", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });

  it("formats Brazilian reais for pt-BR", () => {
    expect(plainSpaces(formatCurrency(1234.5, "pt-BR"))).toBe("R$ 1.234,50");
  });
});

describe("date formatting", () => {
  it("keeps a date-only value on its own calendar day in any time zone", () => {
    expect(formatDate("2026-06-01")).toBe("Jun 1");
    expect(formatLongDate("2026-12-31")).toBe("December 31, 2026");
    expect(inputDate("2026-01-01")).toBe("2026-01-01");
  });
});

describe("initials", () => {
  it("uses the first letter of each name in upper case", () => {
    expect(initials("ana", "souza")).toBe("AS");
  });

  it("tolerates empty names", () => {
    expect(initials("", "souza")).toBe("S");
    expect(initials("", "")).toBe("");
  });
});
