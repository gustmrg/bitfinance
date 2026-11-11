import { lazy, type ReactNode, Suspense } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";

import { LoadingState } from "@/components/base/feedback";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/routing/protected-route";
import { AuthPage } from "@/pages/auth/auth-page";
import { HomePage } from "@/pages/home/home-page";
import { NotFoundPage } from "@/pages/not-found/not-found-page";

// Each page loads on first visit, so the entry bundle carries only the landing and sign-in screens.
const AccountPage = lazy(() =>
  import("@/pages/account/account-page").then((module) => ({ default: module.AccountPage })),
);
const MorePage = lazy(() =>
  import("@/pages/account/more-page").then((module) => ({ default: module.MorePage })),
);
const BillDetailsPage = lazy(() =>
  import("@/pages/bills/bill-details-page").then((module) => ({ default: module.BillDetailsPage })),
);
const BillsPage = lazy(() =>
  import("@/pages/bills/bills-page").then((module) => ({ default: module.BillsPage })),
);
const DashboardPage = lazy(() =>
  import("@/pages/dashboard/dashboard-page").then((module) => ({ default: module.DashboardPage })),
);
const ExpenseDetailsPage = lazy(() =>
  import("@/pages/expenses/expense-details-page").then((module) => ({
    default: module.ExpenseDetailsPage,
  })),
);
const ExpensesPage = lazy(() =>
  import("@/pages/expenses/expenses-page").then((module) => ({ default: module.ExpensesPage })),
);
const CreateOrganizationPage = lazy(() =>
  import("@/pages/organizations/create-organization-page").then((module) => ({
    default: module.CreateOrganizationPage,
  })),
);
const JoinPage = lazy(() =>
  import("@/pages/organizations/join-organization-page").then((module) => ({
    default: module.JoinPage,
  })),
);
const MembersPage = lazy(() =>
  import("@/pages/organizations/members-page").then((module) => ({ default: module.MembersPage })),
);
const OrganizationPage = lazy(() =>
  import("@/pages/organizations/organization-page").then((module) => ({
    default: module.OrganizationPage,
  })),
);
const RecurrencesPage = lazy(() =>
  import("@/pages/recurrences/recurrences-page").then((module) => ({
    default: module.RecurrencesPage,
  })),
);
const ReportsPage = lazy(() =>
  import("@/pages/reports/reports-page").then((module) => ({ default: module.ReportsPage })),
);

const DesignSystemPage = import.meta.env.DEV
  ? lazy(() =>
      import("@/pages/dev/design-system-page").then((module) => ({
        default: module.DesignSystemPage,
      })),
    )
  : null;

function lazyPage(page: ReactNode) {
  return <Suspense fallback={<LoadingState />}>{page}</Suspense>;
}

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
      <Route path="/join-organization" element={lazyPage(<JoinPage />)} />
      <Route path="/organizations/new" element={lazyPage(<CreateOrganizationPage />)} />
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={lazyPage(<DashboardPage />)} />
        <Route path="/bills" element={lazyPage(<BillsPage />)} />
        <Route path="/bills/:billId" element={lazyPage(<BillDetailsPage />)} />
        <Route path="/expenses" element={lazyPage(<ExpensesPage />)} />
        <Route path="/expenses/:expenseId" element={lazyPage(<ExpenseDetailsPage />)} />
        <Route path="/recurrences" element={lazyPage(<RecurrencesPage />)} />
        <Route path="/reports" element={lazyPage(<ReportsPage />)} />
        <Route path="/settings" element={lazyPage(<MorePage />)} />
        <Route path="/settings/organization" element={lazyPage(<OrganizationPage />)} />
        <Route path="/settings/members" element={lazyPage(<MembersPage />)} />
        <Route path="/settings/account" element={lazyPage(<AccountPage />)} />
      </Route>
      {legacyRoutes.map(([from, to]) => (
        <Route key={from} path={from} element={<LegacyRedirect to={to} />} />
      ))}
      {DesignSystemPage && (
        <Route
          path="/dev/design-system"
          element={
            <Suspense>
              <DesignSystemPage />
            </Suspense>
          }
        />
      )}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
