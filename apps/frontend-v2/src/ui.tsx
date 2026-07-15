import { isValidElement, lazy, Suspense, useEffect, useRef, useState, type ButtonHTMLAttributes, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  FileText,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  ReceiptText,
  Settings2,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatCurrency } from "./format";
import { useAuth } from "./auth/auth-provider";
import { useOrganizationStore } from "./auth/auth-store";
import { useOrganizationsQuery } from "./hooks/use-queries";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  return <Link to="/" className={`brand-mark ${compact ? "brand-mark--compact" : ""}`} aria-label={`BitFinance / ${t("common.backHome")}`}><span className="brand-mark__dot" /><span className="brand-mark__word">bit<span>finance</span></span></Link>;
}

export function Button({ variant = "primary", className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={`button button--${variant} ${className}`} {...props}>{children}</button>;
}

export function IconButton({ label, children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button className={`icon-button ${className}`} aria-label={label} title={label} {...props}>{children}</button>;
}

export function Avatar({ initials, src, size = "md" }: { initials: string; src?: string; size?: "sm" | "md" | "lg" }) {
  return src ? <img className={`avatar avatar--${size}`} src={src} alt="" /> : <span className={`avatar avatar--${size}`}>{initials}</span>;
}

export function StatusPill({ status }: { status: string }) {
  const { t } = useTranslation();
  const label = t(`statuses.${status}`, { defaultValue: status.replaceAll("_", " ") });
  return <span className={`status-pill status-pill--${status}`}>{label}</span>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  const labelsPeriodControl = isValidElement<{ className?: string }>(actions) && actions.props.className?.split(/\s+/).includes("period-control") === true;
  return <header className="page-header"><div>{!labelsPeriodControl && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-header__description">{description}</p>}</div>{actions && <div className="page-header__actions">{labelsPeriodControl && <p className="eyebrow">{eyebrow}</p>}{labelsPeriodControl ? <PeriodPicker /> : actions}</div>}</header>;
}

const dateParamPattern = /^\d{4}-\d{2}-\d{2}$/;

function currentMonthInputs() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const input = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return { from: input(from), to: input(to) };
}

function validDateInput(value: string | null) {
  if (!value || !dateParamPattern.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : value;
}

function PeriodPicker() {
  const { i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaults = currentMonthInputs();
  const selectedFrom = validDateInput(searchParams.get("from")) ?? defaults.from;
  const selectedTo = validDateInput(searchParams.get("to")) ?? defaults.to;
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(selectedFrom);
  const [to, setTo] = useState(selectedTo);
  const root = useRef<HTMLDivElement>(null);
  const locale = i18n.language === "pt-BR" ? "pt-BR" : "en-US";
  const display = (value: string) => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [open]);

  const toggle = () => {
    if (!open) { setFrom(selectedFrom); setTo(selectedTo); }
    setOpen((value) => !value);
  };
  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (from > to) return;
    const next = new URLSearchParams(searchParams);
    next.set("from", from);
    next.set("to", to);
    setSearchParams(next, { replace: true });
    setOpen(false);
  };
  const reset = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("from");
    next.delete("to");
    setSearchParams(next, { replace: true });
    setFrom(defaults.from);
    setTo(defaults.to);
    setOpen(false);
  };

  const { t } = useTranslation();
  return <div className="period-picker" ref={root}><button type="button" className="period-control" aria-expanded={open} aria-haspopup="dialog" onClick={toggle}><span className="period-control__dot" />{display(selectedFrom)} — {display(selectedTo)} <ChevronRight size={14} className={open ? "period-control__chevron period-control__chevron--open" : "period-control__chevron"} /></button>{open && <form className="period-popover" role="dialog" aria-label={t("common.selectPeriod")} onSubmit={apply}><div className="period-popover__heading"><CalendarDays size={17} /><span><strong>{t("common.choosePeriod")}</strong><small>{t("common.periodUpdated")}</small></span></div><div className="period-popover__fields"><label><span>{t("common.from")}</span><input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} required /></label><label><span>{t("common.to")}</span><input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} required /></label></div>{from > to && <p className="period-popover__error" role="alert">{t("common.endDateError")}</p>}<div className="period-popover__actions"><button type="button" className="period-popover__reset" onClick={reset}>{t("common.thisMonth")}</button><Button type="submit" className="button--small" disabled={from > to}>{t("common.apply")}</Button></div></form>}</div>;
}

