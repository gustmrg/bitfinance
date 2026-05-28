import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function GoToDashboardButton() {
  const { t } = useTranslation();

  return (
    <NavLink to="/dashboard">
      <Button variant="outline">{t("labels.goToDashboard")}</Button>
    </NavLink>
  );
}
