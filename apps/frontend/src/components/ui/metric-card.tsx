import { WalletCards } from "lucide-react";

export function MetricCard({
  label,
  value,
  detail,
  tone = "blue",
  icon: Icon,
  progress,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "blue" | "mint" | "amber" | "ink";
  icon: typeof WalletCards;
  progress?: number;
}) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__top">
        <span>{label}</span>
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
      {progress !== undefined && (
        <div className="meter">
          <span style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}
    </article>
  );
}
