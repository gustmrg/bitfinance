import { useMutation } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { organizationsService } from "@/api/organizations/organizations.service";
import { useAuth } from "@/auth/auth-provider";
import { useOrganizationStore } from "@/auth/auth-store";
import { Button } from "@/components/base/button";
import { LoadingState } from "@/components/base/feedback";
import { Field, Input } from "@/components/base/field";
import { CenterCard } from "@/components/layout/center-card";
import { PublicLayout } from "@/components/layout/public-layout";

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
    return (
      <PublicLayout>
        <LoadingState label={t("createOrganization.preparing")} />
      </PublicLayout>
    );
  return (
    <PublicLayout>
      <CenterCard
        icon={<Building2 size={22} aria-hidden="true" />}
        title={t("createOrganization.title")}
        description={t("createOrganization.body")}
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <Field
            label={t("createOrganization.workspaceName")}
            hint={t("createOrganization.nameHint")}
            error={
              create.error
                ? create.error instanceof Error
                  ? create.error.message
                  : t("createOrganization.unable")
                : undefined
            }
          >
            {(control) => (
              <Input
                {...control}
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoFocus
                required
              />
            )}
          </Field>
          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={!name.trim() || create.isPending || auth.status !== "authenticated"}
          >
            {create.isPending ? t("createOrganization.creating") : t("common.continue")}
          </Button>
        </form>
      </CenterCard>
    </PublicLayout>
  );
}
