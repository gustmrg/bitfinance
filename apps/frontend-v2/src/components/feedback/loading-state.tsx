import { useTranslation } from "react-i18next";

export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="empty-state" role="status">
      <span className="spinner" aria-hidden="true" />
      <h3>{label ?? t("common.loading")}</h3>
    </div>
  );
}
