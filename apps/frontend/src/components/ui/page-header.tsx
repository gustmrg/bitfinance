import { isValidElement, type ReactNode } from "react";
import { PeriodPicker } from "@/components/navigation/period-picker";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  const labelsPeriodControl =
    isValidElement<{ className?: string }>(actions) &&
    actions.props.className?.split(/\s+/).includes("period-control") === true;
  return (
    <header className="page-header">
      <div>
        {!labelsPeriodControl && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-header__description">{description}</p>}
      </div>
      {actions && (
        <div className="page-header__actions">
          {labelsPeriodControl && <p className="eyebrow">{eyebrow}</p>}
          {labelsPeriodControl ? <PeriodPicker /> : actions}
        </div>
      )}
    </header>
  );
}
