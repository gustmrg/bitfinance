import { lazy, Suspense, useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  FileText,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  ReceiptText,
  RotateCcw,
  Settings2,
  Sparkles,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatCurrency } from "./format";
import { selectActiveOrganization, useDemoStore } from "./store";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <Link to="/" className={`brand-mark ${compact ? "brand-mark--compact" : ""}`} aria-label="BitFinance home"><span className="brand-mark__dot" /><span className="brand-mark__word">bit<span>finance</span></span></Link>;
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

export function DemoBadge() {
  const { t } = useTranslation();
  const resetDemo = useDemoStore((state) => state.resetDemo);
  return <div className="demo-badge"><Sparkles size={14} /><span>{t("common.demo")}</span><button onClick={() => { resetDemo(); toast.success("Demo reset"); }}><RotateCcw size={13} /> {t("common.reset")}</button></div>;
}

export function StatusPill({ status }: { status: string }) {
  const label = status.replaceAll("_", " ");
  return <span className={`status-pill status-pill--${status}`}>{label}</span>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="page-header__description">{description}</p>}</div>{actions && <div className="page-header__actions">{actions}</div>}</header>;
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
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    ref.current?.focus();
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className={`modal ${wide ? "modal--wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1} ref={ref}><div className="modal__header"><div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div><IconButton label="Close" onClick={onClose}><X size={18} /></IconButton></div>{children}</div></div>;
}

export function ActionMenu({ onEdit, onPaid, onDelete, detailHref, canPay = false }: { onEdit: () => void; onPaid?: () => void; onDelete: () => void; detailHref?: string; canPay?: boolean }) {
  return <Suspense fallback={<IconButton label="More actions"><MoreHorizontal size={18} /></IconButton>}><LazyActionMenu onEdit={onEdit} onPaid={onPaid} onDelete={onDelete} detailHref={detailHref} canPay={canPay} /></Suspense>;
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
  const organization = useDemoStore(selectActiveOrganization);
  const organizations = useDemoStore((state) => state.organizations);
  const setActiveOrganization = useDemoStore((state) => state.setActiveOrganization);
  return <label className="org-switcher"><Building2 size={16} /><select aria-label="Select organization" value={organization?.id} onChange={(event) => setActiveOrganization(event.target.value)}>{organizations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown size={14} /></label>;
}

function UserMenu() {
  const { t } = useTranslation();
  const user = useDemoStore((state) => state.user);
  const signOut = useDemoStore((state) => state.signOut);
  const navigate = useNavigate();
  if (!user) return null;
  return <button className="user-menu" onClick={() => { signOut(); navigate("/auth/sign-in"); }} title={t("account.signOut")}><Avatar initials={`${user.firstName[0]}${user.lastName[0]}`} src={user.avatarUrl} size="sm" /><span><strong>{user.firstName} {user.lastName}</strong><small>{user.email}</small></span><LogOut size={15} /></button>;
}

export function AppShell() {
  const { t } = useTranslation();
  const location = useLocation();
  return <div className="app-shell"><aside className="sidebar"><div className="sidebar__brand"><BrandMark compact /><span className="sidebar__brand-label">finance desk</span></div><div className="sidebar__org"><OrganizationSwitcher /></div><nav className="sidebar__nav" aria-label="Primary navigation"><p className="sidebar__section-label">Workspace</p>{navItems.map(({ to, labelKey, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}><Icon size={18} /><span>{t(labelKey)}</span>{to === "/dashboard/bills" && <span className="nav-link__count">4</span>}</NavLink>)}<p className="sidebar__section-label sidebar__section-label--spaced">Workspace settings</p><NavLink to="/account/organization" className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}><Building2 size={18} /><span>{t("nav.organization")}</span></NavLink><NavLink to="/organization/members" className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}><UsersRound size={18} /><span>{t("nav.members")}</span></NavLink><NavLink to="/account/settings" className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}><Settings2 size={18} /><span>{t("nav.account")}</span></NavLink></nav><div className="sidebar__footer"><div className="sidebar__signal"><CircleDollarSign size={18} /><span><strong>Cash flow</strong><small>Healthy this month</small></span><span className="signal-dot" /></div><UserMenu /></div></aside><main className="main-content"><div className="mobile-topbar"><BrandMark /><div className="mobile-topbar__actions"><OrganizationSwitcher /><IconButton label="Notifications"><Bell size={18} /></IconButton></div></div><header className="content-topbar"><div className="content-topbar__crumb"><span className="live-dot" />Live workspace <span>/</span> {location.pathname.includes("bills") ? t("nav.bills") : location.pathname.includes("expenses") ? t("nav.expenses") : location.pathname.includes("organization") ? t("nav.organization") : t("nav.overview")}</div><div className="content-topbar__actions"><DemoBadge /><IconButton label="Notifications"><Bell size={18} /></IconButton><UserMenu /></div></header><div className="content-scroll"><Outlet /></div><nav className="mobile-bottom-nav" aria-label="Mobile navigation">{navItems.map(({ to, labelKey, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `mobile-nav-link ${isActive ? "mobile-nav-link--active" : ""}`}><Icon size={20} /><span>{t(labelKey)}</span></NavLink>)}<NavLink to="/account/more" className={({ isActive }) => `mobile-nav-link ${isActive ? "mobile-nav-link--active" : ""}`}><MoreHorizontal size={20} /><span>More</span></NavLink></nav></main></div>;
}

export function PublicLayout({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  return <div className="public-shell"><header className="public-nav"><BrandMark /><div className="public-nav__actions"><button className="language-switch" onClick={() => { const next = i18n.language === "en-US" ? "pt-BR" : "en-US"; void i18n.changeLanguage(next); localStorage.setItem("bitfinance-v2-locale", next); }}><Globe2 size={15} /> {i18n.language === "en-US" ? "EN" : "PT"}</button><Link to="/auth/sign-in" className="text-link">{t("common.signIn")}</Link><Link to="/auth/sign-up" className="button button--primary button--small">{t("common.signUp")}</Link></div></header>{children}<footer className="public-footer"><BrandMark /><span>© 2026 BitFinance. A clearer view of your money.</span></footer></div>;
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
  return <IconButton label="Open menu" onClick={onClick}><Menu size={20} /></IconButton>;
}

export function DataIcon({ type }: { type: "bill" | "expense" | "budget" | "team" }) {
  const Icon = type === "bill" ? ReceiptText : type === "expense" ? BarChart3 : type === "budget" ? WalletCards : UsersRound;
  return <span className={`data-icon data-icon--${type}`}><Icon size={17} /></span>;
}
