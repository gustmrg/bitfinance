import { CheckCircle2, CircleAlert, Clock3 } from "lucide-react";
import { Badge } from "@/components/base/badge";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/cn";
import { dueState } from "@/lib/due";
import { useDueLabel } from "./use-due-label";

export function DueStatus({
  dueDate,
  status,
  variant = "badge",
}: {
  dueDate: string;
  status: string;
  variant?: "badge" | "text";
}) {
  const label = useDueLabel();
  const state = dueState(dueDate, status);
  const text = label(state);
  if (variant === "text")
    return (
      <span
        className={cn(
          "text-[13px]",
          state.kind === "overdue" && "font-semibold text-danger",
          (state.kind === "today" || state.kind === "tomorrow" || state.kind === "soon") &&
            "font-semibold text-warning",
          state.kind === "paid" && "font-semibold text-success",
          (state.kind === "later" || state.kind === "cancelled") && "text-ink-muted",
        )}
      >
        {text}
      </span>
    );
  if (state.kind === "overdue")
    return (
      <Badge tone="danger" icon={<CircleAlert size={13} aria-hidden="true" />}>
        {text}
      </Badge>
    );
  if (state.kind === "today" || state.kind === "tomorrow" || state.kind === "soon")
    return (
      <Badge tone="warning" icon={<Clock3 size={13} aria-hidden="true" />}>
        {text}
      </Badge>
    );
  if (state.kind === "paid")
    return (
      <Badge tone="success" icon={<CheckCircle2 size={13} aria-hidden="true" />}>
        {text}
      </Badge>
    );
  return <span className="text-[13px] text-ink-muted">{text}</span>;
}

export function DateChip({
  date,
  tone = "default",
}: {
  date: string;
  tone?: "default" | "danger";
}) {
  const locale = useLocale();
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  const value = new Date(year, month - 1, day);
  return (
    <span
      className={cn(
        "grid w-12 justify-items-center rounded-control py-1.5",
        tone === "danger" ? "bg-danger-soft text-danger" : "bg-brand-soft text-brand-ink",
      )}
    >
      <span className="text-base font-extrabold leading-tight tabular-nums">{day}</span>
      <span className="text-[10px] font-bold uppercase">
        {new Intl.DateTimeFormat(locale, { month: "short" }).format(value).replace(".", "")}
      </span>
    </span>
  );
}
