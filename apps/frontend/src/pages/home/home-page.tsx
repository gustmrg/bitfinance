import { BellRing, PieChart, UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/auth-provider";
import { Badge } from "@/components/base/badge";
import { buttonClasses } from "@/components/base/button-styles";
import { Card } from "@/components/base/card";
import { Meter } from "@/components/base/meter";
import { PublicLayout } from "@/components/layout/public-layout";
import { useLocale } from "@/hooks/use-locale";
import { formatCurrency } from "@/lib/format";

const features = [
  { icon: BellRing, titleKey: "home.featureDueTitle", bodyKey: "home.featureDueBody" },
  { icon: PieChart, titleKey: "home.featureMonthTitle", bodyKey: "home.featureMonthBody" },
  { icon: UsersRound, titleKey: "home.featureSharedTitle", bodyKey: "home.featureSharedBody" },
];

function ProductPreview() {
  const { t } = useTranslation();
  const locale = useLocale();
  const rows = [
    { day: "15", nameKey: "home.previewRent", amount: 1500, tone: "danger" as const },
    { day: "20", nameKey: "home.previewInternet", amount: 120, tone: "warning" as const },
    { day: "28", nameKey: "home.previewInstallment", amount: 400, tone: "neutral" as const },
  ];
  return (
    <div aria-hidden="true" className="grid gap-4">
      <Card tone="brand" className="grid gap-3">
        <span className="text-sm font-semibold text-on-brand/85">{t("home.previewSpent")}</span>
        <span className="text-4xl font-extrabold tracking-[-0.04em] tabular-nums">
          {formatCurrency(1015, locale)}
        </span>
        <Meter
          variant="inverse"
          label=""
          max={3500}
          segments={[
            { value: 820, color: "inverse" },
            { value: 195, color: "inverse-muted" },
          ]}
        />
        <span className="text-[13px] text-on-brand/85">
          {t("home.previewLeft", { amount: formatCurrency(2485, locale) })}
        </span>
      </Card>
      <Card padding="md" className="grid gap-1">
        {rows.map((row) => (
          <div
            key={row.day}
            className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 border-t border-line py-2.5 first:border-t-0"
          >
            <span
              className={
                row.tone === "danger"
                  ? "grid h-11 place-items-center rounded-control bg-danger-soft text-base font-extrabold text-danger"
                  : "grid h-11 place-items-center rounded-control bg-brand-soft text-base font-extrabold text-brand-ink"
              }
            >
              {row.day}
            </span>
            <span className="grid gap-0.5">
              <strong className="text-sm">{t(row.nameKey)}</strong>
              <span>
                {row.tone === "danger" ? (
                  <Badge tone="danger">{t("home.previewOverdue")}</Badge>
                ) : row.tone === "warning" ? (
                  <Badge tone="warning">{t("home.previewSoon")}</Badge>
                ) : (
                  <span className="text-[13px] text-ink-muted">{t("home.previewLater")}</span>
                )}
              </span>
            </span>
            <span className="text-sm font-extrabold tabular-nums">
              {formatCurrency(row.amount, locale)}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const { status } = useAuth();
  const authenticated = status === "authenticated";
  return (
    <PublicLayout>
      <main className="mx-auto grid w-full max-w-[1200px] gap-16 px-4 pb-16 pt-8 sm:px-8 sm:pt-14">
        <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="grid gap-6">
            <h1 className="m-0 text-[40px] font-extrabold leading-[1.05] tracking-[-0.045em] sm:text-[56px]">
              {t("home.title")}
            </h1>
            <p className="m-0 max-w-xl text-lg text-ink-muted">{t("home.body")}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                to={authenticated ? "/dashboard" : "/auth/sign-up"}
                className={buttonClasses({ size: "lg" })}
              >
                {authenticated ? t("home.openApp") : t("home.cta")}
              </Link>
              {!authenticated && (
                <Link
                  to="/auth/sign-in"
                  className={buttonClasses({ variant: "secondary", size: "lg" })}
                >
                  {t("home.secondary")}
                </Link>
              )}
            </div>
          </div>
          <ProductPreview />
        </section>
        <section aria-labelledby="home-features" className="grid gap-6">
          <h2 id="home-features" className="m-0 text-2xl font-extrabold tracking-[-0.03em]">
            {t("home.featuresTitle")}
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, titleKey, bodyKey }) => (
              <Card key={titleKey} as="article" className="grid content-start gap-3">
                <span className="inline-grid size-11 place-items-center rounded-control bg-brand-soft text-brand-ink">
                  <Icon size={21} aria-hidden="true" />
                </span>
                <h3 className="m-0 text-lg font-extrabold">{t(titleKey)}</h3>
                <p className="m-0 text-sm text-ink-muted">{t(bodyKey)}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
