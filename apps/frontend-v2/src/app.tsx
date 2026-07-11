import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";

import { isThisMonth } from "date-fns";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Building2,
  Check,
  ChevronRight,
  CircleDollarSign,
  FilePlus2,
  Filter,
  Globe2,
  Home,
  LockKeyhole,
  Mail,
  MoreHorizontal,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Settings2,
  SunMedium,
  TrendingUp,
  UserPlus,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

import { formatCurrency, formatDate, formatLongDate, inputDate, initials, relativeDate } from "./format";
import { selectActiveOrganization, useDemoStore } from "./store";
import type { Bill, BillCategory, BillFrequency, BillSeriesType, BillStatus, Expense, ExpenseCategory, ExpenseStatus, NewBillInput, NewExpenseInput } from "./types";
import { ActionMenu, AppShell, Avatar, Button, DataIcon, EmptyState, IconButton, KpiSparkline, MetricCard, Modal, PageContainer, PageHeader, PublicLayout, QuickAction, SectionHeading, StatusPill } from "./ui";

const categoryLabels: Record<string, string> = {
  housing: "Housing", utilities: "Utilities", food: "Food", transportation: "Transport", healthcare: "Healthcare", subscriptions: "Subscriptions", education: "Education", insurance: "Insurance", personal: "Personal", taxes: "Taxes", miscellaneous: "Misc", travel: "Travel", gifts: "Gifts", pets: "Pets",
};

function useLocale() {
  const { i18n } = useTranslation();
  return i18n.language === "pt-BR" ? "pt-BR" : "en-US";
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const authenticated = useDemoStore((state) => state.isAuthenticated);
  return authenticated ? <>{children}</> : <Navigate to="/auth/sign-in" replace />;
}

export function App() {
  return <Routes><Route path="/" element={<HomePage />} /><Route path="/auth/sign-in" element={<AuthPage mode="sign-in" />} /><Route path="/auth/sign-up" element={<AuthPage mode="sign-up" />} /><Route path="/join-organization" element={<JoinPage />} /><Route path="/account/create-organization" element={<CreateOrganizationPage />} /><Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/dashboard/bills" element={<BillsPage />} /><Route path="/dashboard/bills/:billId" element={<BillDetailsPage />} /><Route path="/dashboard/expenses" element={<ExpensesPage />} /><Route path="/dashboard/expenses/:expenseId" element={<ExpenseDetailsPage />} /><Route path="/account/settings" element={<AccountPage />} /><Route path="/account/organization" element={<OrganizationPage />} /><Route path="/organization/members" element={<MembersPage />} /><Route path="/account/more" element={<MorePage />} /></Route><Route path="*" element={<NotFoundPage />} /></Routes>;
}

function HomePage() {
  const { t, i18n } = useTranslation();
  const authenticated = useDemoStore((state) => state.isAuthenticated);
  return <PublicLayout><main className="landing"><section className="landing-hero"><div className="landing-hero__copy"><p className="eyebrow"><span className="eyebrow-mark" />{t("home.eyebrow")}</p><h1>{t("home.title")}</h1><p className="landing-hero__body">{t("home.body")}</p><div className="landing-hero__actions"><Link className="button button--primary button--large" to={authenticated ? "/dashboard" : "/auth/sign-in"}>{t("home.cta")} <ArrowUpRight size={17} /></Link><a className="button button--ghost button--large" href="#signal">{t("home.secondary")} <ArrowRight size={16} /></a></div><div className="landing-hero__trust"><span className="avatar-stack"><Avatar initials="MC" size="sm" /><Avatar initials="RC" size="sm" /><Avatar initials="JL" size="sm" /></span><span><strong>4.9/5</strong> from people planning their next move</span></div></div><div className="landing-hero__visual"><div className="hero-orbit hero-orbit--one" /><div className="hero-orbit hero-orbit--two" /><div className="hero-desk-card"><div className="hero-desk-card__header"><span className="live-dot" />{i18n.language === "pt-BR" ? "Fluxo de julho" : "July cash flow"}<MoreHorizontal size={17} /></div><div className="hero-desk-card__balance"><span>{i18n.language === "pt-BR" ? "Disponível" : "Available"}</span><strong>{formatCurrency(2940, i18n.language)}</strong><small><TrendingUp size={13} /> 12.8% vs last month</small></div><div className="hero-mini-timeline"><span className="hero-mini-timeline__line" /><span className="hero-mini-timeline__dot hero-mini-timeline__dot--past" style={{ left: "10%" }} /><span className="hero-mini-timeline__dot hero-mini-timeline__dot--mint" style={{ left: "33%" }} /><span className="hero-mini-timeline__dot hero-mini-timeline__dot--amber" style={{ left: "57%" }} /><span className="hero-mini-timeline__dot hero-mini-timeline__dot--coral" style={{ left: "82%" }} /><div className="hero-mini-timeline__labels"><span>01</span><span>08</span><span>15</span><span>22</span><span>30</span></div></div><div className="hero-desk-card__rows"><span><i className="tiny-dot tiny-dot--mint" /> Upcoming bills <b>{formatCurrency(2469.9, i18n.language)}</b></span><span><i className="tiny-dot tiny-dot--blue" /> Spent this month <b>{formatCurrency(2260, i18n.language)}</b></span></div></div><div className="hero-float hero-float--top"><CircleDollarSign size={18} /><span><strong>+{formatCurrency(320, i18n.language)}</strong><small>payment cleared</small></span></div><div className="hero-float hero-float--bottom"><span className="hero-float__check"><Check size={15} /></span><span><strong>All caught up</strong><small>next bill in 2 days</small></span></div></div></section><section id="signal" className="landing-signal"><div><p className="eyebrow">{t("home.signal")}</p><h2>Every number has a next step.</h2></div><div className="landing-signal__grid"><article><span className="feature-number">01</span><Banknote size={22} /><h3>Know what’s committed</h3><p>See upcoming obligations before they crowd out the choices you actually want to make.</p></article><article><span className="feature-number">02</span><BarChart3 size={22} /><h3>Notice the pattern</h3><p>Turn a pile of transactions into a rhythm you can talk about together.</p></article><article><span className="feature-number">03</span><ShieldCheck size={22} /><h3>Keep it shared</h3><p>Invite the people who need context, without turning your home into a spreadsheet.</p></article></div></section></main></PublicLayout>;
}

function AuthPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { t, i18n } = useTranslation();
  const signIn = useDemoStore((state) => state.signIn);
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const isSignIn = mode === "sign-in";
  const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(4) });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    if (!credentialsSchema.safeParse({ email, password }).success) { setError(i18n.language === "pt-BR" ? "Use um e-mail válido e uma senha com 4 caracteres." : "Use a valid email and a password with 4 characters."); return; }
    signIn({ id: "user-demo", firstName: isSignIn ? "Marina" : String(data.get("firstName") ?? "Marina"), lastName: isSignIn ? "Costa" : String(data.get("lastName") ?? "Costa"), email });
    toast.success(isSignIn ? "Welcome back" : "Workspace ready");
    navigate("/dashboard");
  };
  return <PublicLayout><main className="auth-layout"><section className="auth-aside"><div className="auth-aside__inner"><p className="eyebrow"><span className="eyebrow-mark" />BitFinance / finance desk</p><h1>{isSignIn ? t("auth.signInTitle") : t("auth.signUpTitle")}</h1><p>{isSignIn ? t("auth.signInBody") : t("auth.signUpBody")}</p><div className="auth-aside__note"><Sparkles size={18} /><span>{t("auth.demoHint")}</span></div></div><div className="auth-aside__stamp">BF / 2026</div></section><section className="auth-panel"><div className="auth-panel__top"><Link to="/" className="back-link">← {i18n.language === "pt-BR" ? "Voltar ao início" : "Back to home"}</Link><button className="language-switch" onClick={() => { const next = i18n.language === "en-US" ? "pt-BR" : "en-US"; void i18n.changeLanguage(next); localStorage.setItem("bitfinance-v2-locale", next); }}>{i18n.language === "en-US" ? "EN" : "PT"}</button></div><form className="auth-form" onSubmit={submit}><div className="auth-form__heading"><span className="auth-form__icon">{isSignIn ? <LockKeyhole size={21} /> : <UserPlus size={21} />}</span><div><p className="eyebrow">{isSignIn ? "01 / sign in" : "01 / get started"}</p><h2>{isSignIn ? t("common.signIn") : t("common.signUp")}</h2></div></div>{!isSignIn && <div className="form-grid"><label><span>{t("auth.firstName")}</span><input name="firstName" placeholder="Marina" /></label><label><span>{t("auth.lastName")}</span><input name="lastName" placeholder="Costa" /></label></div>}<label><span>{t("auth.email")}</span><div className="input-with-icon"><Mail size={17} /><input name="email" type="email" placeholder="you@example.com" autoComplete="email" /></div></label><label><span>{t("auth.password")}</span><input name="password" type="password" placeholder="••••••••" autoComplete={isSignIn ? "current-password" : "new-password"} /></label>{error && <p className="form-error">{error}</p>}<Button type="submit" className="button--full button--large">{isSignIn ? t("common.signIn") : t("common.continue")} <ArrowUpRight size={17} /></Button><p className="auth-form__switch">{isSignIn ? t("auth.noAccount") : t("auth.haveAccount")} <Link to={isSignIn ? "/auth/sign-up" : "/auth/sign-in"}>{isSignIn ? t("common.signUp") : t("common.signIn")}</Link></p></form><div className="auth-panel__footer"><span><ShieldCheck size={14} /> Your demo data stays in this browser</span></div></section></main></PublicLayout>;
}

function JoinPage() {
  const { t } = useTranslation();
  const signIn = useDemoStore((state) => state.signIn);
  const navigate = useNavigate();
  return <PublicLayout><main className="center-page"><div className="center-card"><span className="center-card__icon"><UsersRound size={25} /></span><p className="eyebrow">Invitation / 2026</p><h1>Join Costa household</h1><p>Rafael invited you to see the workspace and keep the next decision in view.</p><Button onClick={() => { signIn(); toast.success("You joined the workspace"); navigate("/dashboard"); }}>{t("common.continue")} <ArrowRight size={16} /></Button><Link to="/auth/sign-in" className="text-link">Already have a BitFinance account?</Link></div></main></PublicLayout>;
}

