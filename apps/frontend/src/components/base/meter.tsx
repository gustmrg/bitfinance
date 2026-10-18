import { cn } from "@/lib/cn";

const segmentColors = {
  brand: "bg-brand",
  "chart-1": "bg-chart-1",
  "chart-2": "bg-chart-2",
  "chart-3": "bg-chart-3",
  inverse: "bg-white",
  "inverse-muted": "bg-white/55",
} as const;

export type MeterSegment = { value: number; color: keyof typeof segmentColors };

export function Meter({
  label,
  segments,
  max,
  variant = "default",
  size = "md",
  className,
}: {
  label: string;
  segments: MeterSegment[];
  max: number;
  variant?: "default" | "inverse";
  size?: "sm" | "md";
  className?: string;
}) {
  const total = Math.max(max, 0);
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "flex gap-0.5 overflow-hidden rounded-full",
        size === "md" ? "h-3" : "h-2",
        variant === "inverse" ? "bg-white/20" : "bg-line",
        className,
      )}
    >
      {segments.map((segment, index) => (
        <span
          key={index}
          className={cn("h-full shrink-0", segmentColors[segment.color])}
          style={{ width: total ? `${Math.min((segment.value / total) * 100, 100)}%` : "0%" }}
        />
      ))}
    </div>
  );
}
