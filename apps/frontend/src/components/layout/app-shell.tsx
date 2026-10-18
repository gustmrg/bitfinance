import {
  BarChart3,
  Building2,
  CreditCard,
  Globe2,
  House,
  LogOut,
  Moon,
  MoreHorizontal,
  ReceiptText,
  Repeat,
  SunMedium,
  UsersRound,
} from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, matchPath, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/auth-provider";
import { useOrganizationStore } from "@/auth/auth-store";
import { AppIcon } from "@/components/base/app-icon";
import { Avatar } from "@/components/base/avatar";
import { Badge } from "@/components/base/badge";
import { IconButton } from "@/components/base/icon-button";
import { Select } from "@/components/base/select";
import { NotificationBell } from "@/components/navigation/notification-bell";
import { QuickAddMenu } from "@/components/navigation/quick-add-menu";
import { useOrganizationsQuery } from "@/hooks/queries/use-organization-queries";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/cn";

type NavItem = {
  to: string;
  labelKey: string;
  icon: typeof House;
  end?: boolean;
  activeFor?: string[];
};

const primaryNavItems: NavItem[] = [
  { to: "/dashboard", labelKey: "nav.overview", icon: House, end: true },
  { to: "/bills", labelKey: "nav.bills", icon: ReceiptText },
  { to: "/expenses", labelKey: "nav.expenses", icon: CreditCard },
  { to: "/recurrences", labelKey: "nav.recurrences", icon: Repeat },
  { to: "/reports", labelKey: "nav.reports", icon: BarChart3 },
];

const settingsNavItems: NavItem[] = [
  { to: "/settings/organization", labelKey: "nav.organization", icon: Building2 },
  { to: "/settings/members", labelKey: "nav.members", icon: UsersRound },
];

const moreNavItem: NavItem = {
  to: "/settings",
  labelKey: "common.more",
  icon: MoreHorizontal,
  activeFor: ["/recurrences", "/reports"],
};

const breadcrumbs = [
  { path: "/dashboard", labelKey: "nav.overview" },
  { path: "/bills/*", labelKey: "nav.bills" },
  { path: "/expenses/*", labelKey: "nav.expenses" },
  { path: "/recurrences", labelKey: "nav.recurrences" },
  { path: "/reports", labelKey: "nav.reports" },
  { path: "/settings/organization", labelKey: "nav.organization" },
  { path: "/settings/members", labelKey: "nav.members" },
  { path: "/settings/account", labelKey: "nav.account" },
  { path: "/settings", labelKey: "nav.settings" },
];

const themeColors = { light: "#ffffff", dark: "#131c2e" } as const;

function breadcrumbLabelKey(pathname: string) {
  return breadcrumbs.find(({ path }) => matchPath(path, pathname))?.labelKey ?? "nav.overview";
}

function SidebarLink({ item }: { item: NavItem }) {
  const { t } = useTranslation();
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex h-11 items-center gap-3 rounded-control px-3.5 text-sm font-semibold transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand",
          isActive
            ? "bg-brand-soft text-brand-ink"
            : "text-ink-muted hover:bg-surface-muted hover:text-ink",
        )
      }
    >
      <Icon size={20} aria-hidden="true" />
      <span>{t(item.labelKey)}</span>
    </NavLink>
  );
}

function OrganizationSwitcher({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const organizations = useOrganizationsQuery(Boolean(user));
  const selectedId = useOrganizationStore((state) => state.selectedOrganizationId);
  const setSelectedId = useOrganizationStore((state) => state.setSelectedOrganizationId);
  const items = organizations.data ?? user?.organizations ?? [];
  const activeId = selectedId ?? items[0]?.id ?? null;
  const activePlan = items.find((item) => item.id === activeId)?.planTier;
  return (
    <div className="grid min-w-0 gap-2">
      <Select
        ariaLabel={t("common.selectOrganization")}
        value={activeId}
        onValueChange={(value) => setSelectedId(value)}
        disabled={!items.length}
        options={items.map((item) => ({ value: item.id, label: item.name }))}
        className={cn("font-semibold", compact ? "h-10 border-transparent bg-surface-muted" : "")}
      />
      {!compact && activePlan && (
        <Badge tone={activePlan === "Free" ? "neutral" : "brand"} className="justify-self-start">
          {t(`organization.planTiers.${activePlan.toLowerCase()}`)}
        </Badge>
      )}
    </div>
  );
}

function ThemeSwitcher() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  return (
    <IconButton
      label={t("common.theme")}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <SunMedium size={20} aria-hidden="true" />
      ) : (
        <Moon size={20} aria-hidden="true" />
      )}
    </IconButton>
  );
}

