import { useEffect, useMemo, useRef } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, ShieldCheck, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "sonner";

import { useCurrentUser } from "@/auth/auth-provider";
import { PageContainer } from "@/components/page-shell";
import { AdaptiveConfirm } from "@/components/ui/adaptive-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAccountMutations } from "@/hooks/mutations/use-account-mutations";
import { getInitials, getUserAvatarSrc } from "@/lib/avatar";

const languages = [
  { locale: "en-US", name: "English", flag: "\u{1F1FA}\u{1F1F8}" },
  { locale: "pt-BR", name: "Portugu\u00eas", flag: "\u{1F1E7}\u{1F1F7}" },
];

const UpdateProfileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
});

type UpdateProfileFormValues = z.infer<typeof UpdateProfileSchema>;

function splitFullName(fullName: string) {
  const trimmedFullName = fullName.trim();

  if (!trimmedFullName) {
    return { firstName: "", lastName: "" };
  }

  const [firstName, ...lastNameParts] = trimmedFullName.split(/\s+/);

  return {
    firstName: firstName ?? "",
    lastName: lastNameParts.join(" "),
  };
}

export function Account() {
  const { t, i18n } = useTranslation();
  const currentUserQuery = useCurrentUser();
  const user = currentUserQuery.data ?? null;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    deleteAvatarAsync,
    isDeletingAvatar,
    isLoggingOutAllDevices,
    isUpdatingProfile,
    isUploadingAvatar,
    logoutAllDevicesAsync,
    updateProfileAsync,
    uploadAvatarAsync,
  } = useAccountMutations();

  const profileDefaults = useMemo(() => splitFullName(user?.fullName ?? ""), [user?.fullName]);

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(UpdateProfileSchema),
    defaultValues: {
      firstName: profileDefaults.firstName,
      lastName: profileDefaults.lastName,
    },
  });

  useEffect(() => {
    form.reset({
      firstName: profileDefaults.firstName,
      lastName: profileDefaults.lastName,
    });
  }, [form, profileDefaults.firstName, profileDefaults.lastName]);

  async function onSubmit(data: UpdateProfileFormValues) {
    try {
      const response = await updateProfileAsync(data);

      if (response) {
        toast.success(t("account.updateSuccess"), {
          description: t("account.updateSuccessDescription"),
        });
      }
    } catch {
      // Error toast is handled globally by Axios interceptors.
    }
  }

  async function handleAvatarFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      await uploadAvatarAsync(file);
      toast.success(t("account.avatar.uploadSuccess"), {
        description: t("account.avatar.uploadSuccessDescription"),
      });
    } catch {
      // Error toast is handled globally by Axios interceptors.
    } finally {
      event.target.value = "";
    }
  }

  async function handleDeleteAvatar() {
    try {
      await deleteAvatarAsync();
      toast.success(t("account.avatar.removeSuccess"), {
        description: t("account.avatar.removeSuccessDescription"),
      });
    } catch {
      // Error toast is handled globally by Axios interceptors.
    }
  }

  async function handleLogoutAllDevices() {
    try {
      await logoutAllDevicesAsync();
      toast.success(t("account.security.logoutAllSuccess"), {
        description: t("account.security.logoutAllSuccessDescription"),
      });
      window.location.href = "/auth/sign-in";
    } catch {
      // Error toast is handled globally by Axios interceptors.
    }
  }

  return (
    <PageContainer className="max-w-3xl">
      <div>
        <h3 className="text-lg font-bold">{t("account.title")}</h3>
        <p className="text-sm text-zinc-500">{t("account.subtitle")}</p>
      </div>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>{t("account.avatar.title")}</CardTitle>
          <CardDescription>{t("account.avatar.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={getUserAvatarSrc(user?.avatarUrl)} alt={user?.fullName} />
              <AvatarFallback>{getInitials(user?.fullName ?? "User")}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-medium">{user?.fullName ?? t("account.title")}</p>
              <p className="text-sm text-muted-foreground">{user?.email ?? ""}</p>
              <p className="text-xs text-muted-foreground">
                {t("account.avatar.requirements")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
            >
              <Camera className="h-4 w-4" />
              {isUploadingAvatar
                ? t("account.avatar.uploading")
                : t("account.avatar.upload")}
            </Button>
            <Button
              variant="ghost"
              onClick={handleDeleteAvatar}
              disabled={isDeletingAvatar}
            >
              <Trash2 className="h-4 w-4" />
              {isDeletingAvatar
                ? t("account.avatar.removing")
                : t("account.avatar.remove")}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Separator />
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("account.firstName")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("account.firstNamePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("account.firstNameDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("account.lastName")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("account.lastNamePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("account.lastNameDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isUpdatingProfile || !form.formState.isDirty}>
              {isUpdatingProfile ? t("account.updatingAccount") : t("account.updateAccount")}
            </Button>
          </form>
        </Form>
      </div>
      <Separator />
      <div>
        <h3 className="text-lg font-bold">
          {t("account.preferences.title")}
        </h3>
        <p className="text-sm text-zinc-500">
          {t("account.preferences.subtitle")}
        </p>
      </div>
      <div className="space-y-2">
        <Label>{t("account.preferences.language")}</Label>
        <Select
          value={i18n.language}
          onValueChange={(locale) => i18n.changeLanguage(locale)}
        >
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.locale} value={lang.locale}>
                <span className="mr-2">{lang.flag}</span>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[0.8rem] text-muted-foreground">
          {t("account.preferences.languageDescription")}
        </p>
      </div>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>{t("account.security.title")}</CardTitle>
          <CardDescription>{t("account.security.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-muted p-2">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">{t("account.security.logoutAllTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {t("account.security.logoutAllDescription")}
              </p>
            </div>
          </div>

          <AdaptiveConfirm
            trigger={
              <Button variant="destructive" disabled={isLoggingOutAllDevices}>
                {isLoggingOutAllDevices
                  ? t("account.security.loggingOutAll")
                  : t("account.security.logoutAllAction")}
              </Button>
            }
            title={t("account.security.confirmTitle")}
            description={t("account.security.confirmDescription")}
            cancelLabel={t("labels.cancel")}
            confirmLabel={t("account.security.logoutAllAction")}
            onConfirm={handleLogoutAllDevices}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
