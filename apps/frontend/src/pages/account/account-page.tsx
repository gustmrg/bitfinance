import { Camera, Globe2, LogOut, Mail, SunMedium } from "lucide-react";
import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/auth/auth-provider";
import { Avatar } from "@/components/base/avatar";
import { Button } from "@/components/base/button";
import { Card, CardHeader } from "@/components/base/card";
import { ConfirmDialog } from "@/components/base/dialog";
import { Field, Input } from "@/components/base/field";
import { PageHeader } from "@/components/base/page-header";
import { SegmentedControl } from "@/components/base/segmented-control";
import { Select } from "@/components/base/select";
import { Switch } from "@/components/base/switch";
import { Page } from "@/components/layout/page";
import { SettingsTabs } from "@/components/navigation/settings-tabs";
import { useAccountMutations } from "@/hooks/mutations/use-account-mutations";
import { useNotificationMutations } from "@/hooks/mutations/use-notification-mutations";
import { useNotificationPreferencesQuery } from "@/hooks/queries/use-notification-queries";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { type Theme, useTheme } from "@/hooks/use-theme";
import { acceptedAvatarTypes } from "@/lib/file-validation";

function PreferenceRow({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-4 first:border-t-0">
      <span className="flex min-w-0 flex-1 basis-56 items-start gap-3">
        <span className="mt-0.5 text-ink-muted">{icon}</span>
        <span className="grid gap-0.5">
          <strong className="text-sm">{title}</strong>
          <span className="text-[13px] text-ink-muted">{description}</span>
        </span>
      </span>
      {children}
    </div>
  );
}