function CreateOrganizationPage() {
  const { t } = useTranslation();
  const updateOrganization = useDemoStore((state) => state.updateOrganization);
  const signIn = useDemoStore((state) => state.signIn);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  return <PublicLayout><main className="center-page"><div className="center-card center-card--wide"><span className="center-card__icon"><Home size={25} /></span><p className="eyebrow">New workspace / 01</p><h1>Create a money desk</h1><p>Give the workspace a name. You can invite people and set a budget from the organization area.</p><label className="field-label"><span>{t("organization.name")}</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Costa household" /></label><Button disabled={!name.trim()} onClick={() => { updateOrganization("org-01", { name }); signIn(); navigate("/dashboard"); }}>{t("common.continue")} <ArrowRight size={16} /></Button></div></main></PublicLayout>;
}

function DashboardPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const organization = useDemoStore(selectActiveOrganization);
  const bills = useDemoStore((state) => state.bills);
  const expenses = useDemoStore((state) => state.expenses);
  const upcomingBills = bills.filter((bill) => ["upcoming", "due", "overdue"].includes(bill.status)).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4);
  const monthExpenses = expenses.filter((expense) => isThisMonth(new Date(expense.occurredAt)));
  const spent = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const upcomingTotal = upcomingBills.reduce((sum, bill) => sum + bill.amountDue, 0);
  const budget = organization?.budget ?? 0;
  const remaining = Math.max(budget - spent, 0);
  const percentage = budget ? Math.round((spent / budget) * 100) : 0;
  return <PageContainer><PageHeader eyebrow={t("dashboard.eyebrow")} title={t("dashboard.title")} description={t("dashboard.body")} actions={<div className="period-control"><span className="period-control__dot" />July 01 — July 31 <ChevronRight size={14} /></div>} /><div className="dashboard-intro"><div><span className="dashboard-intro__label">{t("dashboard.onTrack")}</span><p>Your committed money is <strong>{formatCurrency(upcomingTotal, locale)}</strong> this month.</p></div><div className="dashboard-intro__trend"><TrendingUp size={17} /><span>12.8%<small>vs last month</small></span></div></div><div className="metrics-grid"><MetricCard label={t("dashboard.budget")} value={formatCurrency(budget, locale)} detail="Current month limit" icon={WalletCards} tone="blue" progress={percentage} /><MetricCard label={t("dashboard.spent")} value={formatCurrency(spent, locale)} detail={`${percentage}% of budget used`} icon={BarChart3} tone="mint" /><MetricCard label={t("dashboard.remaining")} value={formatCurrency(remaining, locale)} detail="Available to spend" icon={CircleDollarSign} tone="ink" /><MetricCard label={t("dashboard.upcoming")} value={formatCurrency(upcomingTotal, locale)} detail={`${upcomingBills.length} commitments`} icon={ReceiptText} tone="amber" /></div><CashflowTimeline bills={bills} expenses={expenses} locale={locale} /><div className="dashboard-grid"><section className="surface-card"><SectionHeading title={t("dashboard.upcomingTitle")} description="The next decisions in line" action={<Link to="/dashboard/bills" className="inline-link">{t("common.viewAll")} <ArrowUpRight size={14} /></Link>} /><div className="compact-list">{upcomingBills.slice(0, 3).map((bill) => <Link to={`/dashboard/bills/${bill.id}`} className="compact-row" key={bill.id}><DataIcon type="bill" /><span><strong>{bill.description}</strong><small>{formatDate(bill.dueDate, locale)} · {categoryLabels[bill.category]}</small></span><span className="compact-row__amount"><strong>{formatCurrency(bill.amountDue, locale)}</strong><StatusPill status={bill.status} /></span></Link>)}</div></section><section className="surface-card"><SectionHeading title={t("dashboard.recentTitle")} description="A small read on the month" action={<Link to="/dashboard/expenses" className="inline-link">{t("common.viewAll")} <ArrowUpRight size={14} /></Link>} /><div className="recent-summary"><div className="recent-summary__chart"><KpiSparkline values={[.2, .34, .22, .52, .46, .7, .62, .82]} color="#23b89a" /><span><strong>{formatCurrency(spent, locale)}</strong><small>across {monthExpenses.length} transactions</small></span></div><div className="category-bars"><CategoryBar label="Food & home" value={42} color="mint" /><CategoryBar label="Transport" value={24} color="blue" /><CategoryBar label="Personal" value={18} color="amber" /></div></div></section></div><section className="quick-actions"><QuickAction to="/dashboard/bills" icon={ReceiptText} label={t("bills.add")} detail="Keep a commitment visible" /><QuickAction to="/dashboard/expenses" icon={ArrowDownRight} label={t("expenses.add")} detail="Record what just happened" /><QuickAction to="/account/organization" icon={WalletCards} label={t("dashboard.setBudget")} detail="Give the month a boundary" /></section></PageContainer>;
}

