import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Home } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { organizationsService } from "@/api/organizations/organizations.service";
import { useAuth } from "@/auth/auth-provider";
import { useOrganizationStore } from "@/auth/auth-store";
import { LoadingState } from "@/components/feedback/loading-state";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";

export function CreateOrganizationPage() {
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const create = useMutation({
    mutationFn: () => organizationsService.createAsync(name.trim()),
    onSuccess: async (organization) => {
      await auth.refreshUser();
      useOrganizationStore.getState().setSelectedOrganizationId(organization.id);
      toast.success(t("createOrganization.created"));
      navigate("/dashboard", { replace: true });
    },
  });
  if (auth.status === "initializing")
    return <LoadingState label={t("createOrganization.preparing")} />;
  return (
    <PublicLayout>
      <main className="center-page">
        <div className="center-card center-card--wide">
          <span className="center-card__icon">
            <Home size={25} />
          </span>
          <p className="eyebrow">{t("createOrganization.eyebrow")}</p>
          <h1>{t("createOrganization.title")}</h1>
          <p>{t("createOrganization.body")}</p>
          <label className="field-label">
            <span>{t("createOrganization.workspaceName")}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          {create.error && (
            <p className="form-error" role="alert">
              {create.error instanceof Error
                ? create.error.message
                : t("createOrganization.unable")}
            </p>
          )}
          <Button
            disabled={!name.trim() || create.isPending || auth.status !== "authenticated"}
            onClick={() => create.mutate()}
          >
            {create.isPending ? t("createOrganization.creating") : t("common.continue")}{" "}
            <ArrowRight size={16} />
          </Button>
        </div>
      </main>
    </PublicLayout>
  );
}
