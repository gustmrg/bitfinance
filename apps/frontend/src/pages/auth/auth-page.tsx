import { ArrowUpRight, LockKeyhole, Mail, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/auth/auth-provider";
import { safeReturnTo } from "@/auth/safe-return-to";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";

export function AuthPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const isSignIn = mode === "sign-in";
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
      navigate(
        user.organizations.length
          ? safeReturnTo(searchParams.get("returnTo"))
          : "/account/create-organization",
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
      <main className="auth-layout">
        <section className="auth-aside">
          <div className="auth-aside__inner">
            <p className="eyebrow">
              <span className="eyebrow-mark" />
              BitFinance / {t("common.financeDesk")}
            </p>
            <h1>{isSignIn ? t("auth.signInTitle") : t("auth.signUpTitle")}</h1>
            <p>{isSignIn ? t("auth.signInBody") : t("auth.signUpBody")}</p>
            <div className="auth-aside__note">
              <Sparkles size={18} />
              <span>{isSignIn ? t("auth.protectedSession") : t("auth.minimumPassword")}</span>
            </div>
          </div>
          <div className="auth-aside__stamp">BF / live</div>
        </section>
        <section className="auth-panel">
          <div className="auth-panel__top">
            <Link to="/" className="back-link">
              ← {t("common.backHome")}
            </Link>
            <button
              className="language-switch"
              onClick={() => {
                const next = i18n.language === "en-US" ? "pt-BR" : "en-US";
                void i18n.changeLanguage(next);
                localStorage.setItem("bitfinance-locale", next);
              }}
            >
              {i18n.language === "en-US" ? "EN" : "PT"}
            </button>
          </div>
          <form className="auth-form" onSubmit={submit}>
            <div className="auth-form__heading">
              <span className="auth-form__icon">
                {isSignIn ? <LockKeyhole size={21} /> : <UserPlus size={21} />}
              </span>
              <div>
                <p className="eyebrow">
                  01 / {isSignIn ? t("auth.signInStep") : t("auth.getStarted")}
                </p>
                <h2>{isSignIn ? t("common.signIn") : t("common.signUp")}</h2>
              </div>
            </div>
            {!isSignIn && (
              <div className="form-grid">
                <label>
                  <span>{t("auth.firstName")}</span>
                  <input name="firstName" autoComplete="given-name" required />
                </label>
                <label>
                  <span>{t("auth.lastName")}</span>
                  <input name="lastName" autoComplete="family-name" required />
                </label>
              </div>
            )}
            <label>
              <span>{t("auth.email")}</span>
              <div className="input-with-icon">
                <Mail size={17} />
                <input name="email" type="email" autoComplete="email" required />
              </div>
            </label>
            <label>
              <span>{t("auth.password")}</span>
              <input
                name="password"
                type="password"
                autoComplete={isSignIn ? "current-password" : "new-password"}
                minLength={isSignIn ? 1 : 8}
                required
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending} className="button--full button--large">
              {pending ? t("common.loading") : isSignIn ? t("common.signIn") : t("common.continue")}{" "}
              {!pending && <ArrowUpRight size={17} />}
            </Button>
            <p className="auth-form__switch">
              {isSignIn ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
              <Link to={isSignIn ? "/auth/sign-up" : "/auth/sign-in"}>
                {isSignIn ? t("common.signUp") : t("common.signIn")}
              </Link>
            </p>
          </form>
          <div className="auth-panel__footer">
            <span>
              <ShieldCheck size={14} /> {t("auth.serverData")}
            </span>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