export function SectionHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="section-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>;
}

export function MetricCard({ label, value, detail, tone = "blue", icon: Icon, progress }: { label: string; value: string; detail: string; tone?: "blue" | "mint" | "amber" | "ink"; icon: typeof WalletCards; progress?: number }) {
  return <article className={`metric-card metric-card--${tone}`}><div className="metric-card__top"><span>{label}</span><Icon size={18} strokeWidth={1.8} /></div><strong>{value}</strong><p>{detail}</p>{progress !== undefined && <div className="meter"><span style={{ width: `${Math.min(progress, 100)}%` }} /></div>}</article>;
}

export function EmptyState({ icon: Icon = FileText, title, description, action }: { icon?: typeof FileText; title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-state__icon"><Icon size={22} /></span><h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function Modal({ title, description, onClose, children, wide = false }: { title: string; description?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`modal ${wide ? "modal--wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1} ref={ref}><div className="modal__header"><div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div><IconButton label={t("common.close")} onClick={onClose}><X size={18} /></IconButton></div>{children}</div></div>;
}

export function ActionMenu({ onEdit, onPaid, onDelete, detailHref, canPay = false }: { onEdit: () => void; onPaid?: () => void; onDelete: () => void; detailHref?: string; canPay?: boolean }) {
  const { t } = useTranslation();
  return <Suspense fallback={<IconButton label={t("common.moreActions")}><MoreHorizontal size={18} /></IconButton>}><LazyActionMenu onEdit={onEdit} onPaid={onPaid} onDelete={onDelete} detailHref={detailHref} canPay={canPay} /></Suspense>;
}

const LazyActionMenu = lazy(async () => {
  const module = await import("./base-action-menu");
  return { default: module.BaseActionMenu };
});

const navItems = [
  { to: "/dashboard", labelKey: "nav.overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/bills", labelKey: "nav.bills", icon: ReceiptText },
  { to: "/dashboard/expenses", labelKey: "nav.expenses", icon: CreditCard },
];

function OrganizationSwitcher() {
  const { user } = useAuth();
  const organizations = useOrganizationsQuery(Boolean(user));
  const selectedId = useOrganizationStore((state) => state.selectedOrganizationId);
  const setSelectedId = useOrganizationStore((state) => state.setSelectedOrganizationId);
  const items = organizations.data ?? user?.organizations ?? [];
  const { t } = useTranslation();
  return <label className="org-switcher"><Building2 size={16} /><select aria-label={t("common.selectOrganization")} value={selectedId ?? items[0]?.id ?? ""} onChange={(event) => setSelectedId(event.target.value)} disabled={!items.length}>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown size={14} /></label>;
}

function UserMenu() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const initials = user.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <div className="sidebar-user"><Link className="user-menu" to="/account/settings"><Avatar initials={initials} src={user.avatarUrl ?? undefined} size="sm" /><span><strong>{user.fullName}</strong><small>{user.email}</small></span></Link><IconButton className="sidebar-user__logout" label={t("account.signOut")} onClick={() => { void signOut().finally(() => navigate("/auth/sign-in")); }}><LogOut size={16} /></IconButton></div>;
}