function CategoryBar({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="category-bar"><span><i className={`tiny-dot tiny-dot--${color}`} />{label}</span><span>{value}%</span><div><i className={`category-bar__fill category-bar__fill--${color}`} style={{ width: `${value * 1.8}%` }} /></div></div>;
}

function CashflowTimeline({ bills, expenses, locale }: { bills: Bill[]; expenses: Expense[]; locale: string }) {
  const { t } = useTranslation();
  const events = [...bills.filter((bill) => bill.status !== "cancelled").map((bill) => ({ date: bill.dueDate, label: bill.description, amount: bill.amountDue, kind: "bill" as const })), ...expenses.slice(0, 3).map((expense) => ({ date: expense.occurredAt, label: expense.description, amount: expense.amount, kind: "expense" as const }))].sort((a, b) => a.date.localeCompare(b.date));
  return <section className="timeline-card"><div className="timeline-card__header"><div><p className="eyebrow">{t("dashboard.flow")}</p><h2>{t("dashboard.flowBody")}</h2></div><span className="timeline-card__legend"><i className="tiny-dot tiny-dot--blue" /> money in <i className="tiny-dot tiny-dot--amber" /> commitments <i className="tiny-dot tiny-dot--mint" /> moved</span></div><div className="timeline" role="list">{events.map((event, index) => <div className={`timeline-event timeline-event--${event.kind}`} key={`${event.date}-${event.label}`} role="listitem" style={{ "--event-index": index } as CSSProperties}><span className="timeline-event__date">{formatDate(event.date, locale)}</span><span className="timeline-event__dot" /><span className="timeline-event__label">{event.label}</span><strong>{event.kind === "expense" ? "−" : ""}{formatCurrency(event.amount, locale)}</strong></div>)}</div></section>;
}

function BillsPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const bills = useDemoStore((state) => state.bills);
  const deleteBill = useDemoStore((state) => state.deleteBill);
  const markBillPaid = useDemoStore((state) => state.markBillPaid);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BillStatus | "all">("all");
  const [series, setSeries] = useState<BillSeriesType | "all">("all");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Bill | null>(null);
  const visibleBills = useMemo(() => bills.filter((bill) => bill.description.toLowerCase().includes(search.toLowerCase()) && (status === "all" || bill.status === status) && (series === "all" || bill.seriesType === series)), [bills, search, series, status]);
  const total = visibleBills.reduce((sum, bill) => sum + bill.amountDue, 0);
  const due = visibleBills.filter((bill) => ["due", "overdue"].includes(bill.status)).reduce((sum, bill) => sum + bill.amountDue, 0);
  const paid = visibleBills.filter((bill) => bill.status === "paid").reduce((sum, bill) => sum + bill.amountPaid!, 0);
  return <PageContainer><PageHeader eyebrow={t("bills.eyebrow")} title={t("bills.title")} description={t("bills.body")} actions={<Button onClick={() => setModal("add")}><Plus size={17} /> {t("bills.add")}</Button>} /><div className="stat-strip"><div><span>{t("bills.total")}</span><strong>{formatCurrency(total, locale)}</strong></div><div><span>{t("bills.due")}</span><strong className="text-amber">{formatCurrency(due, locale)}</strong></div><div><span>{t("bills.paid")}</span><strong className="text-mint">{formatCurrency(paid, locale)}</strong></div></div><div className="filter-bar"><label className="search-field"><Search size={17} /><input placeholder={t("bills.search")} value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="select-field"><Filter size={15} /><select value={status} onChange={(event) => setStatus(event.target.value as BillStatus | "all")}><option value="all">{t("common.all")} statuses</option><option value="upcoming">Upcoming</option><option value="due">Due</option><option value="overdue">Overdue</option><option value="paid">Paid</option></select></label><label className="select-field"><select value={series} onChange={(event) => setSeries(event.target.value as BillSeriesType | "all")}><option value="all">All types</option><option value="recurring">Recurring</option><option value="installment">Installments</option></select></label></div><section className="surface-card surface-card--table"><div className="table-head"><span>Commitment</span><span>Due date</span><span>Type</span><span>Amount</span><span>Status</span><span aria-label="Actions" /></div>{visibleBills.length ? visibleBills.map((bill) => <BillRow key={bill.id} bill={bill} locale={locale} onDetails={() => { setSelected(bill); setModal("edit"); }} onDelete={() => { deleteBill(bill.id); toast.success("Bill removed"); }} onPaid={() => { markBillPaid(bill.id); toast.success("Bill marked as paid"); }} />) : <EmptyState icon={ReceiptText} title={t("common.noResults")} description={t("bills.empty")} action={<Button variant="secondary" onClick={() => { setSearch(""); setStatus("all"); setSeries("all"); }}>Clear filters</Button>} />}</section>{modal === "add" && <BillModal onClose={() => setModal(null)} />}{modal === "edit" && selected && <BillModal bill={selected} onClose={() => { setModal(null); setSelected(null); }} />}</PageContainer>;
}

function BillRow({ bill, locale, onDetails, onDelete, onPaid }: { bill: Bill; locale: string; onDetails: () => void; onDelete: () => void; onPaid: () => void }) {
  return <div className="table-row"><div className="table-row__primary"><DataIcon type="bill" /><span><strong>{bill.description}</strong><small>{categoryLabels[bill.category]}{bill.seriesType === "installment" && ` · ${bill.occurrence}/${bill.totalOccurrences} installment`}</small></span></div><span>{formatDate(bill.dueDate, locale)}<small>{relativeDate(bill.dueDate)}</small></span><span>{bill.seriesType ? <span className="type-label"><i className={`tiny-dot tiny-dot--${bill.seriesType === "recurring" ? "blue" : "amber"}`} />{bill.seriesType}</span> : <span className="muted">One time</span>}</span><strong>{formatCurrency(bill.amountDue, locale)}</strong><StatusPill status={bill.status} /><div className="row-actions"><ActionMenu onEdit={onDetails} onPaid={onPaid} canPay={bill.status !== "paid"} detailHref={`/dashboard/bills/${bill.id}`} onDelete={onDelete} /></div></div>;
}

