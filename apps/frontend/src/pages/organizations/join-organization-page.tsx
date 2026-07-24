import { useMutation } from "@tanstack/react-query";
import { ArrowRight, UsersRound } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { organizationsService } from "@/api/organizations/organizations.service";
import { useAuth } from "@/auth/auth-provider";
import { useOrganizationStore } from "@/auth/auth-store";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";

export function JoinPage() {
  const { t } = useTranslation();
  const auth = useAuth();
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const join = useMutation({
    mutationFn: async () => {
      const previousOrganizationIds = new Set(
        auth.user?.organizations.map((organization) => organization.id) ?? [],
      );
      await organizationsService.joinAsync(token!);
      return previousOrganizationIds;
    },
    onSuccess: async (previousOrganizationIds) => {
      const nextUser = await auth.refreshUser();
      const joinedOrganization = nextUser.organizations.find(
        (organization) => !previousOrganizationIds.has(organization.id),
      );
      const selectedOrganization = joinedOrganization ?? nextUser.organizations[0];
      if (selectedOrganization)
        useOrganizationStore.getState().setSelectedOrganizationId(selectedOrganization.id);
      toast.success(t("join.joined"));
      navigate("/dashboard", { replace: true });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : t("join.invalid")),
  });
  const returnTo = `/join-organization?token=${encodeURIComponent(token ?? "")}`;
  const signInUrl = `/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`;
  return (
    <PublicLayout>
      <main className="center-page">
        <div className="center-card">
          <span className="center-card__icon">
            <UsersRound size={25} />
          </span>
          <p className="eyebrow">{t("join.eyebrow")}</p>
          <h1>{token ? t("join.title") : t("join.missingTitle")}</h1>
          <p>{token ? t("join.body") : t("join.missingBody")}</p>
          {message && (
            <p className="form-error" role="alert">
              {message}
            </p>
          )}
          {auth.status === "authenticated" && token ? (
            <Button disabled={join.isPending} onClick={() => join.mutate()}>
              {join.isPending ? t("common.loading") : t("common.continue")} <ArrowRight size={16} />
            </Button>
          ) : (
            <Link to={signInUrl} className="button button--primary">
              {t("common.signIn")} <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </main>
    </PublicLayout>
  );
}
