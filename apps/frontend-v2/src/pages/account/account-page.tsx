import { Check, Globe2, Mail, SunMedium } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/auth/auth-provider";
import { PageContainer } from "@/components/layout/page-container";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { useAccountMutations } from "@/hooks/mutations/use-account-mutations";
import { useNotificationMutations } from "@/hooks/mutations/use-notification-mutations";
import { useNotificationPreferencesQuery } from "@/hooks/queries/use-notification-queries";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { useTheme } from "@/hooks/use-theme";
import { acceptedAvatarTypes } from "@/lib/file-validation";

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
      // The backend has no avatar-read endpoint, so the object URL is session-local.
      auth.setAvatarPreview(file);
      await auth.refreshUser();
      toast.success(t("account.avatarUpdated"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("account.unableUpload"));
    }
  };
  return (
    <PageContainer>
      <PageHeader
        eyebrow={t("account.eyebrow")}
        title={t("account.title")}
        description={t("account.body")}
      />
      <div className="account-layout">
        <section className="surface-card profile-card">
          <SectionHeading
            title={t("account.profile")}
            description={t("account.profileDescription")}
          />
          <div className="profile-card__identity">
            <Avatar
              initials={firstName.slice(0, 1) + lastName.slice(0, 1)}
              src={user.avatarUrl ?? undefined}
              size="lg"
            />
            <div>
              <strong>{user.fullName}</strong>
              <span>{user.email}</span>
            </div>
            <Button variant="secondary" onClick={() => avatarInput.current?.click()}>
              {t("account.changeAvatar")}
            </Button>
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
          <form
            className="form-grid account-form"
            onSubmit={(event) => {
              void save(event);
            }}
          >
            <label>
              <span>{t("auth.firstName")}</span>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </label>
            <label>
              <span>{t("auth.lastName")}</span>
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </label>
            <Button type="submit" disabled={mutations.profile.isPending}>
              {t("common.save")} <Check size={16} />
            </Button>
          </form>
          <Button variant="ghost" onClick={() => setRemoveAvatarConfirm(true)}>
            {t("account.removeAvatar")}
          </Button>
        </section>
        <section className="surface-card preferences-card">
          <SectionHeading title={t("account.appearance")} description={t("account.reset")} />
          <div className="preference-row">
            <span>
              <Globe2 size={17} />
              <span>
                <strong>{t("account.language")}</strong>
                <small>{t("account.languageDescription")}</small>
              </span>
            </span>
            <Select<string>
              ariaLabel={t("account.language")}
              value={i18n.language}
              onValueChange={(value) => {
                void i18n.changeLanguage(value);
                localStorage.setItem("bitfinance-v2-locale", value);
              }}
              options={[
                { value: "en-US", label: t("common.english") },
                { value: "pt-BR", label: t("common.portuguese") },
              ]}
            />
          </div>
          <div className="preference-row">
            <span>
              <SunMedium size={17} />
              <span>
                <strong>{t("account.theme")}</strong>
                <small>{t("account.themeDescription")}</small>
              </span>
            </span>
            <span className="theme-pills">
              <button
                type="button"
                className={`theme-pill ${theme === "light" ? "theme-pill--active" : ""}`}
                onClick={() => setTheme("light")}
              >
                {t("common.light")}
              </button>
              <button
                type="button"
                className={`theme-pill ${theme === "dark" ? "theme-pill--active" : ""}`}
                onClick={() => setTheme("dark")}
              >
                {t("common.dark")}
              </button>
            </span>
          </div>
          <div className="preference-row">
            <span>
              <Mail size={17} />
              <span>
                <strong>{t("account.billReminderEmails")}</strong>
                <small>
                  {notificationPreferences.data?.emailAvailable
                    ? t("account.billReminderEmailsDescription")
                    : t("account.billReminderEmailsUpgrade")}
                </small>
              </span>
            </span>
            <label className="switch">
              <input
                type="checkbox"
                checked={notificationPreferences.data?.emailBillRemindersEnabled ?? false}
                disabled={
                  !notificationPreferences.data?.emailAvailable ||
                  notificationMutations.updatePreferences.isPending
                }
                onChange={(event) =>
                  notificationMutations.updatePreferences.mutate(event.target.checked, {
                    onError: (error) => toast.error(error.message),
                  })
                }
              />
              <span />
            </label>
          </div>
          <div className="account-signout">
            <Button
              variant="danger"
              onClick={() => {
                void auth.signOut().then(() => navigate("/auth/sign-in", { replace: true }));
              }}
            >
              {t("account.signOut")}
            </Button>
            <Button variant="ghost" onClick={() => setSignOutAllConfirm(true)}>
              {t("account.signOutAll")}
            </Button>
          </div>
        </section>
      </div>
      {removeAvatarConfirm && (
        <ConfirmDialog
          title={t("common.removeAvatarConfirm")}
          confirmLabel={t("account.removeAvatar")}
          pending={mutations.deleteAvatar.isPending}
          onConfirm={() =>
            mutations.deleteAvatar.mutate(undefined, {
              onSuccess: () => {
                setRemoveAvatarConfirm(false);
                auth.clearAvatarPreview();
                void auth.refreshUser();
                toast.success(t("account.avatarRemoved"));
              },
              onError: (error) => toast.error(error.message),
            })
          }
          onClose={() => setRemoveAvatarConfirm(false)}
        />
      )}
      {signOutAllConfirm && (
        <ConfirmDialog
          title={t("common.signOutAllConfirm")}
          confirmLabel={t("account.signOutAll")}
          onConfirm={() => {
            void auth.signOut(true).then(() => navigate("/auth/sign-in", { replace: true }));
          }}
          onClose={() => setSignOutAllConfirm(false)}
        />
      )}
    </PageContainer>
  );
}
