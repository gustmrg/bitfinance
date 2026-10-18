import {
  BarChart3,
  Building2,
  ChevronRight,
  LogOut,
  Repeat,
  Settings2,
  UsersRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/auth-provider";
import { Avatar } from "@/components/base/avatar";
import { Card } from "@/components/base/card";
import { PageHeader } from "@/components/base/page-header";
import { Page } from "@/components/layout/page";

const groups = [
  {
    titleKey: "more.insights",
    items: [
      {
        to: "/recurrences",
        icon: Repeat,
        labelKey: "nav.recurrences",
        detailKey: "more.recurrences",
      },
      { to: "/reports", icon: BarChart3, labelKey: "nav.reports", detailKey: "more.reports" },
    ],
  },
  {
    titleKey: "nav.settings",
    items: [
      {
        to: "/settings/organization",
        icon: Building2,
        labelKey: "nav.organization",
        detailKey: "more.budgetSettings",
      },
      {
        to: "/settings/members",
        icon: UsersRound,
        labelKey: "nav.members",
        detailKey: "more.access",
      },
      {
        to: "/settings/account",
        icon: Settings2,
        labelKey: "nav.account",
        detailKey: "more.profilePreferences",
      },
    ],
  },
];

export function MorePage() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <Page>
      <PageHeader title={t("more.title")} />
      {user && (
        <Card padding="md" className="flex items-center gap-3">
          <Avatar name={user.fullName} src={user.avatarUrl} size="md" />
          <span className="grid min-w-0">
            <strong className="truncate text-[15px]">{user.fullName}</strong>
            <span className="truncate text-[13px] text-ink-muted">{user.email}</span>
          </span>
        </Card>
      )}
      {groups.map((group) => (
        <section
          key={group.titleKey}
          aria-labelledby={`more-${group.titleKey}`}
          className="grid gap-2"
        >
          <h2
            id={`more-${group.titleKey}`}
            className="m-0 px-1 text-[13px] font-bold text-ink-muted"
          >
            {t(group.titleKey)}
          </h2>
          <Card padding="none" className="overflow-hidden">
            {group.items.map(({ to, icon: Icon, labelKey, detailKey }) => (
              <Link
                key={to}
                to={to}
                className="flex min-h-16 items-center gap-3 border-t border-line px-4 first:border-t-0 hover:bg-surface-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
              >
                <span className="inline-grid size-10 shrink-0 place-items-center rounded-control bg-brand-soft text-brand-ink">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span className="grid min-w-0 flex-1">
                  <strong className="text-[15px]">{t(labelKey)}</strong>
                  <span className="truncate text-[13px] text-ink-muted">{t(detailKey)}</span>
                </span>
                <ChevronRight size={18} className="text-ink-muted" aria-hidden="true" />
              </Link>
            ))}
          </Card>
        </section>
      ))}
      <button
        type="button"
        onClick={() => {
          void signOut().finally(() => navigate("/auth/sign-in"));
        }}
        className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-card border border-line bg-surface text-[15px] font-bold text-danger hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand"
      >
        <LogOut size={18} aria-hidden="true" /> {t("account.signOut")}
      </button>
    </Page>
  );
}