export function AccountPage() {
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  const mutations = useAccountMutations();
  const user = auth.user;
  const organizationId = useSelectedOrganization();
  const notificationPreferences = useNotificationPreferencesQuery(organizationId);
  const notificationMutations = useNotificationMutations(organizationId);
  const [firstName, setFirstName] = useState(user?.fullName.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(user?.fullName.split(" ").slice(1).join(" ") ?? "");
  const [removeAvatarConfirm, setRemoveAvatarConfirm] = useState(false);
  const [signOutAllConfirm, setSignOutAllConfirm] = useState(false);
  const { theme, setTheme } = useTheme();
  const avatarInput = useRef<HTMLInputElement>(null);
  if (!user) return null;
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await mutations.profile.mutateAsync({ firstName, lastName });
      await auth.refreshUser();
      toast.success(t("account.profileSaved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("account.unableSave"));
    }
  };
  const upload = async (file: File) => {
    if (!acceptedAvatarTypes.includes(file.type) || file.size > 2 * 1024 * 1024) {
      toast.error(t("account.invalidAvatar"));
      return;
    }
    try {
      await mutations.avatar.mutateAsync(file);
      await auth.refreshUser();
      toast.success(t("account.avatarUpdated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("account.unableUpload"));
    }
  };
  return (
    <Page>
      <PageHeader title={t("nav.settings")} description={t("nav.settingsBody")} />
      <SettingsTabs />
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card aria-labelledby="account-profile">
          <CardHeader
            titleId="account-profile"
            title={t("account.profile")}
            description={t("account.profileDescription")}
          />
          <div className="mb-5 flex flex-wrap items-center gap-4">
            <Avatar
              name={user.fullName}
              src={user.avatarUrl}
              size="md"
              className="size-16 text-lg"
            />
            <span className="grid min-w-0 flex-1 gap-0.5">
              <strong className="truncate text-base">{user.fullName}</strong>
              <span className="truncate text-sm text-ink-muted">{user.email}</span>
            </span>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <Button variant="secondary" size="sm" onClick={() => avatarInput.current?.click()}>
                <Camera size={15} aria-hidden="true" /> {t("account.changeAvatar")}
              </Button>
              {user.hasAvatar && (
                <Button variant="ghost" size="sm" onClick={() => setRemoveAvatarConfirm(true)}>
                  {t("account.removeAvatar")}
                </Button>
              )}
            </div>
            <input
              ref={avatarInput}
              hidden
              type="file"
              accept="image/jpeg,image/png"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
                event.currentTarget.value = "";
              }}
            />
          </div>
          <form className="grid gap-4" onSubmit={(event) => void save(event)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("auth.firstName")}>
                {(control) => (
                  <Input
                    {...control}
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    autoComplete="given-name"
                    required
                  />
                )}
              </Field>
              <Field label={t("auth.lastName")}>
                {(control) => (
                  <Input
                    {...control}
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    autoComplete="family-name"
                    required
                  />
                )}
              </Field>
            </div>
            <div>
              <Button type="submit" disabled={mutations.profile.isPending}>
                {t("common.save")}
              </Button>
            </div>
          </form>
        </Card>
        <div className="grid gap-5">
          <Card aria-labelledby="account-preferences">
            <CardHeader
              titleId="account-preferences"
              title={t("account.appearance")}
              description={t("account.reset")}
            />
            <PreferenceRow
              icon={<Globe2 size={18} aria-hidden="true" />}
              title={t("account.language")}
              description={t("account.languageDescription")}
            >
              <div className="w-44">
                <Select<string>
                  ariaLabel={t("account.language")}
                  value={i18n.language}
                  onValueChange={(value) => {
                    void i18n.changeLanguage(value);
                    localStorage.setItem("bitfinance-locale", value);
                  }}
                  options={[
                    { value: "pt-BR", label: t("common.portuguese") },
                    { value: "en-US", label: t("common.english") },
                  ]}
                />
              </div>
            </PreferenceRow>
            <PreferenceRow
              icon={<SunMedium size={18} aria-hidden="true" />}
              title={t("account.theme")}
              description={t("account.themeDescription")}
            >
              <SegmentedControl<Theme>
                label={t("account.theme")}
                value={theme}
                onChange={setTheme}
                options={[
                  { value: "light", label: t("common.light") },
                  { value: "dark", label: t("common.dark") },
                ]}
              />
            </PreferenceRow>
            <PreferenceRow
              icon={<Mail size={18} aria-hidden="true" />}
              title={t("account.billReminderEmails")}
              description={
                notificationPreferences.data?.emailAvailable
                  ? t("account.billReminderEmailsDescription")
                  : t("account.billReminderEmailsUpgrade")
              }
            >
              <Switch
                ariaLabel={t("account.billReminderEmails")}
                checked={notificationPreferences.data?.emailBillRemindersEnabled ?? false}
                disabled={
                  !notificationPreferences.data?.emailAvailable ||
                  notificationMutations.updatePreferences.isPending
                }
                onCheckedChange={(checked) =>
                  notificationMutations.updatePreferences.mutate(checked, {
                    onError: (error) => toast.error(error.message),
                  })
                }
              />
            </PreferenceRow>
          </Card>
          <Card aria-labelledby="account-sessions">
            <CardHeader
              titleId="account-sessions"
              title={t("account.sessions")}
              description={t("account.sessionsBody")}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  void auth.signOut().then(() => navigate("/auth/sign-in", { replace: true }));
                }}
              >
                <LogOut size={16} aria-hidden="true" /> {t("account.signOut")}
              </Button>
              <Button variant="ghost" onClick={() => setSignOutAllConfirm(true)}>
                {t("account.signOutAll")}
              </Button>
            </div>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        open={removeAvatarConfirm}
        onOpenChange={setRemoveAvatarConfirm}
        title={t("common.removeAvatarConfirm")}
        confirmLabel={t("account.removeAvatar")}
        pending={mutations.deleteAvatar.isPending}
        onConfirm={() =>
          mutations.deleteAvatar.mutate(undefined, {
            onSuccess: () => {
              setRemoveAvatarConfirm(false);
              void auth.refreshUser();
              toast.success(t("account.avatarRemoved"));
            },
            onError: (error) => toast.error(error.message),
          })
        }
      />
      <ConfirmDialog
        open={signOutAllConfirm}
        onOpenChange={setSignOutAllConfirm}
        title={t("common.signOutAllConfirm")}
        confirmLabel={t("account.signOutAll")}
        onConfirm={() => {
          void auth.signOut(true).then(() => navigate("/auth/sign-in", { replace: true }));
        }}
      />
    </Page>
  );
}
