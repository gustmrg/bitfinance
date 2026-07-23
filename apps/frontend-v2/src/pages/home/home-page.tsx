import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Check,
  CircleDollarSign,
  MoreHorizontal,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/auth-provider";
import { PublicLayout } from "@/components/layout/public-layout";
import { Avatar } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/format";

export function HomePage() {
  const { t, i18n } = useTranslation();
  const { status } = useAuth();
  const authenticated = status === "authenticated";
  return (
    <PublicLayout>
      <main className="landing">
        <section className="landing-hero">
          <div className="landing-hero__copy">
            <p className="eyebrow">
              <span className="eyebrow-mark" />
              {t("home.eyebrow")}
            </p>
            <h1>{t("home.title")}</h1>
            <p className="landing-hero__body">{t("home.body")}</p>
            <div className="landing-hero__actions">
              <Link
                className="button button--primary button--large"
                to={authenticated ? "/dashboard" : "/auth/sign-in"}
              >
                {t("home.cta")} <ArrowUpRight size={17} />
              </Link>
              <a className="button button--ghost button--large" href="#signal">
                {t("home.secondary")} <ArrowRight size={16} />
              </a>
            </div>
            <div className="landing-hero__trust">
              <span className="avatar-stack">
                <Avatar initials="BF" size="sm" />
                <Avatar initials="RC" size="sm" />
                <Avatar initials="JL" size="sm" />
              </span>
              <span>
                <strong>{t("home.routes", { count: 41 })}</strong>
              </span>
            </div>
          </div>
          <div className="landing-hero__visual">
            <div className="hero-orbit hero-orbit--one" />
            <div className="hero-orbit hero-orbit--two" />
            <div className="hero-desk-card">
              <div className="hero-desk-card__header">
                <span className="live-dot" />
                {t("home.cashFlow")}
                <MoreHorizontal size={17} />
              </div>
              <div className="hero-desk-card__balance">
                <span>{t("home.available")}</span>
                <strong>{formatCurrency(2940, i18n.language)}</strong>
                <small>
                  <TrendingUp size={13} /> {t("home.liveData")}
                </small>
              </div>
              <div className="hero-mini-timeline">
                <span className="hero-mini-timeline__line" />
                <span
                  className="hero-mini-timeline__dot hero-mini-timeline__dot--past"
                  style={{ left: "10%" }}
                />
                <span
                  className="hero-mini-timeline__dot hero-mini-timeline__dot--mint"
                  style={{ left: "33%" }}
                />
                <span
                  className="hero-mini-timeline__dot hero-mini-timeline__dot--amber"
                  style={{ left: "57%" }}
                />
                <span
                  className="hero-mini-timeline__dot hero-mini-timeline__dot--coral"
                  style={{ left: "82%" }}
                />
                <div className="hero-mini-timeline__labels">
                  <span>01</span>
                  <span>08</span>
                  <span>15</span>
                  <span>22</span>
                  <span>30</span>
                </div>
              </div>
              <div className="hero-desk-card__rows">
                <span>
                  <i className="tiny-dot tiny-dot--mint" /> {t("home.upcomingBills")}{" "}
                  <b>{formatCurrency(2469.9, i18n.language)}</b>
                </span>
                <span>
                  <i className="tiny-dot tiny-dot--blue" /> {t("home.spentThisMonth")}{" "}
                  <b>{formatCurrency(2260, i18n.language)}</b>
                </span>
              </div>
            </div>
            <div className="hero-float hero-float--top">
              <CircleDollarSign size={18} />
              <span>
                <strong>+{formatCurrency(320, i18n.language)}</strong>
                <small>{t("home.paymentCleared")}</small>
              </span>
            </div>
            <div className="hero-float hero-float--bottom">
              <span className="hero-float__check">
                <Check size={15} />
              </span>
              <span>
                <strong>{t("home.readyNext")}</strong>
                <small>{t("home.liveContext")}</small>
              </span>
            </div>
          </div>
        </section>
        <section id="signal" className="landing-signal">
          <div>
            <p className="eyebrow">{t("home.signal")}</p>
            <h2>{t("home.nextStep")}</h2>
          </div>
          <div className="landing-signal__grid">
            <article>
              <span className="feature-number">01</span>
              <Banknote size={22} />
              <h3>{t("home.committed")}</h3>
              <p>{t("home.committedBody")}</p>
            </article>
            <article>
              <span className="feature-number">02</span>
              <BarChart3 size={22} />
              <h3>{t("home.pattern")}</h3>
              <p>{t("home.patternBody")}</p>
            </article>
            <article>
              <span className="feature-number">03</span>
              <ShieldCheck size={22} />
              <h3>{t("home.shared")}</h3>
              <p>{t("home.sharedBody")}</p>
            </article>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
