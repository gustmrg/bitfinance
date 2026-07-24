import { formatCurrency } from "@/lib/format";

export function Currency({
  value,
  locale = "en-US",
  className = "",
}: {
  value: number;
  locale?: string;
  className?: string;
}) {
  return <span className={className}>{formatCurrency(value, locale)}</span>;
}
