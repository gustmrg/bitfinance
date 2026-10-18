import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format";

export function Amount({
  value,
  negative = false,
  className,
}: {
  value: number;
  negative?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  return (
    <span className={cn("whitespace-nowrap tabular-nums", className)}>
      {negative ? "− " : ""}
      {formatCurrency(Math.abs(value), locale)}
    </span>
  );
}
