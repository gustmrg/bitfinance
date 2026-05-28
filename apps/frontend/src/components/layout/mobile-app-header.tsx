import { useCurrentUser } from "@/auth/auth-provider";
import { OrganizationSwitcher } from "@/components/organization-switcher";

export function MobileAppHeader() {
  const currentUserQuery = useCurrentUser();
  const user = currentUserQuery.data ?? null;

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:hidden">
      <div className="w-full">
        <OrganizationSwitcher
          organizations={user?.organizations ?? []}
          variant="topbar"
        />
      </div>
    </header>
  );
}
