import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function LoginButton() {
  const { t } = useTranslation();

  return (
    <NavLink to="/auth/sign-in">
      <Button>{t("labels.signIn")}</Button>
    </NavLink>
  );
}
