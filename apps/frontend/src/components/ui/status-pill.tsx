import { useTranslation } from "react-i18next";

export function StatusPill({ status }: { status: string }) {
  const { t } = useTranslation();
  const label = t(`statuses.${status}`, { defaultValue: status.replaceAll("_", " ") });
  return <span className={`status-pill status-pill--${status}`}>{label}</span>;
}
