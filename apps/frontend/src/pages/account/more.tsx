import {
  BarChart3,
  Bell,
  Building2,
  CirclePlus,
  CreditCard,
  type LucideIcon,
  Link2,
  LogOut,
  ReceiptText,
  Settings,
  Wallet,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useLogoutAction } from "@/auth/auth-provider";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MoreCardItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  type: "route" | "action" | "coming-soon";
  to?: string;
  onClick?: () => Promise<void> | void;
}

function MoreCard({
  item,
  comingSoonLabel,
}: {
  item: MoreCardItem;
  comingSoonLabel: string;
}) {
  const Icon = item.icon;

  const content = (
    <Card
      className={cn(
        "h-full border-zinc-200",
        item.type === "coming-soon" ? "opacity-70" : "transition-colors hover:bg-muted/30"
      )}
    >
      <CardContent className="flex h-full flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-md",
              item.type === "action" ? "bg-red-100 text-red-700" : "bg-zinc-100 text-zinc-700"
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          {item.type === "coming-soon" ? (
            <Badge variant="secondary" className="text-[10px]">
              {comingSoonLabel}
            </Badge>
          ) : null}
        </div>

        <div className="mt-3 space-y-1 text-left">
          <p
            className={cn(
              "text-sm font-semibold leading-5",
              item.type === "action" ? "text-red-700" : "text-foreground"
            )}
          >
            {item.title}
          </p>
          <p className="text-xs text-muted-foreground">{item.description}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (item.type === "route" && item.to) {
    return (
      <Link
        to={item.to}
        className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {content}
      </Link>
    );
  }

  if (item.type === "action" && item.onClick) {
    return (
      <button
        type="button"
        onClick={item.onClick}
        className="block h-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {content}
      </button>
    );
  }

  return (
    <div
      aria-disabled="true"
      className="block h-full cursor-not-allowed rounded-lg"
    >
      {content}
    </div>
  );
}

export function AccountMore() {
  const { t } = useTranslation();
  const logout = useLogoutAction();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  const items: MoreCardItem[] = [
    {
      id: "account-settings",
      title: t("more.items.accountSettings.title"),
      description: t("more.items.accountSettings.description"),
      icon: Settings,
      type: "route",
      to: "/account/settings",
    },
    {
      id: "bills",
      title: t("more.items.bills.title"),
      description: t("more.items.bills.description"),
      icon: ReceiptText,
      type: "route",
      to: "/dashboard/bills",
    },
    {
      id: "expenses",
      title: t("more.items.expenses.title"),
      description: t("more.items.expenses.description"),
      icon: CreditCard,
      type: "route",
      to: "/dashboard/expenses",
    },
    {
      id: "organization",
      title: t("more.items.organization.title"),
      description: t("more.items.organization.description"),
      icon: Building2,
      type: "route",
      to: "/account/organization",
    },
    {
      id: "create-organization",
      title: t("more.items.createOrganization.title"),
      description: t("more.items.createOrganization.description"),
      icon: CirclePlus,
      type: "route",
      to: "/account/create-organization",
    },
    {
      id: "reports",
      title: t("more.items.reports.title"),
      description: t("more.items.reports.description"),
      icon: BarChart3,
      type: "coming-soon",
    },
    {
      id: "budgets",
      title: t("more.items.budgets.title"),
      description: t("more.items.budgets.description"),
      icon: Wallet,
      type: "coming-soon",
    },
    {
      id: "notifications",
      title: t("more.items.notifications.title"),
      description: t("more.items.notifications.description"),
      icon: Bell,
      type: "coming-soon",
    },
    {
      id: "integrations",
      title: t("more.items.integrations.title"),
      description: t("more.items.integrations.description"),
      icon: Link2,
      type: "coming-soon",
    },
    {
      id: "logout",
      title: t("more.items.logout.title"),
      description: t("more.items.logout.description"),
      icon: LogOut,
      type: "action",
      onClick: onLogout,
    },
  ];

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title={t("more.title")}
        description={t("more.subtitle")}
      />

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <MoreCard
            key={item.id}
            item={item}
            comingSoonLabel={t("more.comingSoon")}
          />
        ))}
      </div>
    </PageContainer>
  );
}
