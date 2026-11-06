import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/auth/auth-provider";
import { ErrorState, LoadingState } from "@/components/base/feedback";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const auth = useAuth();
  const location = useLocation();
  if (auth.status === "initializing") return <LoadingState label={t("auth.protectedSession")} />;
  if (auth.status === "unavailable")
    return (
      <ErrorState message={t("auth.sessionUnavailable")} onRetry={() => window.location.reload()} />
    );
  if (auth.status !== "authenticated") {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}${auth.sessionExpired ? "&session=expired" : ""}`}
        replace
      />
    );
  }
  if (!auth.user?.organizations.length && location.pathname !== "/organizations/new")
    return <Navigate to="/organizations/new" replace />;
  return <>{children}</>;
}
