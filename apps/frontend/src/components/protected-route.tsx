import {
  useAuthInitialization,
  useCurrentUser,
  useIsAuthenticated,
} from "@/auth/auth-provider";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isInitialized = useAuthInitialization();
  const isAuthenticated = useIsAuthenticated();
  const currentUserQuery = useCurrentUser();
  const location = useLocation();
  const returnUrl = `${location.pathname}${location.search}${location.hash}`;
  const user = currentUserQuery.data ?? null;
  const hasOrganizations = (user?.organizations.length ?? 0) > 0;
  const isCreateOrganizationRoute = location.pathname === "/account/create-organization";
  const isLoading =
    !isInitialized || (isAuthenticated && currentUserQuery.isPending);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate 
        to={`/auth/sign-in?returnUrl=${encodeURIComponent(returnUrl)}`}
        replace 
      />
    );
  }

  if (!isCreateOrganizationRoute && !hasOrganizations) {
    return <Navigate to="/account/create-organization" replace />;
  }

  return <>{children}</>;
}
