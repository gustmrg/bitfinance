import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export function QuickAction({
  to,
  icon: Icon,
  label,
  detail,
}: {
  to: string;
  icon: typeof ArrowUpRight;
  label: string;
  detail: string;
}) {
  return (
    <Link to={to} className="quick-action">
      <span className="quick-action__icon">
        <Icon size={18} />
      </span>
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <ArrowUpRight size={16} />
    </Link>
  );
}
