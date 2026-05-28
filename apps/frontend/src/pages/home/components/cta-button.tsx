import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function CTAButton() {
  const { t } = useTranslation();

  return (
    <NavLink to="/auth/sign-up">
      <Button size="lg" className="w-full px-8">{t("home.cta")}</Button>
    </NavLink>
  );
}
