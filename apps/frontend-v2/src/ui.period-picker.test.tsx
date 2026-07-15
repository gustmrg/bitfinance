// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";

import "./i18n";
import { PageHeader } from "./ui";

function LocationProbe() {
  return <output data-testid="location">{useLocation().search}</output>;
}

afterEach(cleanup);

describe("dashboard period picker", () => {
  it("applies a selected range to the URL", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={["/dashboard"]}><PageHeader eyebrow="Selected period" title="Dashboard" actions={<div className="period-control" />} /><LocationProbe /></MemoryRouter>);

    await user.click(screen.getByRole("button", { expanded: false }));
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-06-01" } });
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-06-30" } });
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(screen.getByTestId("location").textContent).toBe("?from=2026-06-01&to=2026-06-30");
    expect(screen.getByRole("button", { expanded: false }).textContent).toContain("Jun 1 — Jun 30");
  });
});
