import { type ReactNode, Suspense, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { ProtectedRoute } from "./components/protected-route";

const DashboardLayout = lazy(async () => ({
  default: (await import("./layouts/dashboard-layout")).DashboardLayout,
}));

const NotFound = lazy(async () => ({
  default: (await import("./pages/404")).NotFound,
}));

const AuthLayout = lazy(async () => ({
  default: (await import("./pages/_layouts/auth-layout")).AuthLayout,
}));

const Account = lazy(async () => ({
  default: (await import("./pages/account")).Account,
}));

const AccountMore = lazy(async () => ({
  default: (await import("./pages/account/more")).AccountMore,
}));

const SignIn = lazy(async () => ({
  default: (await import("./pages/auth/sign-in")).SignIn,
}));

const SignUp = lazy(async () => ({
  default: (await import("./pages/auth/sign-up")).SignUp,
}));

const Bills = lazy(async () => ({
  default: (await import("./pages/bills")).Bills,
}));

const BillDetails = lazy(async () => ({
  default: (await import("./pages/bills/details")).BillDetails,
}));

const Dashboard = lazy(async () => ({
  default: (await import("./pages/dashboard")).Dashboard,
}));

const ExpenseDetails = lazy(async () => ({
  default: (await import("./pages/expenses/details")).ExpenseDetails,
}));

const ErrorPage = lazy(async () => ({
  default: (await import("./pages/error")).Error,
}));

const Expenses = lazy(async () => ({
  default: (await import("./pages/expenses")).Expenses,
}));

const Home = lazy(async () => ({
  default: (await import("./pages/home")).Home,
}));

const CreateOrganization = lazy(async () => ({
  default: (await import("./pages/organizations")).CreateOrganization,
}));

const JoinOrganization = lazy(async () => ({
  default: (await import("./pages/organizations/join")).JoinOrganization,
}));

const OrganizationManagement = lazy(async () => ({
  default: (await import("./pages/organizations/manage")).OrganizationManagement,
}));

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
    </div>
  );
}

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: withSuspense(<Home />),
    errorElement: withSuspense(<ErrorPage />),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        {withSuspense(<DashboardLayout />)}
      </ProtectedRoute>
    ),
    children: [
      {
        path: "",
        element: withSuspense(<Dashboard />),
      },
      {
        path: "bills",
        element: withSuspense(<Bills />),
      },
      {
        path: "bills/:billId",
        element: withSuspense(<BillDetails />),
      },
      {
        path: "expenses",
        element: withSuspense(<Expenses />),
      },
      {
        path: "expenses/:expenseId",
        element: withSuspense(<ExpenseDetails />),
      },
    ],
  },
  {
    path: "account",
    element: (
      <ProtectedRoute>
        {withSuspense(<DashboardLayout />)}
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/account/settings" replace />,
      },
      {
        path: "settings",
        element: withSuspense(<Account />),
      },
      {
        path: "more",
        element: withSuspense(<AccountMore />),
      },
      {
        path: "organization",
        element: withSuspense(<OrganizationManagement />),
      },
    ],
  },
  {
    path: "account/create-organization",
    element: (
      <ProtectedRoute>
        {withSuspense(<CreateOrganization />)}
      </ProtectedRoute>
    ),
  },
  {
    path: "join-organization",
    element: withSuspense(<JoinOrganization />),
  },
  {
    path: "/auth",
    element: withSuspense(<AuthLayout />),
    children: [
      {
        path: "sign-in",
        element: withSuspense(<SignIn />),
      },
      {
        path: "sign-up",
        element: withSuspense(<SignUp />),
      },
    ],
  },
  {
    path: "*",
    element: withSuspense(<NotFound />),
  },
]);
