import { Menu } from "@base-ui/react/menu";
import { CreditCard, Plus, ReceiptText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const itemClasses =
  "flex h-12 cursor-pointer items-center gap-3 rounded-[10px] px-3 text-[15px] font-semibold text-ink outline-none data-highlighted:bg-surface-muted";

export function QuickAddMenu() {
  const { t } = useTranslation();
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={t("nav.quickAdd")}
        className="mx-auto -mt-5 inline-grid size-14 cursor-pointer place-items-center rounded-[18px] bg-brand text-on-brand shadow-lg shadow-brand/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Plus size={26} strokeWidth={2.4} aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="top" sideOffset={12} collisionPadding={12} className="z-50">
          <Menu.Popup className="w-60 rounded-card border border-line bg-surface p-2 font-sans shadow-xl outline-none">
            <Menu.LinkItem render={<Link to="/expenses?new=1" />} className={itemClasses}>
              <CreditCard size={20} className="text-brand-ink" aria-hidden="true" />
              {t("expenses.add")}
            </Menu.LinkItem>
            <Menu.LinkItem render={<Link to="/bills?new=1" />} className={itemClasses}>
              <ReceiptText size={20} className="text-brand-ink" aria-hidden="true" />
              {t("bills.add")}
            </Menu.LinkItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
