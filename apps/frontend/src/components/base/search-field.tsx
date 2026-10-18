import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function SearchField({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label
      className={cn(
        "flex h-11 min-w-0 items-center gap-2 rounded-control border border-line-strong bg-surface px-3.5 focus-within:border-brand focus-within:outline-2 focus-within:outline-brand/30",
        className,
      )}
    >
      <Search size={17} className="shrink-0 text-ink-muted" aria-hidden="true" />
      <span className="sr-only">{label}</span>
      <input
        type="search"
        placeholder={label}
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
        {...props}
      />
    </label>
  );
}