function BillModal({ bill, onClose }: { bill?: Bill; onClose: () => void }) {
  const { t } = useTranslation();
  const addBill = useDemoStore((state) => state.addBill);
  const updateBill = useDemoStore((state) => state.updateBill);
  const [kind, setKind] = useState<BillSeriesType | "one-time">(bill?.seriesType ?? "one-time");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input: NewBillInput = { description: String(data.get("description") ?? "Untitled bill"), category: String(data.get("category") ?? "miscellaneous") as BillCategory, amountDue: Number(data.get("amount") ?? 0), dueDate: new Date(`${String(data.get("dueDate"))}T12:00:00`).toISOString(), seriesType: kind === "one-time" ? null : kind, frequency: kind === "one-time" ? null : String(data.get("frequency") ?? "monthly") as BillFrequency, totalOccurrences: kind === "installment" ? Number(data.get("occurrences") ?? 1) : null };
    if (bill) { updateBill(bill.id, input); toast.success("Bill updated"); } else { addBill(input); toast.success("Bill added"); }
    onClose();
  };
  return <Modal title={bill ? "Edit bill" : t("bills.add")} description="Keep the important parts visible. You can refine the details later." onClose={onClose}><form className="modal-form" onSubmit={submit}><label><span>Description</span><input name="description" defaultValue={bill?.description} placeholder="Apartment rent" required /></label><div className="form-grid"><label><span>Category</span><select name="category" defaultValue={bill?.category ?? "housing"}>{Object.entries(categoryLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label><span>Amount</span><input name="amount" type="number" min="0" step="0.01" defaultValue={bill?.amountDue} required /></label></div><div className="form-grid"><label><span>Due date</span><input name="dueDate" type="date" defaultValue={bill ? inputDate(bill.dueDate) : inputDate(new Date().toISOString())} required /></label><label><span>Pattern</span><select value={kind} onChange={(event) => setKind(event.target.value as BillSeriesType | "one-time")}><option value="one-time">One time</option><option value="recurring">Recurring</option><option value="installment">Installment</option></select></label></div>{kind !== "one-time" && <div className="form-grid"><label><span>Frequency</span><select name="frequency" defaultValue={bill?.frequency ?? "monthly"}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="annually">Annually</option></select></label>{kind === "installment" && <label><span>Occurrences</span><input name="occurrences" type="number" min="2" defaultValue={bill?.totalOccurrences ?? 6} /></label>}</div>}<div className="modal-form__actions"><Button type="button" variant="ghost" onClick={onClose}>{t("common.cancel")}</Button><Button type="submit">{bill ? t("common.save") : t("bills.add")} <ArrowUpRight size={16} /></Button></div></form></Modal>;
}

function BillDetailsPage() {
  const { billId } = useParams();
  const bill = useDemoStore((state) => state.bills.find((item) => item.id === billId));
  const locale = useLocale();
  const markBillPaid = useDemoStore((state) => state.markBillPaid);
  const navigate = useNavigate();
  if (!bill) return <PageContainer><EmptyState icon={ReceiptText} title="Bill not found" description="This demo record is no longer available." action={<Button onClick={() => navigate("/dashboard/bills")}>Back to bills</Button>} /></PageContainer>;
  return <PageContainer><Link to="/dashboard/bills" className="back-link">← Back to bills</Link><PageHeader eyebrow="Bill detail" title={bill.description} description={`${categoryLabels[bill.category]} · ${formatLongDate(bill.dueDate, locale)}`} actions={bill.status !== "paid" ? <Button onClick={() => { markBillPaid(bill.id); toast.success("Bill marked as paid"); }}>{tMarkPaid()} <Check size={16} /></Button> : <StatusPill status="paid" />} /><div className="detail-grid"><section className="surface-card detail-card"><div className="detail-card__amount"><span>Amount due</span><strong>{formatCurrency(bill.amountDue, locale)}</strong><StatusPill status={bill.status} /></div><dl className="detail-list"><div><dt>Due date</dt><dd>{formatLongDate(bill.dueDate, locale)}</dd></div><div><dt>Category</dt><dd>{categoryLabels[bill.category]}</dd></div><div><dt>Schedule</dt><dd>{bill.seriesType ? `${bill.seriesType} · ${bill.frequency}` : "One-time"}</dd></div>{bill.occurrence && <div><dt>Installment</dt><dd>{bill.occurrence} of {bill.totalOccurrences}</dd></div>}</dl></section><section className="surface-card detail-card"><SectionHeading title="Attachments" description="Receipts and documents for this commitment." action={<Button variant="secondary"><FilePlus2 size={16} /> Add file</Button>} />{bill.documents.length ? bill.documents.map((doc) => <div className="attachment-row" key={doc.id}><DataIcon type="bill" /><span><strong>{doc.fileName}</strong><small>{doc.fileCategory} · demo file</small></span><IconButton label="Download"><ArrowUpRight size={16} /></IconButton></div>) : <EmptyState icon={FilePlus2} title="No attachments yet" description="Add a receipt or boleto when you have one." />}</section></div></PageContainer>;
}

function tMarkPaid() { return "Mark as paid"; }

function ExpensesPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const expenses = useDemoStore((state) => state.expenses);
  const deleteExpense = useDemoStore((state) => state.deleteExpense);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ExpenseStatus | "all">("all");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<Expense | null>(null);
  const visibleExpenses = expenses.filter((expense) => expense.description.toLowerCase().includes(search.toLowerCase()) && (status === "all" || expense.status === status));
  const total = visibleExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  return <PageContainer><PageHeader eyebrow={t("expenses.eyebrow")} title={t("expenses.title")} description={t("expenses.body")} actions={<Button onClick={() => setModal("add")}><Plus size={17} /> {t("expenses.add")}</Button>} /><div className="stat-strip"><div><span>{t("expenses.total")}</span><strong>{formatCurrency(total, locale)}</strong></div><div><span>{t("expenses.transactions")}</span><strong>{visibleExpenses.length}</strong></div><div><span>Average</span><strong>{formatCurrency(visibleExpenses.length ? total / visibleExpenses.length : 0, locale)}</strong></div></div><div className="filter-bar"><label className="search-field"><Search size={17} /><input placeholder={t("expenses.search")} value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="select-field"><Filter size={15} /><select value={status} onChange={(event) => setStatus(event.target.value as ExpenseStatus | "all")}><option value="all">{t("common.all")} statuses</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option></select></label></div><section className="surface-card surface-card--table"><div className="table-head table-head--expenses"><span>Expense</span><span>Date</span><span>Category</span><span>Amount</span><span>Status</span><span aria-label="Actions" /></div>{visibleExpenses.length ? visibleExpenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} locale={locale} onDetails={() => { setSelected(expense); setModal("edit"); }} onDelete={() => { deleteExpense(expense.id); toast.success("Expense removed"); }} />) : <EmptyState icon={BarChart3} title={t("common.noResults")} description={t("expenses.empty")} action={<Button variant="secondary" onClick={() => { setSearch(""); setStatus("all"); }}>Clear filters</Button>} />}</section>{modal && <ExpenseModal expense={modal === "edit" ? selected ?? undefined : undefined} onClose={() => { setModal(null); setSelected(null); }} />}</PageContainer>;
}