function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  return (
    <IconButton
      label={t("common.language")}
      onClick={() => {
        const next = i18n.language === "en-US" ? "pt-BR" : "en-US";
        void i18n.changeLanguage(next);
        localStorage.setItem("bitfinance-locale", next);
      }}
    >
      <Globe2 size={20} aria-hidden="true" />
    </IconButton>
  );
}

function SidebarUser() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <div className="flex items-center gap-1 border-t border-line p-3">
      <Link
        to="/settings/account"
        aria-label={t("nav.account")}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-control p-2 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-brand"
      >
        <Avatar name={user.fullName} src={user.avatarUrl} />
        <span className="grid min-w-0">
          <span className="truncate text-sm font-bold text-ink">{user.fullName}</span>
          <span className="truncate text-xs text-ink-muted">{user.email}</span>
        </span>
      </Link>
      <IconButton
        label={t("account.signOut")}
        onClick={() => {
          void signOut().finally(() => navigate("/auth/sign-in"));
        }}
      >
        <LogOut size={18} aria-hidden="true" />
      </IconButton>
    </div>
  );
}

function MobileNavLink({ item }: { item: NavItem }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const Icon = item.icon;
  const activeElsewhere = item.activeFor?.some((path) => matchPath(path, pathname)) ?? false;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex h-14 flex-col items-center justify-center gap-1 rounded-control text-[11px] font-semibold",
          "focus-visible:outline-2 focus-visible:outline-brand",
          isActive || activeElsewhere ? "text-brand-ink" : "text-ink-muted",
        )
      }
    >
      <Icon size={22} aria-hidden="true" />
      <span>{t(item.labelKey)}</span>
    </NavLink>
  );
}

export function AppShell() {
  const { t } = useTranslation();
  const location = useLocation();
  const { theme } = useTheme();

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColors[theme]);
  }, [theme]);

  return (
    <div className="min-h-dvh bg-canvas font-sans text-ink lg:pl-60">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        <Link
          to="/dashboard"
          aria-label={t("nav.overview")}
          className="flex h-16 shrink-0 items-center gap-2.5 px-6"
        >
          <AppIcon size={30} />
          <span className="text-lg font-extrabold tracking-[-0.03em] text-ink">bitfinance</span>
        </Link>
        <div className="px-4 pb-4">
          <OrganizationSwitcher />
        </div>
        <nav
          aria-label={t("common.primaryNavigation")}
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3"
        >
          {primaryNavItems.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
          <p className="mx-3.5 mb-1.5 mt-6 text-xs font-bold text-ink-muted">{t("nav.settings")}</p>
          {settingsNavItems.map((item) => (
            <SidebarLink key={item.to} item={item} />
          ))}
        </nav>
        <SidebarUser />
      </aside>

      <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-line bg-canvas/85 px-8 backdrop-blur lg:flex">
        <span className="text-sm font-semibold text-ink-muted">
          {t(breadcrumbLabelKey(location.pathname))}
        </span>
        <div className="flex items-center gap-1">
          <ThemeSwitcher />
          <LanguageSwitcher />
          <NotificationBell />
        </div>
      </header>

      <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-line bg-surface px-3 lg:hidden">
        <Link
          to="/dashboard"
          aria-label={t("nav.overview")}
          className="inline-grid size-11 shrink-0 place-items-center"
        >
          <AppIcon size={30} />
        </Link>
        <div className="min-w-0 flex-1">
          <OrganizationSwitcher compact />
        </div>
        <NotificationBell />
      </header>

      <main className="pb-[calc(88px+env(safe-area-inset-bottom))] lg:pb-0">
        <Outlet />
      </main>

      <nav
        aria-label={t("common.mobileNavigation")}
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 items-center border-t border-line bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <MobileNavLink item={primaryNavItems[0]} />
        <MobileNavLink item={primaryNavItems[1]} />
        <QuickAddMenu />
        <MobileNavLink item={primaryNavItems[2]} />
        <MobileNavLink item={moreNavItem} />
      </nav>
    </div>
  );
}
