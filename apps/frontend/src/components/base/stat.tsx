import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const tones = {
  default: "text-ink",
  brand: "text-brand-ink",
  success: "text-success",
  danger: "text-danger",
} as const;

export function Stat({
  label,
  value,
  detail,
  tone = "default",
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <div className={cn("grid content-start gap-1", className)}>
      <span
        className={cn(
          "text-[13px] font-semibold",
          tone === "default" ? "text-ink-muted" : tones[tone],
        )}
      >
        {label}
      </span>
      <span className={cn("text-[22px] font-extrabold tabular-nums tracking-tight", tones[tone])}>
        {value}
      </span>
      {detail && <span className="text-[13px] text-ink-muted">{detail}</span>}
    </div>
  );
}