function ExpenseRow({ expense, locale, onDetails, onDelete }: { expense: Expense; locale: string; onDetails: () => void; onDelete: () => void }) {
  return <div className="table-row table-row--expense"><div className="table-row__primary"><DataIcon type="expense" /><span><strong>{expense.description}</strong><small>Added {relativeDate(expense.occurredAt)}</small></span></div><span>{formatDate(expense.occurredAt, locale)}</span><span><span className="type-label"><i className="tiny-dot tiny-dot--mint" />{categoryLabels[expense.category]}</span></span><strong>{formatCurrency(expense.amount, locale)}</strong><StatusPill status={expense.status} /><div className="row-actions"><ActionMenu onEdit={onDetails} detailHref={`/dashboard/expenses/${expense.id}`} onDelete={onDelete} /></div></div>;
}

function ExpenseModal({ expense, onClose }: { expense?: Expense; onClose: () => void }) {
  const { t } = useTranslation();
  const addExpense = useDemoStore((state) => state.addExpense);
  const updateExpense = useDemoStore((state) => state.updateExpense);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input: NewExpenseInput = { description: String(data.get("description") ?? "Untitled expense"), category: String(data.get("category") ?? "miscellaneous") as ExpenseCategory, amount: Number(data.get("amount") ?? 0), occurredAt: new Date(`${String(data.get("date"))}T12:00:00`).toISOString() };
    if (expense) { updateExpense(expense.id, input); toast.success("Expense updated"); } else { addExpense(input); toast.success("Expense added"); }
    onClose();
  };
  return <Modal title={expense ? "Edit expense" : t("expenses.add")} description="A quick record is enough. Add the context you’ll want later." onClose={onClose}><form className="modal-form" onSubmit={submit}><label><span>Description</span><input name="description" defaultValue={expense?.description} placeholder="Weekly groceries" required /></label><div className="form-grid"><label><span>Category</span><select name="category" defaultValue={expense?.category ?? "food"}>{Object.entries(categoryLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label><span>Amount</span><input name="amount" type="number" min="0" step="0.01" defaultValue={expense?.amount} required /></label></div><label><span>Date</span><input name="date" type="date" defaultValue={expense ? inputDate(expense.occurredAt) : inputDate(new Date().toISOString())} required /></label><div className="modal-form__actions"><Button type="button" variant="ghost" onClick={onClose}>{t("common.cancel")}</Button><Button type="submit">{expense ? t("common.save") : t("expenses.add")} <ArrowUpRight size={16} /></Button></div></form></Modal>;
}

function ExpenseDetailsPage() {
  const { expenseId } = useParams();
  const expense = useDemoStore((state) => state.expenses.find((item) => item.id === expenseId));
  const locale = useLocale();
  const navigate = useNavigate();
  if (!expense) return <PageContainer><EmptyState icon={BarChart3} title="Expense not found" description="This demo record is no longer available." action={<Button onClick={() => navigate("/dashboard/expenses")}>Back to expenses</Button>} /></PageContainer>;
  return <PageContainer><Link to="/dashboard/expenses" className="back-link">← Back to expenses</Link><PageHeader eyebrow="Expense detail" title={expense.description} description={`${categoryLabels[expense.category]} · ${formatLongDate(expense.occurredAt, locale)}`} actions={<StatusPill status={expense.status} />} /><div className="detail-grid"><section className="surface-card detail-card"><div className="detail-card__amount"><span>Amount</span><strong>{formatCurrency(expense.amount, locale)}</strong><StatusPill status={expense.status} /></div><dl className="detail-list"><div><dt>Occurred</dt><dd>{formatLongDate(expense.occurredAt, locale)}</dd></div><div><dt>Category</dt><dd>{categoryLabels[expense.category]}</dd></div><div><dt>Created by</dt><dd>Marina Costa</dd></div></dl></section><section className="surface-card detail-card"><SectionHeading title="Attachments" description="Receipts and documents for this expense." action={<Button variant="secondary"><FilePlus2 size={16} /> Add file</Button>} />{expense.documents.length ? expense.documents.map((doc) => <div className="attachment-row" key={doc.id}><DataIcon type="expense" /><span><strong>{doc.fileName}</strong><small>{doc.fileCategory} · demo file</small></span><IconButton label="Download"><ArrowUpRight size={16} /></IconButton></div>) : <EmptyState icon={FilePlus2} title="No attachments yet" description="Add a receipt when you have one." />}</section></div></PageContainer>;
}

function OrganizationPage() {
  const { t } = useTranslation();
  const locale = useLocale();
  const organization = useDemoStore(selectActiveOrganization);
  const members = useDemoStore((state) => state.members);
  const updateOrganization = useDemoStore((state) => state.updateOrganization);
  const [name, setName] = useState(organization?.name ?? "");
  const [budget, setBudget] = useState(String(organization?.budget ?? ""));
  if (!organization) return null;
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); updateOrganization(organization.id, { name, budget: Number(budget) || null }); toast.success("Workspace settings saved"); };
  return <PageContainer><PageHeader eyebrow={t("organization.eyebrow")} title={t("organization.title")} description={t("organization.body")} actions={<Link to="/organization/members" className="button button--secondary"><UsersRound size={17} /> {t("nav.members")}</Link>} /><div className="organization-layout"><section className="surface-card organization-hero"><div className="organization-hero__mark"><Building2 size={25} /></div><div><p className="eyebrow">Active workspace</p><h2>{organization.name}</h2><p>Created {formatLongDate(organization.createdAt, locale)} · {organization.timezone}</p></div><span className="organization-hero__status"><span className="live-dot" /> Active</span></section><div className="organization-grid"><section className="surface-card"><SectionHeading title={t("organization.settings")} description="The context shown across your finance desk." /><form className="modal-form" onSubmit={submit}><label><span>{t("organization.name")}</span><input value={name} onChange={(event) => setName(event.target.value)} /></label><label><span>{t("organization.timezone")}</span><select defaultValue={organization.timezone}><option>America/Fortaleza</option><option>America/Sao_Paulo</option><option>America/New_York</option></select></label><Button type="submit">{t("common.save")} <Check size={16} /></Button></form></section><section className="surface-card budget-card"><SectionHeading title={t("organization.budget")} description="A boundary for the month, not a judgment." /><div className="budget-card__number"><span>Monthly limit</span><strong>{formatCurrency(organization.budget ?? 0, locale)}</strong></div><form className="inline-form" onSubmit={submit}><input aria-label="Monthly budget" type="number" min="0" step="0.01" value={budget} onChange={(event) => setBudget(event.target.value)} /><Button type="submit">Update</Button></form><div className="budget-card__footer"><span><CircleDollarSign size={15} /> Budget updates the dashboard instantly</span></div></section></div><section className="surface-card organization-members-preview"><SectionHeading title={t("organization.members")} description={t("organization.memberBody")} action={<Link to="/organization/members" className="inline-link">Manage members <ArrowUpRight size={14} /></Link>} /><div className="member-stack">{members.slice(0, 3).map((member) => <div className="member-chip" key={member.id}><Avatar initials={member.initials} size="sm" /><span><strong>{member.name}</strong><small>{member.role}</small></span></div>)}</div></section></div></PageContainer>;
}

