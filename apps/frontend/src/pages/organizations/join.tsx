import { useEffect, useRef, useState } from "react";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  LogIn,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import {
  useAuthInitialization,
  useIsAuthenticated,
} from "@/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useOrganizationMutations } from "@/hooks/mutations/use-organization-mutations";

type JoinStatus = "idle" | "redirecting" | "joining" | "success" | "error";

interface StepState {
  id: string;
  label: string;
  isActive: boolean;
  isComplete: boolean;
}

function getStepTone(step: StepState) {
  if (step.isComplete) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300";
  }

  if (step.isActive) {
    return "border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900";
  }

  return "border-zinc-200 bg-background text-muted-foreground dark:border-zinc-800";
}

export function JoinOrganization() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isInitialized = useAuthInitialization();
  const isAuthenticated = useIsAuthenticated();
  const { joinOrganizationAsync } = useOrganizationMutations();
  const [status, setStatus] = useState<JoinStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const attemptedTokenRef = useRef<string | null>(null);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (!token) {
      setStatus("error");
      setErrorMessage(t("organization.join.missingToken"));
      return;
    }

    if (!isAuthenticated) {
      setStatus("redirecting");
      const returnUrl = encodeURIComponent(
        `/join-organization?token=${encodeURIComponent(token)}`
      );
      navigate(`/auth/sign-in?returnUrl=${returnUrl}`, { replace: true });
      return;
    }

    if (attemptedTokenRef.current === token) {
      return;
    }

    attemptedTokenRef.current = token;
    setStatus("joining");
    setErrorMessage(null);

    void joinOrganizationAsync(token)
      .then(() => {
        setStatus("success");
        window.setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 900);
      })
      .catch((error: unknown) => {
        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : t("organization.join.genericError")
        );
      });
  }, [isAuthenticated, isInitialized, joinOrganizationAsync, navigate, t, token]);

  const steps: StepState[] = [
    {
      id: "authenticate",
      label: t("organization.join.steps.authenticate"),
      isActive: status === "redirecting",
      isComplete: isAuthenticated,
    },
    {
      id: "accept",
      label: t("organization.join.steps.accept"),
      isActive: status === "joining",
      isComplete: status === "success",
    },
    {
      id: "switch",
      label: t("organization.join.steps.switch"),
      isActive: status === "success",
      isComplete: status === "success",
    },
  ];

  const inviteHref = `/auth/sign-in?returnUrl=${encodeURIComponent(
    `/join-organization${token ? `?token=${encodeURIComponent(token)}` : ""}`
  )}`;

  const showPendingState =
    !isInitialized ||
    status === "idle" ||
    status === "redirecting" ||
    status === "joining";

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 via-background to-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="order-2 lg:order-1">
          <Card className="border-zinc-200/80 bg-white/90 shadow-xl backdrop-blur">
            <CardHeader className="space-y-4">
              <Badge variant="secondary" className="w-fit">
                {t("organization.join.eyebrow")}
              </Badge>
              <div className="space-y-3">
                <CardTitle className="text-3xl leading-tight sm:text-4xl">
                  {t("organization.join.title")}
                </CardTitle>
                <CardDescription className="max-w-xl text-base leading-7">
                  {t("organization.join.subtitle")}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <LogIn className="mb-3 h-5 w-5 text-foreground" />
                  <p className="text-sm font-medium">
                    {t("organization.join.benefits.authenticate")}
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <Users className="mb-3 h-5 w-5 text-foreground" />
                  <p className="text-sm font-medium">
                    {t("organization.join.benefits.access")}
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <Sparkles className="mb-3 h-5 w-5 text-foreground" />
                  <p className="text-sm font-medium">
                    {t("organization.join.benefits.switch")}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border bg-gradient-to-br from-muted/40 via-background to-background p-5">
                <p className="text-sm font-semibold text-foreground">
                  {t("organization.join.progressTitle")}
                </p>
                <div className="mt-4 space-y-3">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-3 rounded-xl border bg-background/90 p-3"
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border ${getStepTone(step)}`}
                      >
                        {step.isComplete ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : step.isActive ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CircleDot className="h-4 w-4" />
                        )}
                      </div>
                      <p className="text-sm font-medium">{step.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="order-1 lg:order-2">
          <Card className="border-zinc-200/80 bg-white/95 shadow-xl backdrop-blur">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-zinc-900 p-3 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
                  {status === "success" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : status === "error" ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">BitFinance</p>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {showPendingState
                      ? status === "redirecting"
                        ? t("organization.join.redirectingTitle")
                        : t("organization.join.joiningTitle")
                      : status === "success"
                        ? t("organization.join.successTitle")
                        : t("organization.join.errorTitle")}
                  </h2>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {showPendingState ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border bg-gradient-to-br from-muted/60 via-background to-background p-6 text-center">
                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      {status === "redirecting"
                        ? t("organization.join.redirectingDescription")
                        : t("organization.join.joiningDescription")}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                    {t("organization.join.pendingNote")}
                  </div>
                </div>
              ) : null}

              {status === "success" ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 via-background to-background p-6 text-center dark:from-emerald-950/20">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      {t("organization.join.successDescription")}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                    {t("organization.join.successNote")}
                  </div>
                </div>
              ) : null}

              {status === "error" ? (
                <div className="space-y-5">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t("organization.join.errorTitle")}</AlertTitle>
                    <AlertDescription>
                      {errorMessage ?? t("organization.join.genericError")}
                    </AlertDescription>
                  </Alert>

                  <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                    {t("organization.join.errorHelp")}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button asChild variant="outline" className="flex-1">
                      <Link to="/">{t("organization.join.goHome")}</Link>
                    </Button>
                    {!isAuthenticated ? (
                      <Button asChild className="flex-1">
                        <Link to={inviteHref}>
                          <LogIn className="h-4 w-4" />
                          {t("organization.join.signIn")}
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild className="flex-1">
                        <Link to="/dashboard">
                          <ArrowRight className="h-4 w-4" />
                          {t("organization.join.goDashboard")}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
