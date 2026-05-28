import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  isAppNavItemActive,
  mobileBottomNavigation,
} from "@/layouts/app-navigation";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid min-h-16 grid-cols-4 gap-1 p-1">
        {mobileBottomNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = isAppNavItemActive(item, location.pathname);

          return (
            <li key={item.id} className="flex">
              <NavLink
                to={item.to}
                className={cn(
                  "relative flex h-full w-full min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {isActive && (
                  <span className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-primary" />
                )}
                <span className="flex h-5 w-5 items-center justify-center">
                  <Icon className="h-5 w-5" />
                </span>
                <span>{t(`sidebar.${item.id}`)}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
