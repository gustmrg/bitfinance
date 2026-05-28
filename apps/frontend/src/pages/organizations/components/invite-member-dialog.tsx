import { type ReactNode, useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Copy,
  KeyRound,
  Link2,
  MailPlus,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "sonner";

import type {
  CreateInvitationResponse,
  OrganizationRole,
} from "@/api/organizations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdaptiveModal } from "@/components/ui/adaptive-modal";
import { useOrganizationMutations } from "@/hooks/mutations/use-organization-mutations";

const organizationRoles: OrganizationRole[] = ["Owner", "Admin", "Member"];

const inviteMemberSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["Owner", "Admin", "Member"]),
});

type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;

interface InviteMemberDialogProps {
  organizationId: string;
  defaultOpen?: boolean;
  trigger: ReactNode;
}

export function InviteMemberDialog({
  organizationId,
  defaultOpen = false,
  trigger,
}: InviteMemberDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  const [invitation, setInvitation] =
    useState<CreateInvitationResponse | null>(null);
  const { createInviteAsync, isCreatingInvite } = useOrganizationMutations();

  const form = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      role: "Member",
    },
  });

  const selectedRole = form.watch("role");

  const invitationLink = useMemo(() => {
    if (!invitation) {
      return "";
    }

    return `${window.location.origin}/join-organization?token=${invitation.token}`;
  }, [invitation]);

  function resetDialogState(nextOpen: boolean) {
    setOpen(nextOpen);

    if (nextOpen) {
      return;
    }

    setInvitation(null);
    form.reset({
      email: "",
      role: "Member",
    });
  }

  async function onSubmit(data: InviteMemberFormValues) {
    try {
      const response = await createInviteAsync({
        organizationId,
        email: data.email,
        role: data.role,
      });

      setInvitation(response);
    } catch {
      // Error toast is handled globally by Axios interceptors.
    }
  }

  async function copyText(value: string, successMessage: string) {
    await navigator.clipboard.writeText(value);
    toast.success(successMessage);
  }

  return (
    <AdaptiveModal
      open={open}
      onOpenChange={resetDialogState}
      trigger={trigger}
      title={
        invitation
          ? t("organization.invite.successTitle")
          : t("organization.invite.title")
      }
      description={
        invitation
          ? t("organization.invite.successDescription")
          : t("organization.invite.description")
      }
      contentClassName="md:max-w-2xl"
      bodyClassName="space-y-5"
    >
      {invitation ? (
        <div className="space-y-5">
          <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 via-background to-background p-5 dark:from-emerald-950/20">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{t("organization.invite.readyBadge")}</Badge>
                  <Badge variant="outline">
                    <TimerReset className="mr-1 h-3 w-3" />
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(invitation.expiresAt))}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("organization.invite.shareDescription")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-zinc-200/80">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Link2 className="h-4 w-4" />
                  {t("organization.invite.linkLabel")}
                </div>
                <CardDescription>{t("organization.invite.linkDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-muted/30 p-3 text-sm break-all">
                  {invitationLink}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    copyText(invitationLink, t("organization.invite.copiedLink"))
                  }
                >
                  <Copy className="h-4 w-4" />
                  {t("organization.invite.copyLink")}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/80">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <KeyRound className="h-4 w-4" />
                  {t("organization.invite.tokenLabel")}
                </div>
                <CardDescription>
                  {t("organization.invite.tokenDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-muted/30 p-3 text-sm break-all">
                  {invitation.token}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    copyText(invitation.token, t("organization.invite.copiedToken"))
                  }
                >
                  <Copy className="h-4 w-4" />
                  {t("organization.invite.copyToken")}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{t("organization.invite.securityNote")}</p>
            </div>
          </div>

          <Button type="button" className="w-full" onClick={() => resetDialogState(false)}>
            {t("organization.invite.done")}
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border bg-gradient-to-br from-muted/60 via-background to-background p-5">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-zinc-900 p-3 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-3">
                <Badge variant="secondary">{t("organization.invite.eyebrow")}</Badge>
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <div className="rounded-xl border bg-background/80 p-3">
                    <p className="font-medium text-foreground">
                      {t("organization.invite.benefits.linkTitle")}
                    </p>
                    <p className="mt-1">{t("organization.invite.benefits.linkDescription")}</p>
                  </div>
                  <div className="rounded-xl border bg-background/80 p-3">
                    <p className="font-medium text-foreground">
                      {t("organization.invite.benefits.roleTitle")}
                    </p>
                    <p className="mt-1">{t("organization.invite.benefits.roleDescription")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("organization.invite.emailLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("organization.invite.emailPlaceholder")}
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("organization.invite.emailDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("organization.invite.roleLabel")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {organizationRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {t(`organization.roles.${role.toLowerCase()}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t(`organization.invite.roleDescriptions.${selectedRole.toLowerCase()}`)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => resetDialogState(false)}
                  disabled={isCreatingInvite}
                >
                  {t("labels.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={!form.formState.isValid || isCreatingInvite}
                >
                  <MailPlus className="h-4 w-4" />
                  {isCreatingInvite
                    ? t("organization.invite.creating")
                    : t("organization.invite.submit")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}
    </AdaptiveModal>
  );
}