function MembersPage() {
  const { t } = useTranslation();
  const members = useDemoStore((state) => state.members);
  const inviteMember = useDemoStore((state) => state.inviteMember);
  const [inviteOpen, setInviteOpen] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); inviteMember(String(data.get("email") ?? "new@bitfinance.dev"), String(data.get("role") ?? "Member") as "Admin" | "Member"); setInviteOpen(false); toast.success("Invite created"); };
  return <PageContainer><PageHeader eyebrow={t("organization.eyebrow")} title={t("organization.membersTitle")} description={t("organization.membersBody")} actions={<Button onClick={() => setInviteOpen(true)}><UserPlus size={17} /> {t("common.invite")}</Button>} /><section className="surface-card members-card"><div className="members-card__summary"><div><span className="eyebrow">Access overview</span><strong>{members.length} people</strong><p>Everyone with access to this workspace.</p></div><span className="members-card__badge"><ShieldCheck size={15} /> Protected</span></div><div className="members-list">{members.map((member) => <div className="member-row" key={member.id}><Avatar initials={member.initials} size="md" /><span><strong>{member.name}</strong><small>{member.email}</small></span><span className={`role-badge role-badge--${member.role.toLowerCase()}`}>{member.role}</span><span className="member-row__joined">Joined {relativeDate(member.joinedAt)}</span><IconButton label="Member actions"><MoreHorizontal size={18} /></IconButton></div>)}</div></section>{inviteOpen && <Modal title={t("common.invite")} description="The invite is simulated and stays in this browser." onClose={() => setInviteOpen(false)}><form className="modal-form" onSubmit={submit}><label><span>Email address</span><input name="email" type="email" placeholder="teammate@example.com" required /></label><label><span>Role</span><select name="role"><option value="Member">Member</option><option value="Admin">Admin</option></select></label><div className="modal-form__actions"><Button type="button" variant="ghost" onClick={() => setInviteOpen(false)}>{t("common.cancel")}</Button><Button type="submit">{t("common.invite")} <ArrowUpRight size={16} /></Button></div></form></Modal>}</PageContainer>;
}

