import React from "react";
import { Link, Outlet } from "react-router-dom";

import { MobileAppHeader } from "@/components/layout/mobile-app-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useIsMobile } from "@/hooks/use-mobile";

export function DashboardLayout() {
  const breadcrumbs = useBreadcrumbs();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex min-h-svh flex-col bg-white dark:bg-zinc-950">
        <MobileAppHeader />
        <main className="flex flex-1 flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:h-16 sm:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 hidden h-4 sm:block" />
          <Breadcrumb className="min-w-0">
            <BreadcrumbList className="flex-nowrap overflow-hidden">
              {breadcrumbs.map((crumb) => (
                <React.Fragment key={crumb.path}>
                  <BreadcrumbItem className="truncate">
                    {crumb.isLast ? (
                      <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.path} className="truncate">
                          {crumb.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!crumb.isLast ? <BreadcrumbSeparator /> : null}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
