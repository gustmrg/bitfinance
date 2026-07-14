// @vitest-environment jsdom
import { QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { toast } from "sonner";

import "./i18n";
import { App } from "./app";
import { AuthProvider } from "./auth/auth-provider";
import { queryClient } from "./lib/query-client";
import { bill, expense, ids, me, organization, session } from "./test/fixtures";
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
    http.post("/api/v1/identity/manage/avatar", () => HttpResponse.json({ id: ids.document, fileName: "avatar.png", contentType: "image/png" })),
    http.delete("/api/v1/identity/manage/avatar", () => new HttpResponse(null, { status: 204 })),
    http.get("/health", () => HttpResponse.json({ status: "ok" })),
    http.get("/api/v1/organizations", () => HttpResponse.json(me.organizations)),
    http.get(`/api/v1/organizations/${organization.id}`, () => HttpResponse.json(organization)),
    http.get(`/api/v1/organizations/${organization.id}/dashboard/summary`, () => HttpResponse.json({ monthlyBudget: 5200, spentThisMonth: 120, remainingBudget: 5080, spentPercentage: 2, upcomingBillsAmount: 1800, upcomingBillsCount: 1 })),
    http.get(`/api/v1/organizations/${organization.id}/dashboard/upcoming-bills`, () => HttpResponse.json({ data: [bill] })),
    http.get(`/api/v1/organizations/${organization.id}/dashboard/recent-expenses`, () => HttpResponse.json({ data: [{ id: expense.id, description: expense.description, amount: expense.amount, date: expense.occurredAt, category: expense.category }] })),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
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

  it("selects the newly added organization after an empty join response", async () => {
    const user = userEvent.setup();
    const joinedOrganization = { id: "88888888-8888-8888-8888-888888888888", name: "Joined workspace" };
    let currentMe = me;
    server.use(
      http.post("/api/v1/identity/refresh", () => HttpResponse.json(session)),
      http.get("/api/v1/identity/me", () => HttpResponse.json(currentMe)),
      http.post("/api/v1/organizations/join", () => {
        currentMe = { ...me, organizations: [...me.organizations, joinedOrganization] };
        return new HttpResponse(null, { status: 200 });
      }),
      http.get(`/api/v1/organizations/${joinedOrganization.id}/dashboard/summary`, () => HttpResponse.json({ monthlyBudget: null, spentThisMonth: 0, remainingBudget: null, spentPercentage: null, upcomingBillsAmount: 0, upcomingBillsCount: 0 })),
      http.get(`/api/v1/organizations/${joinedOrganization.id}/dashboard/upcoming-bills`, () => HttpResponse.json({ data: [] })),
      http.get(`/api/v1/organizations/${joinedOrganization.id}/dashboard/recent-expenses`, () => HttpResponse.json({ data: [] })),
    );

    renderApp(["/join-organization?token=token-without-a-response-body"]);
    await user.click(await screen.findByRole("button", { name: /continue/i }));
    expect(await screen.findByRole("heading", { name: /good morning/i })).toBeTruthy();
  });

  it("lets an owner change roles and remove non-owner members", async () => {
    const user = userEvent.setup();
    let currentOrganization = organization;
    server.use(
      http.post("/api/v1/identity/refresh", () => HttpResponse.json(session)),
      http.get(`/api/v1/organizations/${ids.organization}`, () => HttpResponse.json(currentOrganization)),
      http.patch(`/api/v1/organizations/${ids.organization}/members/${ids.member}/role`, async ({ request }) => {
        expect(await request.json()).toEqual({ role: "Admin" });
        currentOrganization = { ...currentOrganization, members: currentOrganization.members.map((member) => member.id === ids.member ? { ...member, role: "Admin" as const } : member) };
        return HttpResponse.json(currentOrganization.members[1]);
      }),
      http.delete(`/api/v1/organizations/${ids.organization}/members/${ids.member}`, () => {
        currentOrganization = { ...currentOrganization, members: currentOrganization.members.filter((member) => member.id !== ids.member) };
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderApp(["/organization/members"]);
    expect(await screen.findByText("riley")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /invite/i }));
    const inviteDialog = screen.getByRole("dialog");
    expect(within(inviteDialog).getByRole("option", { name: "Admin" })).toBeTruthy();
    expect(within(inviteDialog).getByRole("option", { name: "Member" })).toBeTruthy();
    expect(within(inviteDialog).queryByRole("option", { name: "Owner" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    const roleSelect = screen.getByRole("combobox", { name: "Role for riley" });
    await user.selectOptions(roleSelect, "Admin");
    await waitFor(() => expect((roleSelect as HTMLSelectElement).value).toBe("Admin"));

    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(screen.queryByText("riley")).toBeNull());
  });

  it("does not crash when an older member payload omits role and joined date", async () => {
    const legacyOrganization = { ...organization, members: organization.members.map(({ id, username, email }) => ({ id, username, email })) } as unknown as typeof organization;
    server.use(
      http.post("/api/v1/identity/refresh", () => HttpResponse.json(session)),
      http.get(`/api/v1/organizations/${ids.organization}`, () => HttpResponse.json(legacyOrganization)),
    );

    renderApp(["/organization/members"]);
    expect(await screen.findAllByText("Role unavailable")).toHaveLength(2);
    expect(screen.getAllByText("Joined date unavailable")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /invite/i })).toBeNull();
  });

  it("limits admin management to member removal and member invitations", async () => {
    const user = userEvent.setup();
    const adminMe = { ...me, id: ids.member, fullName: "Riley Admin", email: "riley@example.com", userName: "riley" };
    const adminOrganization = { ...organization, members: [...organization.members.map((member) => member.id === ids.member ? { ...member, role: "Admin" as const } : member), { id: "99999999-9999-9999-9999-999999999999", username: "sam", email: "sam@example.com", role: "Member" as const, joinedAt: "2026-07-06T00:00:00Z" }] };
    server.use(
      http.post("/api/v1/identity/refresh", () => HttpResponse.json(session)),
      http.get("/api/v1/identity/me", () => HttpResponse.json(adminMe)),
      http.get(`/api/v1/organizations/${ids.organization}`, () => HttpResponse.json(adminOrganization)),
    );

    renderApp(["/organization/members"]);
    expect(await screen.findByText("riley")).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: /role for/i })).toBeNull();
    expect(screen.getByRole("button", { name: /invite/i })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /invite/i }));
    expect(screen.getByRole("option", { name: "Member" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Admin" })).toBeNull();
    expect(screen.queryByRole("option", { name: "Owner" })).toBeNull();
    expect(screen.getByRole("button", { name: "Remove" })).toBeTruthy();
  });

  it("gives members only the option to leave their organization", async () => {
    const user = userEvent.setup();
    const memberMe = { ...me, id: ids.member, fullName: "Riley Member", email: "riley@example.com", userName: "riley" };
    const memberOrganization = { ...organization, members: organization.members.map((member) => member.id === ids.member ? { ...member, role: "Member" as const } : member) };
    let currentMe = memberMe;
    server.use(
      http.post("/api/v1/identity/refresh", () => HttpResponse.json(session)),
      http.get("/api/v1/identity/me", () => HttpResponse.json(currentMe)),
      http.get(`/api/v1/organizations/${ids.organization}`, () => HttpResponse.json(memberOrganization)),
      http.delete(`/api/v1/organizations/${ids.organization}/members/${ids.member}`, () => { currentMe = { ...memberMe, organizations: [] }; return new HttpResponse(null, { status: 204 }); }),
    );

    renderApp(["/organization/members"]);
    expect(await screen.findByText("riley")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /invite/i })).toBeNull();
    expect(screen.getByRole("button", { name: "Leave organization" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
    expect(screen.queryByRole("combobox", { name: /role for/i })).toBeNull();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Leave organization" }));
    expect(await screen.findByRole("heading", { name: /create a money desk/i })).toBeTruthy();
  });

  it("surfaces the last-owner error without removing the owner", async () => {
    const user = userEvent.setup();
    const lastOwnerOrganization = { ...organization, members: [organization.members[0]] };
    const errorToast = vi.spyOn(toast, "error").mockImplementation(() => "toast-id");
    server.use(
      http.post("/api/v1/identity/refresh", () => HttpResponse.json(session)),
      http.get(`/api/v1/organizations/${ids.organization}`, () => HttpResponse.json(lastOwnerOrganization)),
      http.delete(`/api/v1/organizations/${ids.organization}/members/${ids.user}`, () => HttpResponse.json({ message: "Cannot leave the organization as the last owner." }, { status: 400 })),
    );

    renderApp(["/organization/members"]);
    expect(await screen.findByText("marina")).toBeTruthy();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Leave organization" }));
    await waitFor(() => expect(errorToast).toHaveBeenCalledWith("Cannot leave the organization as the last owner."));
    expect(screen.getByText("marina")).toBeTruthy();
  });

  it("uses session-local avatar previews and revokes replaced and deleted URLs", async () => {
    const user = userEvent.setup();
    const createObjectUrl = vi.spyOn(URL, "createObjectURL").mockReturnValueOnce("blob:first").mockReturnValueOnce("blob:second");
    const revokeObjectUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    server.use(http.post("/api/v1/identity/refresh", () => HttpResponse.json(session)));

    const { container } = renderApp(["/account/settings"]);
    const fileInput = () => container.querySelector('input[type="file"]') as HTMLInputElement;
    const avatarImage = () => container.querySelector("img.avatar");
    await screen.findByRole("button", { name: "Change avatar" });
    await user.upload(fileInput(), new File(["first"], "first.png", { type: "image/png" }));
    await waitFor(() => expect(avatarImage()?.getAttribute("src")).toBe("blob:first"));
    await user.upload(fileInput(), new File(["second"], "second.png", { type: "image/png" }));
    await waitFor(() => expect(avatarImage()?.getAttribute("src")).toBe("blob:second"));
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:first");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Remove avatar" }));
    await waitFor(() => expect(avatarImage()).toBeNull());
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:second");
    expect(createObjectUrl).toHaveBeenCalledTimes(2);
  });
});
