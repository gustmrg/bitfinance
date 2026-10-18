import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/routing/protected-route";
import { AccountPage } from "@/pages/account/account-page";
import { MorePage } from "@/pages/account/more-page";
import { AuthPage } from "@/pages/auth/auth-page";
import { BillDetailsPage } from "@/pages/bills/bill-details-page";
import { BillsPage } from "@/pages/bills/bills-page";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { ExpenseDetailsPage } from "@/pages/expenses/expense-details-page";
import { ExpensesPage } from "@/pages/expenses/expenses-page";
import { HomePage } from "@/pages/home/home-page";
import { NotFoundPage } from "@/pages/not-found/not-found-page";
import { CreateOrganizationPage } from "@/pages/organizations/create-organization-page";
import { JoinPage } from "@/pages/organizations/join-organization-page";
import { MembersPage } from "@/pages/organizations/members-page";
import { OrganizationPage } from "@/pages/organizations/organization-page";
import { RecurrencesPage } from "@/pages/recurrences/recurrences-page";
import { ReportsPage } from "@/pages/reports/reports-page";

function LegacyRedirect({ to }: { to: string }) {
  const params = useParams();
  const { search } = useLocation();
  const target = to.replace(/:(\w+)/g, (_, key: string) => params[key] ?? "");
  return <Navigate to={`${target}${search}`} replace />;
}

const legacyRoutes: Array<[string, string]> = [
  ["/dashboard/bills", "/bills"],
  ["/dashboard/bills/:billId", "/bills/:billId"],
  ["/dashboard/expenses", "/expenses"],
  ["/dashboard/expenses/:expenseId", "/expenses/:expenseId"],
  ["/account/settings", "/settings/account"],
  ["/account/organization", "/settings/organization"],
  ["/organization/members", "/settings/members"],
  ["/account/more", "/settings"],
  ["/account/create-organization", "/organizations/new"],
];

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth/sign-in" element={<AuthPage mode="sign-in" />} />
      <Route path="/auth/sign-up" element={<AuthPage mode="sign-up" />} />
      <Route path="/join-organization" element={<JoinPage />} />
      <Route path="/organizations/new" element={<CreateOrganizationPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/bills" element={<BillsPage />} />
        <Route path="/bills/:billId" element={<BillDetailsPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/expenses/:expenseId" element={<ExpenseDetailsPage />} />
        <Route path="/recurrences" element={<RecurrencesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<MorePage />} />
        <Route path="/settings/organization" element={<OrganizationPage />} />
        <Route path="/settings/members" element={<MembersPage />} />
        <Route path="/settings/account" element={<AccountPage />} />
      </Route>
      {legacyRoutes.map(([from, to]) => (
        <Route key={from} path={from} element={<LegacyRedirect to={to} />} />
      ))}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
