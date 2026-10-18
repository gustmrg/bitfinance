import { useMutation } from "@tanstack/react-query";
import { UsersRound } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { organizationsService } from "@/api/organizations/organizations.service";
import { useAuth } from "@/auth/auth-provider";
import { useOrganizationStore } from "@/auth/auth-store";
import { Button } from "@/components/base/button";
import { buttonClasses } from "@/components/base/button-styles";
import { CenterCard } from "@/components/layout/center-card";
import { PublicLayout } from "@/components/layout/public-layout";

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
  const signUpUrl = `/auth/sign-up?returnTo=${encodeURIComponent(returnTo)}`;
  return (
    <PublicLayout>
      <CenterCard
        icon={<UsersRound size={22} aria-hidden="true" />}
        title={token ? t("join.title") : t("join.missingTitle")}
        description={token ? t("join.body") : t("join.missingBody")}
      >
        {message && (
          <p
            role="alert"
            className="m-0 rounded-control bg-danger-soft px-4 py-3 text-sm font-semibold text-danger"
          >
            {message}
          </p>
        )}
        {token &&
          (auth.status === "authenticated" ? (
            <Button size="lg" fullWidth disabled={join.isPending} onClick={() => join.mutate()}>
              {join.isPending ? t("common.loading") : t("join.accept")}
            </Button>
          ) : (
            <div className="grid gap-2">
              <Link to={signInUrl} className={buttonClasses({ size: "lg", fullWidth: true })}>
                {t("join.signInToAccept")}
              </Link>
              <Link
                to={signUpUrl}
                className={buttonClasses({ variant: "secondary", size: "lg", fullWidth: true })}
              >
                {t("join.signUpToAccept")}
              </Link>
              <p className="m-0 text-center text-[13px] text-ink-muted">{t("join.emailHint")}</p>
            </div>
          ))}
      </CenterCard>
    </PublicLayout>
  );
}
