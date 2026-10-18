import { Check, Globe2, Mail, SunMedium } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "@/api/auth/auth.service";
import { useAuth } from "@/auth/auth-provider";
import { PageContainer } from "@/components/layout/page-container";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GoogleMark } from "@/components/ui/google-mark";
import { ConfirmDialog } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeading } from "@/components/ui/section-heading";
import { Select } from "@/components/ui/select";
import { useAccountMutations } from "@/hooks/mutations/use-account-mutations";
import { useNotificationMutations } from "@/hooks/mutations/use-notification-mutations";
import { useExternalProvidersQuery } from "@/hooks/queries/use-auth-queries";
import { useNotificationPreferencesQuery } from "@/hooks/queries/use-notification-queries";
import { useSelectedOrganization } from "@/hooks/use-selected-organization";
import { useTheme } from "@/hooks/use-theme";
import { acceptedAvatarTypes, maxAvatarSourceSizeBytes } from "@/lib/file-validation";
import { AvatarCropModal } from "./components/avatar-crop-modal";

export function AccountPage() {
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mutations = useAccountMutations();
  const providers = useExternalProvidersQuery();
  const user = auth.user;
  const organizationId = useSelectedOrganization();
  const notificationPreferences = useNotificationPreferencesQuery(organizationId);
  const notificationMutations = useNotificationMutations(organizationId);
  const [firstName, setFirstName] = useState(user?.fullName.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(user?.fullName.split(" ").slice(1).join(" ") ?? "");
  const [removeAvatarConfirm, setRemoveAvatarConfirm] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [signOutAllConfirm, setSignOutAllConfirm] = useState(false);
  const { theme, setTheme } = useTheme();
  const avatarInput = useRef<HTMLInputElement>(null);
  const googleStatus = searchParams.get("google");
  const googleError = searchParams.get("googleError");
  useEffect(() => {
    if (!googleStatus && !googleError) return;
    if (googleError)
      toast.error(t(`account.googleErrors.${googleError}`, t("account.googleErrors.failed")));
    else if (googleStatus === "linked") toast.success(t("account.googleLinked"));
    setSearchParams(
      (params) => {
        params.delete("google");
        params.delete("googleError");
        return params;
      },
      { replace: true },
    );
  }, [googleError, googleStatus, setSearchParams, t]);
  if (!user) return null;
  const showGoogle = user.hasGoogleLogin || providers.data?.providers.includes("google");
  const unlinkGoogle = () =>
    mutations.unlinkGoogle.mutate(undefined, {
      onSuccess: () => {
        void auth.refreshUser();
        toast.success(t("account.googleUnlinked"));
      },
      onError: (error) => toast.error(error.message),
    });
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
  const selectAvatar = (file: File) => {
    if (!acceptedAvatarTypes.includes(file.type) || file.size > maxAvatarSourceSizeBytes) {
      toast.error(t("account.invalidAvatar"));
      return;
    }
    setCropSource(URL.createObjectURL(file));
  };
  const closeCrop = () => {
    if (cropSource) URL.revokeObjectURL(cropSource);
    setCropSource(null);
  };
  const upload = async (file: File) => {
    try {
      await mutations.avatar.mutateAsync(file);
      await auth.refreshUser();
      closeCrop();
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
                if (file) selectAvatar(file);
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
          {user.hasAvatar ? (
            <Button variant="ghost" onClick={() => setRemoveAvatarConfirm(true)}>
              {t("account.removeAvatar")}
            </Button>
          ) : null}
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
                localStorage.setItem("bitfinance-locale", value);
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
          {showGoogle && (
            <div className="preference-row">
              <span>
                <GoogleMark />
                <span>
                  <strong>{t("account.google")}</strong>
                  <small>
                    {!user.hasGoogleLogin
                      ? t("account.googleDescription")
                      : user.hasPassword
                        ? t("account.googleLinkedDescription")
                        : t("account.googleOnlyDescription")}
                  </small>
                </span>
              </span>
              {user.hasGoogleLogin ? (
                <Button
                  variant="ghost"
                  disabled={!user.hasPassword || mutations.unlinkGoogle.isPending}
                  onClick={unlinkGoogle}
                >
                  {t("account.unlinkGoogle")}
                </Button>
              ) : (
                <a
                  className="button button--secondary"
                  href={authService.googleLinkUrl("/account/settings")}
                >
                  {t("account.linkGoogle")}
                </a>
              )}
            </div>
          )}
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
      {cropSource && (
        <AvatarCropModal
          src={cropSource}
          pending={mutations.avatar.isPending}
          onConfirm={(file) => void upload(file)}
          onClose={closeCrop}
        />
      )}
      {removeAvatarConfirm && (
        <ConfirmDialog
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
