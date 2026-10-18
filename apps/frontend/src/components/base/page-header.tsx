import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-center justify-between gap-4", className)}>
      <div className="grid gap-0.5">
        <h1 className="m-0 text-[28px] font-extrabold leading-tight tracking-[-0.035em] text-ink">
          {title}
        </h1>
        {description && <p className="m-0 text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