function AccountPage() {
  const { t, i18n } = useTranslation();
  const user = useDemoStore((state) => state.user);
  const updateProfile = useDemoStore((state) => state.updateProfile);
  const resetDemo = useDemoStore((state) => state.resetDemo);
  const signOut = useDemoStore((state) => state.signOut);
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [theme, setTheme] = useState<"light" | "dark">(() => localStorage.getItem("bitfinance-v2-theme") === "dark" ? "dark" : "light");
  useEffect(() => { document.documentElement.dataset.theme = theme === "dark" ? "dark" : ""; localStorage.setItem("bitfinance-v2-theme", theme); }, [theme]);
  const saveProfile = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); updateProfile({ firstName, lastName }); toast.success("Profile saved"); };
  const changeLanguage = (language: string) => { void i18n.changeLanguage(language); localStorage.setItem("bitfinance-v2-locale", language); };
  return <PageContainer><PageHeader eyebrow={t("account.eyebrow")} title={t("account.title")} description={t("account.body")} /><div className="account-layout"><section className="surface-card profile-card"><SectionHeading title={t("account.profile")} description="The name and email shown to your workspace." /><div className="profile-card__identity"><Avatar initials={initials(firstName, lastName)} src={user?.avatarUrl} size="lg" /><div><strong>{firstName} {lastName}</strong><span>{user?.email}</span></div><Button variant="secondary">Change avatar</Button></div><form className="form-grid account-form" onSubmit={saveProfile}><label><span>{t("auth.firstName")}</span><input value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label><label><span>{t("auth.lastName")}</span><input value={lastName} onChange={(event) => setLastName(event.target.value)} /></label><Button type="submit">{t("common.save")} <Check size={16} /></Button></form></section><section className="surface-card preferences-card"><SectionHeading title={t("account.appearance")} description="The desk follows your preferences." /><div className="preference-row"><span><Globe2 size={17} /><span><strong>{t("account.language")}</strong><small>Choose your interface language</small></span></span><select value={i18n.language} onChange={(event) => changeLanguage(event.target.value)}><option value="en-US">English</option><option value="pt-BR">Português</option></select></div><div className="preference-row"><span><SunMediumIcon /><span><strong>{t("account.theme")}</strong><small>Choose a light or dark desk</small></span></span><span className="theme-pills"><button type="button" className={`theme-pill ${theme === "light" ? "theme-pill--active" : ""}`} onClick={() => setTheme("light")}>Light</button><button type="button" className={`theme-pill ${theme === "dark" ? "theme-pill--active" : ""}`} onClick={() => setTheme("dark")}>Dark</button></span></div><div className="preference-row preference-row--danger"><span><RotateCcwIcon /><span><strong>{t("account.reset")}</strong><small>Restore the original demo records</small></span></span><Button variant="secondary" onClick={() => { resetDemo(); toast.success("Demo reset"); }}>{t("common.reset")}</Button></div><div className="account-signout"><Button variant="ghost" onClick={() => { signOut(); navigate("/auth/sign-in"); }}><LogOutIcon /> {t("account.signOut")}</Button></div></section></div></PageContainer>;
}

function SunMediumIcon() { return <SunMedium size={17} />; }
function RotateCcwIcon() { return <RotateCcw size={17} />; }
function LogOutIcon() { return <ArrowRight size={17} />; }

function MorePage() {
  const { t } = useTranslation();
  return <PageContainer><PageHeader eyebrow="More / workspace" title="More" description="The useful edges of your finance desk." /><div className="more-grid"><QuickAction to="/account/organization" icon={Building2} label={t("nav.organization")} detail="Budget and workspace settings" /><QuickAction to="/organization/members" icon={UsersRound} label={t("nav.members")} detail="People with access" /><QuickAction to="/account/settings" icon={Settings2} label={t("nav.account")} detail="Profile and preferences" /></div></PageContainer>;
}

function NotFoundPage() {
  return <PublicLayout><main className="center-page"><div className="center-card"><span className="center-card__icon"><Search size={25} /></span><p className="eyebrow">404 / not found</p><h1>That page moved.</h1><p>The demo can still help you find the next step.</p><Link to="/dashboard" className="button button--primary">Back to the desk <ArrowRight size={16} /></Link></div></main></PublicLayout>;
}
