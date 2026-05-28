import { Suspense, lazy, useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Plus, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";

import { useSelectedOrganization } from "@/auth/auth-provider";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useOrganizationMutations } from "@/hooks/mutations/use-organization-mutations";
import { useOrganizationQuery } from "@/hooks/queries/use-organization-query";

import { OrganizationMembersList } from "./components/organization-members-list";

const InviteMemberDialog = lazy(async () => ({
  default: (await import("./components/invite-member-dialog")).InviteMemberDialog,
}));

const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1),
});

type UpdateOrganizationFormValues = z.infer<typeof updateOrganizationSchema>;

function LazyInviteMemberAction({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);

  if (!enabled) {
    return (
      <Button onClick={() => setEnabled(true)}>
        <Plus className="h-4 w-4" />
        {t("organization.invite.trigger")}
      </Button>
    );
  }

  return (
    <Suspense
      fallback={
        <Button disabled>
          <Plus className="h-4 w-4" />
          {t("organization.invite.trigger")}
        </Button>
      }
    >
      <InviteMemberDialog
        defaultOpen
        organizationId={organizationId}
        trigger={
          <Button>
            <Plus className="h-4 w-4" />
            {t("organization.invite.trigger")}
          </Button>
        }
      />
    </Suspense>
  );
}

export function OrganizationManagement() {
  const { t, i18n } = useTranslation();
  const selectedOrganization = useSelectedOrganization();
  const organizationQuery = useOrganizationQuery(selectedOrganization?.id ?? null);
  const { isUpdatingOrganization, updateOrganizationAsync } =
    useOrganizationMutations();

  const form = useForm<UpdateOrganizationFormValues>({
    resolver: zodResolver(updateOrganizationSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (!organizationQuery.data) {
      return;
    }

    form.reset({
      name: organizationQuery.data.name,
    });
  }, [form, organizationQuery.data]);

  async function onSubmit(data: UpdateOrganizationFormValues) {
    if (!selectedOrganization) {
      return;
    }

    try {
      await updateOrganizationAsync({
        organizationId: selectedOrganization.id,
        name: data.name,
      });

      toast.success(t("organization.settings.success"), {
        description: t("organization.settings.successDescription"),
      });
    } catch {
      // Error toast is handled globally by Axios interceptors.
    }
  }

  if (!selectedOrganization) {
    return (
      <PageContainer className="max-w-4xl">
        <PageHeader
          title={t("organization.title")}
          description={t("organization.subtitle")}
        />

        <Alert>
          <Building2 className="h-4 w-4" />
          <AlertTitle>{t("organization.empty.title")}</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>{t("organization.empty.description")}</p>
            <Button asChild>
              <Link to="/account/create-organization">
                {t("organization.empty.createAction")}
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  const organization = organizationQuery.data;
  const formattedCreatedAt = organization?.createdAt
    ? new Intl.DateTimeFormat(i18n.language).format(new Date(organization.createdAt))
    : null;
  const formattedUpdatedAt = organization?.updatedAt
    ? new Intl.DateTimeFormat(i18n.language).format(new Date(organization.updatedAt))
    : null;

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title={t("organization.title")}
        description={t("organization.subtitle")}
        actions={
          organization ? (
            <LazyInviteMemberAction organizationId={organization.id} />
          ) : null
        }
      />

      {organizationQuery.isPending ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {t("organization.loading")}
          </CardContent>
        </Card>
      ) : !organization ? (
        <Card>
          <CardContent className="space-y-3 p-8 text-center">
            <h3 className="text-lg font-semibold">
              {t("organization.unavailable.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("organization.unavailable.description")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>{t("organization.settings.title")}</CardTitle>
                <CardDescription>
                  {t("organization.settings.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("organization.settings.nameLabel")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t(
                                "organization.settings.namePlaceholder"
                              )}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            {t("organization.settings.nameDescription")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={!form.formState.isDirty || isUpdatingOrganization}
                    >
                      {isUpdatingOrganization
                        ? t("organization.settings.saving")
                        : t("organization.settings.save")}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("organization.overview.title")}</CardTitle>
                <CardDescription>
                  {t("organization.overview.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">
                    {t("organization.overview.organizationName")}
                  </p>
                  <p className="font-medium">{organization.name}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-muted-foreground">
                    {t("organization.overview.createdAt")}
                  </p>
                  <p className="font-medium">{formattedCreatedAt ?? "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">
                    {t("organization.overview.updatedAt")}
                  </p>
                  <p className="font-medium">{formattedUpdatedAt ?? "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">
                    {t("organization.overview.members")}
                  </p>
                  <p className="font-medium">{organization.members.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{t("organization.members.title")}</CardTitle>
                  <CardDescription>
                    {t("organization.members.description")}
                  </CardDescription>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <OrganizationMembersList members={organization.members} />
            </CardContent>
          </Card>
        </>
      )}
    </PageContainer>
  );
}
