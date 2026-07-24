import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IconButton } from "@/components/ui/icon-button";

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <IconButton label={t("common.openMenu")} onClick={onClick}>
      <Menu size={20} />
    </IconButton>
  );
}
