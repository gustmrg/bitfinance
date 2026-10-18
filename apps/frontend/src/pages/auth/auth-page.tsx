import { LockKeyhole, UserPlus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/auth/auth-provider";
import { safeReturnTo } from "@/auth/safe-return-to";
import { Button } from "@/components/base/button";
import { Field, Input } from "@/components/base/field";
import { CenterCard } from "@/components/layout/center-card";
import { PublicLayout } from "@/components/layout/public-layout";

export function AuthPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const isSignIn = mode === "sign-in";
  const returnTo = searchParams.get("returnTo");
  const switchHref = `${isSignIn ? "/auth/sign-up" : "/auth/sign-in"}${
    returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""
  }`;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(isSignIn ? 1 : 8),
    });
    const values = {
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    };
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError(isSignIn ? t("auth.validCredentials") : t("auth.validRegistration"));
      return;
    }
    setPending(true);
    try {
      const user = await auth.signIn(
        isSignIn
          ? values
          : {
              ...values,
              firstName: String(data.get("firstName") ?? ""),
              lastName: String(data.get("lastName") ?? ""),
            },
      );
      toast.success(isSignIn ? t("auth.welcomeBack") : t("auth.accountCreated"));
      const joining = returnTo?.startsWith("/join-organization") ?? false;
      navigate(
        user.organizations.length || joining ? safeReturnTo(returnTo) : "/organizations/new",
        { replace: true },
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : t("auth.unableContinue"));
    } finally {
      setPending(false);
    }
  };
  return (
    <PublicLayout>
      <CenterCard
        icon={
          isSignIn ? (
            <LockKeyhole size={22} aria-hidden="true" />
          ) : (
            <UserPlus size={22} aria-hidden="true" />
          )
        }
        title={isSignIn ? t("auth.signInTitle") : t("auth.signUpTitle")}
        description={isSignIn ? t("auth.signInBody") : t("auth.signUpBody")}
      >
        <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
          {!isSignIn && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("auth.firstName")}>
                {(control) => (
                  <Input {...control} name="firstName" autoComplete="given-name" required />
                )}
              </Field>
              <Field label={t("auth.lastName")}>
                {(control) => (
                  <Input {...control} name="lastName" autoComplete="family-name" required />
                )}
              </Field>
            </div>
          )}
          <Field label={t("auth.email")}>
            {(control) => (
              <Input
                {...control}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
              />
            )}
          </Field>
          <Field label={t("auth.password")} hint={isSignIn ? undefined : t("auth.minimumPassword")}>
            {(control) => (
              <Input
                {...control}
                name="password"
                type="password"
                autoComplete={isSignIn ? "current-password" : "new-password"}
                minLength={isSignIn ? 1 : 8}
                required
              />
            )}
          </Field>
          {error && (
            <p
              role="alert"
              className="m-0 rounded-control bg-danger-soft px-4 py-3 text-sm font-semibold text-danger"
            >
              {error}
            </p>
          )}
          <Button type="submit" size="lg" fullWidth disabled={pending}>
            {pending ? t("common.loading") : isSignIn ? t("common.signIn") : t("common.signUp")}
          </Button>
          <p className="m-0 text-center text-sm text-ink-muted">
            {isSignIn ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
            <Link to={switchHref} className="font-bold text-brand-ink hover:underline">
              {isSignIn ? t("common.signUp") : t("common.signIn")}
            </Link>
          </p>
        </form>
      </CenterCard>
    </PublicLayout>
  );
}
