// @vitest-environment jsdom
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { accountService } from "./api/account/account.service";
import { authService } from "./api/auth/auth.service";
import { billsService } from "./api/bills/bills.service";
import { dashboardService } from "./api/dashboard/dashboard.service";
import { expensesService } from "./api/expenses/expenses.service";
import { healthService } from "./api/health/health.service";
import { organizationsService } from "./api/organizations/organizations.service";
import { setAccessToken } from "./lib/auth-token";
import { attachment, bill, expense, ids, me, organization, session } from "./test/fixtures";
import { server } from "./test/server";

const base = "/api/v1";

describe("backend endpoint contract", () => {
  it("covers every documented route with the right method and request shape", { timeout: 120_000 }, async () => {
    const seen: string[] = [];
    const record = (method: string, path: string) => { seen.push(`${method} ${path}`); };
    server.use(
      http.get("/health", ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json({ status: "ok" }); }),
      http.post(`${base}/identity/register`, async ({ request }) => { record(request.method, new URL(request.url).pathname); expect(await request.json()).toMatchObject({ firstName: "Marina", password: "password123" }); return HttpResponse.json(session); }),
      http.post(`${base}/identity/login`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json(session); }),
      http.post(`${base}/identity/refresh`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json(session); }),
      http.post(`${base}/identity/logout`, ({ request }) => { record(request.method, new URL(request.url).pathname); return new HttpResponse(null, { status: 204 }); }),
      http.post(`${base}/identity/logout-all`, ({ request }) => { record(request.method, new URL(request.url).pathname); return new HttpResponse(null, { status: 204 }); }),
      http.get(`${base}/identity/me`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json(me); }),
      http.post(`${base}/identity/manage/profile`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json(me); }),
      http.post(`${base}/identity/manage/avatar`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json({ id: ids.document, fileName: "avatar.png", contentType: "image/png" }); }),
      http.delete(`${base}/identity/manage/avatar`, ({ request }) => { record(request.method, new URL(request.url).pathname); return new HttpResponse(null, { status: 204 }); }),
      http.get(`${base}/organizations`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json(me.organizations); }),
      http.get(`${base}/organizations/${ids.organization}`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json(organization); }),
      http.post(`${base}/organizations`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json(me.organizations[0]); }),
      http.patch(`${base}/organizations/${ids.organization}`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json(me.organizations[0]); }),
      http.get(`${base}/organizations/${ids.organization}/budget`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json(organization.budget); }),
      http.put(`${base}/organizations/${ids.organization}/budget`, async ({ request }) => { record(request.method, new URL(request.url).pathname); expect(await request.json()).toEqual({ amount: 5200 }); return HttpResponse.json(organization.budget); }),
      http.post(`${base}/organizations/${ids.organization}/invite`, async ({ request }) => { record(request.method, new URL(request.url).pathname); expect(await request.json()).toMatchObject({ email: "invitee@example.com", role: 2 }); return HttpResponse.json({ id: "invitation-1", token: "token with spaces", expiresAt: "2026-07-12T00:00:00Z" }); }),
      http.patch(`${base}/organizations/${ids.organization}/members/${ids.member}/role`, async ({ request }) => { record(request.method, new URL(request.url).pathname); expect(await request.json()).toEqual({ role: "Admin" }); return HttpResponse.json({ ...organization.members[1], role: "Admin" }); }),
      http.delete(`${base}/organizations/${ids.organization}/members/${ids.member}`, ({ request }) => { record(request.method, new URL(request.url).pathname); return new HttpResponse(null, { status: 204 }); }),
      http.post(`${base}/organizations/join`, ({ request }) => { record(request.method, new URL(request.url).pathname); expect(new URL(request.url).searchParams.get("token")).toBe("token with spaces"); return new HttpResponse(null, { status: 200 }); }),
      http.get(`${base}/organizations/${ids.organization}/dashboard/summary`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json({ monthlyBudget: null, spentThisMonth: 120, remainingBudget: null, spentPercentage: null, upcomingBillsAmount: 1800, upcomingBillsCount: 1 }); }),
      http.get(`${base}/organizations/${ids.organization}/dashboard/upcoming-bills`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json({ data: [bill] }); }),
      http.get(`${base}/organizations/${ids.organization}/dashboard/recent-expenses`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json({ data: [{ id: expense.id, description: expense.description, amount: expense.amount, date: expense.occurredAt, category: expense.category }] }); }),
      http.get(`${base}/organizations/${ids.organization}/bills`, ({ request }) => { record(request.method, new URL(request.url).pathname); const url = new URL(request.url); expect(url.searchParams.get("description")).toBe("Rent"); expect(url.searchParams.get("status")).toBe("paid"); return HttpResponse.json({ data: [bill], page: 1, pageSize: 20, totalRecords: 1, totalPages: 1 }); }),
      http.post(`${base}/organizations/${ids.organization}/bills`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json(bill); }),
      http.get(`${base}/organizations/${ids.organization}/bills/${ids.bill}`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json(bill); }),
      http.patch(`${base}/organizations/${ids.organization}/bills/${ids.bill}`, async ({ request }) => { record(request.method, new URL(request.url).pathname); expect(await request.json()).toMatchObject({ status: "paid", amountPaid: 1800 }); return HttpResponse.json(bill); }),
      http.delete(`${base}/organizations/${ids.organization}/bills/${ids.bill}`, ({ request }) => { record(request.method, new URL(request.url).pathname); return new HttpResponse(null, { status: 204 }); }),
      http.post(`${base}/organizations/${ids.organization}/bills/${ids.bill}/documents`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json(attachment); }),
      http.get(`${base}/organizations/${ids.organization}/bills/${ids.bill}/documents/${ids.document}`, ({ request }) => { record(request.method, new URL(request.url).pathname); return new HttpResponse(new Blob(["pdf"]), { headers: { "Content-Type": "application/pdf" } }); }),
      http.get(`${base}/organizations/${ids.organization}/bills/${ids.bill}/documents/${ids.document}/download-url`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json({ url: "https://files.example.test/receipt.pdf", fileName: "receipt.pdf", contentType: "application/pdf", expiresAt: "2026-07-12T00:00:00Z" }); }),
      http.delete(`${base}/organizations/${ids.organization}/bills/${ids.bill}/documents/${ids.document}`, ({ request }) => { record(request.method, new URL(request.url).pathname); return new HttpResponse(null, { status: 204 }); }),
      http.post(`${base}/organizations/${ids.organization}/bills/series/${ids.series}/stop`, ({ request }) => { record(request.method, new URL(request.url).pathname); return new HttpResponse(null, { status: 204 }); }),
      http.get(`${base}/organizations/${ids.organization}/expenses`, ({ request }) => { record(request.method, new URL(request.url).pathname); const url = new URL(request.url); expect(url.searchParams.has("description")).toBe(false); expect(url.searchParams.has("status")).toBe(false); return HttpResponse.json({ data: [expense], page: 1, pageSize: 20, totalRecords: 1, totalPages: 1 }); }),
      http.post(`${base}/organizations/${ids.organization}/expenses`, async ({ request }) => { record(request.method, new URL(request.url).pathname); expect(await request.json()).toMatchObject({ createdBy: ids.user }); return HttpResponse.json(expense); }),
      http.get(`${base}/organizations/${ids.organization}/expenses/${ids.expense}`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json(expense); }),
      http.patch(`${base}/organizations/${ids.organization}/expenses/${ids.expense}`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json(expense); }),
      http.delete(`${base}/organizations/${ids.organization}/expenses/${ids.expense}`, ({ request }) => { record(request.method, new URL(request.url).pathname); return new HttpResponse(null, { status: 204 }); }),
      http.post(`${base}/organizations/${ids.organization}/expenses/${ids.expense}/documents`, ({ request }) => { record(request.method, new URL(request.url).pathname); return HttpResponse.json(attachment); }),
      http.get(`${base}/organizations/${ids.organization}/expenses/${ids.expense}/documents/${ids.document}`, ({ request }) => { record(request.method, new URL(request.url).pathname); return new HttpResponse(new Blob(["pdf"]), { headers: { "Content-Type": "application/pdf" } }); }),
      http.delete(`${base}/organizations/${ids.organization}/expenses/${ids.expense}/documents/${ids.document}`, ({ request }) => { record(request.method, new URL(request.url).pathname); return new HttpResponse(null, { status: 204 }); }),
    );

    setAccessToken(session.accessToken, session.accessTokenExpiresAt);
    await healthService.getAsync();
    await authService.registerAsync({ firstName: "Marina", lastName: "Costa", email: "marina@example.com", password: "password123" });
    await authService.loginAsync({ email: "marina@example.com", password: "password" });
    await authService.refreshAsync(); await authService.logoutAsync(); await authService.logoutAllAsync(); await authService.getMeAsync();
    await accountService.updateProfileAsync("Marina", "Costa"); await accountService.uploadAvatarAsync(new File(["avatar"], "avatar.png", { type: "image/png" })); await accountService.deleteAvatarAsync();
    await organizationsService.listAsync(); await organizationsService.getAsync(ids.organization); await organizationsService.createAsync("New org"); await organizationsService.updateAsync(ids.organization, "Updated org"); await organizationsService.getBudgetAsync(ids.organization); await organizationsService.upsertBudgetAsync(ids.organization, 5200); await organizationsService.createInviteAsync(ids.organization, "invitee@example.com", "Admin"); await organizationsService.updateMemberRoleAsync(ids.organization, ids.member, "Admin"); await organizationsService.removeMemberAsync(ids.organization, ids.member); await organizationsService.joinAsync("token with spaces");
    await dashboardService.getSummaryAsync(ids.organization); await dashboardService.getUpcomingBillsAsync(ids.organization); await dashboardService.getRecentExpensesAsync(ids.organization);
    await billsService.listAsync({ organizationId: ids.organization, page: 1, pageSize: 20, status: "paid", description: "Rent" }); await billsService.createAsync(ids.organization, { description: "Rent", category: "housing", status: "upcoming", dueDate: "2026-07-15T00:00:00Z", paymentDate: null, amountDue: 1800, amountPaid: null }); await billsService.getAsync(ids.organization, ids.bill); await billsService.updateAsync(ids.organization, ids.bill, { description: "Rent", category: "housing", status: "paid", dueDate: "2026-07-15T00:00:00Z", paymentDate: "2026-07-15T00:00:00Z", amountDue: 1800, amountPaid: 1800 }); await billsService.deleteAsync(ids.organization, ids.bill); await billsService.uploadDocumentAsync(ids.organization, ids.bill, new File(["pdf"], "receipt.pdf", { type: "application/pdf" }), "Receipt"); await billsService.getDocumentAsync(ids.organization, ids.bill, ids.document); await billsService.getDocumentDownloadUrlAsync(ids.organization, ids.bill, ids.document); await billsService.deleteDocumentAsync(ids.organization, ids.bill, ids.document); await billsService.stopSeriesAsync(ids.organization, ids.series);
    await expensesService.listAsync({ organizationId: ids.organization, page: 1, pageSize: 20 }); await expensesService.createAsync(ids.organization, { description: "Groceries", category: "food", amount: 120, status: "paid", occurredAt: "2026-07-10T00:00:00Z", createdBy: ids.user }); await expensesService.getAsync(ids.organization, ids.expense); await expensesService.updateAsync(ids.organization, ids.expense, { description: "Groceries", category: "food", amount: 120, status: "paid", occurredAt: "2026-07-10T00:00:00Z" }); await expensesService.deleteAsync(ids.organization, ids.expense); await expensesService.uploadDocumentAsync(ids.organization, ids.expense, new File(["pdf"], "receipt.pdf", { type: "application/pdf" }), "Receipt"); await expensesService.getDocumentAsync(ids.organization, ids.expense, ids.document); await expensesService.deleteDocumentAsync(ids.organization, ids.expense, ids.document);

    expect(seen).toHaveLength(41);
    expect(seen.filter((entry) => entry.startsWith("GET /api/v1/organizations/"))).toContain(`GET ${base}/organizations/${ids.organization}/expenses`);
  });
});
