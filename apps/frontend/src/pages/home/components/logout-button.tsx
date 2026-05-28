import { useTranslation } from "react-i18next";

import { useLogoutAction } from "@/auth/auth-provider";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const { t } = useTranslation();
  const logout = useLogoutAction();

  return (
    <Button onClick={async () => await logout()}>
      {t("labels.logout")}
    </Button>
  );
}
