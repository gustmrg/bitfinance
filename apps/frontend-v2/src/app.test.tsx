// @vitest-environment jsdom
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";

import "./i18n";
import { App } from "./app";
import { AuthProvider } from "./auth/auth-provider";
import { queryClient } from "./lib/query-client";
import { bill, expense, me, organization, session } from "./test/fixtures";
import { server } from "./test/server";

function renderApp(initialEntries: string[]) {
  queryClient.clear();
  return render(<QueryClientProvider client={queryClient}><AuthProvider><MemoryRouter initialEntries={initialEntries}><App /></MemoryRouter></AuthProvider></QueryClientProvider>);
}

beforeEach(() => {
  window.localStorage.clear();
  server.use(
    http.post("/api/v1/identity/refresh", () => HttpResponse.json({ message: "no session" }, { status: 401 })),
    http.post("/api/v1/identity/login", () => HttpResponse.json(session)),
    http.get("/api/v1/identity/me", () => HttpResponse.json(me)),
    http.get("/health", () => HttpResponse.json({ status: "ok" })),
    http.get("/api/v1/organizations", () => HttpResponse.json(me.organizations)),
    http.get(`/api/v1/organizations/${organization.id}`, () => HttpResponse.json(organization)),
    http.get(`/api/v1/organizations/${organization.id}/dashboard/summary`, () => HttpResponse.json({ monthlyBudget: 5200, spentThisMonth: 120, remainingBudget: 5080, spentPercentage: 2, upcomingBillsAmount: 1800, upcomingBillsCount: 1 })),
    http.get(`/api/v1/organizations/${organization.id}/dashboard/upcoming-bills`, () => HttpResponse.json({ data: [bill] })),
    http.get(`/api/v1/organizations/${organization.id}/dashboard/recent-expenses`, () => HttpResponse.json({ data: [{ id: expense.id, description: expense.description, amount: expense.amount, date: expense.occurredAt, category: expense.category }] })),
  );
});

describe("frontend-v2 routes", () => {
  it("renders the public finance desk landing page without seeded runtime data", () => {
    renderApp(["/"]);
    expect(screen.getByRole("heading", { name: /make room for the life/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /open the live desk/i })).toBeTruthy();
  });

  it("uses the real session endpoints to enter the dashboard", async () => {
    const user = userEvent.setup();
    renderApp(["/auth/sign-in"]);
    await user.type(screen.getByLabelText("Email address"), "marina@example.com");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(await screen.findByRole("heading", { name: /good morning/i })).toBeTruthy();
  });
});
