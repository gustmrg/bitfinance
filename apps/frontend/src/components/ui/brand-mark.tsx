import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <Link
      to="/"
      className={`brand-mark ${compact ? "brand-mark--compact" : ""}`}
      aria-label={`BitFinance / ${t("common.backHome")}`}
    >
      <span className="brand-mark__dot" />
      <span className="brand-mark__word">
        bit<span>finance</span>
      </span>
    </Link>
  );
}