export function AppShell() {
  const { t } = useTranslation();
  const location = useLocation();
  return <div className="app-shell"><aside className="sidebar"><div className="sidebar__brand"><BrandMark compact /><span className="sidebar__brand-label">{t("common.financeDesk")}</span></div><div className="sidebar__org"><OrganizationSwitcher /></div><nav className="sidebar__nav" aria-label={t("common.primaryNavigation")}><p className="sidebar__section-label">{t("common.workspace")}</p>{navItems.map(({ to, labelKey, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}><Icon size={18} /><span>{t(labelKey)}</span></NavLink>)}<p className="sidebar__section-label sidebar__section-label--spaced">{t("common.workspaceSettings")}</p><NavLink to="/account/organization" className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}><Building2 size={18} /><span>{t("nav.organization")}</span></NavLink><NavLink to="/organization/members" className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}><UsersRound size={18} /><span>{t("nav.members")}</span></NavLink><NavLink to="/account/settings" className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}><Settings2 size={18} /><span>{t("nav.account")}</span></NavLink></nav><div className="sidebar__footer"><div className="sidebar__signal"><CircleDollarSign size={18} /><span><strong>{t("common.cashFlow")}</strong><small>{t("common.healthyThisMonth")}</small></span><span className="signal-dot" /></div><UserMenu /></div></aside><main className="main-content"><div className="mobile-topbar"><BrandMark /><div className="mobile-topbar__actions"><OrganizationSwitcher /><IconButton label={t("common.notifications")}><Bell size={18} /></IconButton></div></div><header className="content-topbar"><div className="content-topbar__crumb"><span className="live-dot" />{t("common.liveWorkspace")} <span>/</span> {location.pathname.includes("bills") ? t("nav.bills") : location.pathname.includes("expenses") ? t("nav.expenses") : location.pathname.includes("organization") ? t("nav.organization") : t("nav.overview")}</div><div className="content-topbar__actions"><IconButton label={t("common.notifications")}><Bell size={18} /></IconButton></div></header><div className="content-scroll"><Outlet /></div><nav className="mobile-bottom-nav" aria-label={t("common.mobileNavigation")}>{navItems.map(({ to, labelKey, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `mobile-nav-link ${isActive ? "mobile-nav-link--active" : ""}`}><Icon size={20} /><span>{t(labelKey)}</span></NavLink>)}<NavLink to="/account/more" className={({ isActive }) => `mobile-nav-link ${isActive ? "mobile-nav-link--active" : ""}`}><MoreHorizontal size={20} /><span>{t("common.more")}</span></NavLink></nav></main></div>;
}

export function PublicLayout({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  return <div className="public-shell"><header className="public-nav"><BrandMark /><div className="public-nav__actions"><button className="language-switch" onClick={() => { const next = i18n.language === "en-US" ? "pt-BR" : "en-US"; void i18n.changeLanguage(next); localStorage.setItem("bitfinance-v2-locale", next); }}><Globe2 size={15} /> {i18n.language === "en-US" ? "EN" : "PT"}</button><Link to="/auth/sign-in" className="text-link">{t("common.signIn")}</Link><Link to="/auth/sign-up" className="button button--primary button--small">{t("common.signUp")}</Link></div></header>{children}<footer className="public-footer"><BrandMark /><span>{t("home.footer")}</span></footer></div>;
}

export function KpiSparkline({ values, color = "#2f5bea" }: { values: number[]; color?: string }) {
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${36 - value * 30}`).join(" ");
  return <svg className="sparkline" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><polyline points={`0,40 ${points} 100,40`} fill={color} opacity=".08" /></svg>;
}

export function QuickAction({ to, icon: Icon, label, detail }: { to: string; icon: typeof ArrowUpRight; label: string; detail: string }) {
  return <Link to={to} className="quick-action"><span className="quick-action__icon"><Icon size={18} /></span><span><strong>{label}</strong><small>{detail}</small></span><ArrowUpRight size={16} /></Link>;
}

export function Currency({ value, locale = "en-US", className = "" }: { value: number; locale?: string; className?: string }) {
  return <span className={className}>{formatCurrency(value, locale)}</span>;
}

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="page-container">{children}</div>;
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return <IconButton label={t("common.openMenu")} onClick={onClick}><Menu size={20} /></IconButton>;
}

export function DataIcon({ type }: { type: "bill" | "expense" | "budget" | "team" }) {
  const Icon = type === "bill" ? ReceiptText : type === "expense" ? BarChart3 : type === "budget" ? WalletCards : UsersRound;
  return <span className={`data-icon data-icon--${type}`}><Icon size={17} /></span>;
}
