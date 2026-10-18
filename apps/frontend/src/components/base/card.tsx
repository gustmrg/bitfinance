import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

const paddings = { none: "", md: "p-5", lg: "p-6 sm:p-7" } as const;

const tones = {
  default: "border border-line bg-surface text-ink",
  brand: "bg-brand text-on-brand",
} as const;

export function Card({
  as: Component = "section",
  padding = "lg",
  tone = "default",
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: "section" | "div" | "article";
  padding?: keyof typeof paddings;
  tone?: keyof typeof tones;
}) {
  return (
    <Component
      className={cn("rounded-card", tones[tone], paddings[padding], className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  titleId,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  titleId?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-start justify-between gap-4", className)}>
      <div className="grid gap-1">
        <h2 id={titleId} className="m-0 text-[19px] font-extrabold tracking-tight text-ink">
          {title}
        </h2>
        {description && <p className="m-0 text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
