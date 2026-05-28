import {
  Building2,
  CreditCard,
  LayoutDashboard,
  MoreHorizontal,
  ReceiptText,
  Settings,
} from "lucide-react";

type AppNavSurface = "desktop-sidebar" | "mobile-bottom";

export interface AppNavItem {
  id:
    | "dashboard"
    | "bills"
    | "expenses"
    | "organization"
    | "account"
    | "more";
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  section: "management" | "account";
  surfaces: AppNavSurface[];
  isMatch: (pathname: string) => boolean;
}

export const appNavigation: AppNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
    section: "management",
    surfaces: ["desktop-sidebar", "mobile-bottom"],
    isMatch: (pathname) => pathname === "/dashboard" || pathname === "/dashboard/",
  },
  {
    id: "bills",
    label: "Bills",
    to: "/dashboard/bills",
    icon: ReceiptText,
    section: "management",
    surfaces: ["desktop-sidebar", "mobile-bottom"],
    isMatch: (pathname) =>
      pathname.startsWith("/dashboard/bills") || pathname.startsWith("/bills"),
  },
  {
    id: "expenses",
    label: "Expenses",
    to: "/dashboard/expenses",
    icon: CreditCard,
    section: "management",
    surfaces: ["desktop-sidebar", "mobile-bottom"],
    isMatch: (pathname) => pathname.startsWith("/dashboard/expenses"),
  },
  {
    id: "organization",
    label: "Organization",
    to: "/account/organization",
    icon: Building2,
    section: "account",
    surfaces: ["desktop-sidebar"],
    isMatch: (pathname) => pathname.startsWith("/account/organization"),
  },
  {
    id: "account",
    label: "Account",
    to: "/account/settings",
    icon: Settings,
    section: "account",
    surfaces: ["desktop-sidebar"],
    isMatch: (pathname) => pathname === "/account" || pathname.startsWith("/account/settings"),
  },
  {
    id: "more",
    label: "More",
    to: "/account/more",
    icon: MoreHorizontal,
    section: "account",
    surfaces: ["mobile-bottom"],
    isMatch: (pathname) => pathname.startsWith("/account"),
  },
];

export const desktopSidebarNavigation = appNavigation.filter((item) =>
  item.surfaces.includes("desktop-sidebar")
);

export const mobileBottomNavigation = appNavigation.filter((item) =>
  item.surfaces.includes("mobile-bottom")
);

export function isAppNavItemActive(item: AppNavItem, pathname: string) {
  return item.isMatch(pathname);
}
