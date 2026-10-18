import { cn } from "@/lib/cn";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
  tone?: "default" | "danger";
};

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex max-w-full overflow-x-auto rounded-control bg-line p-0.5",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-[10px] px-3.5 text-sm font-semibold transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand",
              selected ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink",
              option.tone === "danger" && !selected && "text-danger",
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="tabular-nums text-ink-muted">{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
