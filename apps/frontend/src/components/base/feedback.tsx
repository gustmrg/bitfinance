import { FileText, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  action,
  className,
}: {
  icon?: typeof FileText;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid justify-items-center gap-2 px-6 py-12 text-center", className)}>
      <span className="mb-1 inline-grid size-12 place-items-center rounded-full bg-brand-soft text-brand-ink">
        <Icon size={22} aria-hidden="true" />
      </span>
      <h3 className="m-0 text-base font-extrabold text-ink">{title}</h3>
      {description && <p className="m-0 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: ReactNode;
  onRetry: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <EmptyState
      className={className}
      icon={RotateCcw}
      title={t("errors.attention")}
      description={message}
      action={
        <Button variant="secondary" onClick={onRetry}>
          {t("errors.tryAgain")}
        </Button>
      }
    />
  );
}

export function LoadingState({ label, className }: { label?: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      className={cn("grid justify-items-center gap-3 px-6 py-16 text-sm text-ink-muted", className)}
    >
      <span
        aria-hidden="true"
        className="size-7 animate-spin rounded-full border-[3px] border-line border-t-brand"
      />
      {label ?? t("common.loading")}
    </div>
  );
}
