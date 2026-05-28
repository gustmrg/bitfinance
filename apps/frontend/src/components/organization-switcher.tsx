import { Check, ChevronsUpDown, Plus, Settings2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import type { Organization } from "@/auth/types";
import {
  useSelectedOrganization,
  useSetSelectedOrganizationId,
} from "@/auth/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface OrganizationSwitcherProps {
  organizations: Organization[];
  variant?: "sidebar" | "topbar";
}

function getOrganizationInitials(name?: string): string {
  const normalizedName = name?.trim().replace(/\s+/g, " ") ?? "";
  if (!normalizedName) {
    return "OR";
  }

  const parts = normalizedName.split(" ");

  if (parts.length === 1) {
    const firstTwoLetters = Array.from(parts[0]).slice(0, 2).join("").toUpperCase();
    return firstTwoLetters || "OR";
  }

  const initials = `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  return initials || "OR";
}

function OrganizationSwitcherActions({
  manageLabel,
  createLabel,
}: {
  manageLabel: string;
  createLabel: string;
}) {
  return (
    <>
      <DropdownMenuItem asChild>
        <Link to="/account/organization">
          <Settings2 className="h-4 w-4" />
          {manageLabel}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link to="/account/create-organization">
          <Plus className="h-4 w-4" />
          {createLabel}
        </Link>
      </DropdownMenuItem>
    </>
  );
}

export function OrganizationSwitcher({
  organizations,
  variant = "sidebar",
}: OrganizationSwitcherProps) {
  const { t } = useTranslation();
  const selectedOrganization = useSelectedOrganization();
  const setSelectedOrganizationId = useSetSelectedOrganizationId();
  const isMobile = useIsMobile();

  if (variant === "topbar") {
    if (isMobile) {
      return (
        <Drawer>
          <DrawerTrigger asChild>
            <Button
              variant="outline"
              className="h-9 w-full justify-between gap-2 px-2 sm:px-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="h-6 w-6" aria-hidden="true">
                  <AvatarFallback className="text-[10px] font-semibold">
                    {getOrganizationInitials(selectedOrganization?.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm font-medium">
                  {selectedOrganization?.name ?? t("sidebar.select")}
                </span>
              </div>
              <ChevronsUpDown className="size-4 text-muted-foreground" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[90vh]">
            <div className="flex max-h-[calc(90vh-1rem)] flex-col">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <DrawerTitle className="text-base font-semibold">
                  {t("sidebar.select")}
                </DrawerTitle>
                <DrawerClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Close organization selector"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerClose>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {organizations.length > 0 ? (
                  <div className="space-y-1">
                    {organizations.map((organization) => (
                      <DrawerClose asChild key={organization.id}>
                        <Button
                          variant="ghost"
                          className="h-12 w-full justify-start gap-2 px-3"
                          onClick={() => setSelectedOrganizationId(organization.id)}
                        >
                          <Avatar className="h-7 w-7" aria-hidden="true">
                            <AvatarFallback className="text-[10px] font-semibold">
                              {getOrganizationInitials(organization.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{organization.name}</span>
                          {organization.id === selectedOrganization?.id ? (
                            <Check className="ml-auto h-4 w-4" />
                          ) : null}
                        </Button>
                      </DrawerClose>
                    ))}

                    <div className="pt-3">
                      <div className="mb-2 border-t" />
                      <DrawerClose asChild>
                        <Button asChild variant="outline" className="w-full justify-start gap-2">
                          <Link to="/account/organization">
                            <Settings2 className="h-4 w-4" />
                            {t("organization.switcher.manage")}
                          </Link>
                        </Button>
                      </DrawerClose>
                      <DrawerClose asChild>
                        <Button asChild variant="ghost" className="mt-2 w-full justify-start gap-2">
                          <Link to="/account/create-organization">
                            <Plus className="h-4 w-4" />
                            {t("organization.switcher.create")}
                          </Link>
                        </Button>
                      </DrawerClose>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 px-3 py-4">
                    <p className="text-sm text-muted-foreground">
                      {t("organization.switcher.empty")}
                    </p>
                    <DrawerClose asChild>
                      <Button asChild className="w-full justify-start gap-2">
                        <Link to="/account/create-organization">
                          <Plus className="h-4 w-4" />
                          {t("organization.switcher.create")}
                        </Link>
                      </Button>
                    </DrawerClose>
                  </div>
                )}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-9 w-full justify-between gap-2 px-2 sm:px-3"
          >
            <span className="truncate text-sm font-medium">
              {selectedOrganization?.name ?? t("sidebar.select")}
            </span>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-1rem)]">
          {organizations.length > 0 ? (
            <>
              {organizations.map((organization) => (
                <DropdownMenuItem
                  key={organization.id}
                  onSelect={() => setSelectedOrganizationId(organization.id)}
                >
                  <span className="truncate">{organization.name}</span>
                  {organization.id === selectedOrganization?.id ? (
                    <Check className="ml-auto" />
                  ) : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <OrganizationSwitcherActions
                manageLabel={t("organization.switcher.manage")}
                createLabel={t("organization.switcher.create")}
              />
            </>
          ) : (
            <>
              <DropdownMenuItem asChild>
                <Link to="/account/create-organization">
                  <Plus className="h-4 w-4" />
                  {t("organization.switcher.create")}
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <span className="truncate font-semibold">
                {selectedOrganization?.name ?? t("sidebar.select")}
              </span>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={cn("w-[--radix-dropdown-menu-trigger-width]", "max-w-xs")}
            align="start"
          >
            {organizations.length > 0 ? (
              <>
                {organizations.map((organization) => (
                  <DropdownMenuItem
                    key={organization.id}
                    onSelect={() => setSelectedOrganizationId(organization.id)}
                  >
                    <span className="truncate">{organization.name}</span>
                    {organization.id === selectedOrganization?.id ? (
                      <Check className="ml-auto" />
                    ) : null}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <OrganizationSwitcherActions
                  manageLabel={t("organization.switcher.manage")}
                  createLabel={t("organization.switcher.create")}
                />
              </>
            ) : (
              <DropdownMenuItem asChild>
                <Link to="/account/create-organization">
                  <Plus className="h-4 w-4" />
                  {t("organization.switcher.create")}
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
