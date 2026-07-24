import { Route, Routes } from "react-router-dom";

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

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/auth/sign-in" element={<AuthPage mode="sign-in" />} />
      <Route path="/auth/sign-up" element={<AuthPage mode="sign-up" />} />
      <Route path="/join-organization" element={<JoinPage />} />
      <Route path="/account/create-organization" element={<CreateOrganizationPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/bills" element={<BillsPage />} />
        <Route path="/dashboard/bills/:billId" element={<BillDetailsPage />} />
        <Route path="/dashboard/expenses" element={<ExpensesPage />} />
        <Route path="/dashboard/expenses/:expenseId" element={<ExpenseDetailsPage />} />
        <Route path="/account/settings" element={<AccountPage />} />
        <Route path="/account/organization" element={<OrganizationPage />} />
        <Route path="/organization/members" element={<MembersPage />} />
        <Route path="/account/more" element={<MorePage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
