import { useLocation } from "react-router-dom";

const routeNameMap: { [key: string]: string } = {
  dashboard: "Dashboard",
  bills: "Bills",
  account: "Account",
  expenses: "Expenses",
};

const getBreadcrumbName = (segment: string): string => {
  if (routeNameMap[segment]) {
    return routeNameMap[segment];
  }

  return segment.charAt(0).toUpperCase() + segment.slice(1);
};

export interface BreadcrumbData {
  label: string;
  path: string;
  isLast: boolean;
}

export const useBreadcrumbs = (): BreadcrumbData[] => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x); // Split and remove empty strings

  let currentPath = "";
  const breadcrumbs = pathnames.map((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathnames.length - 1;
    const label = getBreadcrumbName(segment);

    return {
      label,
      path: currentPath,
      isLast,
    };
  });

  return breadcrumbs;
};
