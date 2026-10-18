import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function IconButton({
  label,
  variant = "ghost",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; variant?: "ghost" | "secondary" }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-grid size-11 shrink-0 cursor-pointer place-items-center rounded-control text-ink transition-colors",
        "hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "secondary" && "border border-line-strong bg-surface",
        className,
      )}
      {...props}
    />
  );
}
