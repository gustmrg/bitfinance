import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/auth/auth-provider";
import { LoadingState } from "@/components/feedback/loading-state";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const auth = useAuth();
  const location = useLocation();
  if (auth.status === "initializing") return <LoadingState label={t("auth.protectedSession")} />;
  if (auth.status !== "authenticated") {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }
  if (!auth.user?.organizations.length && location.pathname !== "/account/create-organization")
    return <Navigate to="/account/create-organization" replace />;
  return <>{children}</>;
}
