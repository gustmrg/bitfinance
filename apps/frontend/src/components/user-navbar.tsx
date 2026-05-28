import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  useCurrentUser,
  useIsAuthenticated,
  useLogoutAction,
} from "@/auth/auth-provider";
import { useTranslation } from "react-i18next";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials, getUserAvatarSrc } from "@/lib/avatar";

export default function UserNavBar() {
  const logout = useLogoutAction();
  const isAuthenticated = useIsAuthenticated();
  const currentUserQuery = useCurrentUser();
  const user = currentUserQuery.data ?? null;
  const { t } = useTranslation();
  const navigate = useNavigate();

  return isAuthenticated ? (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={getUserAvatarSrc(user?.avatarUrl)} alt={user?.fullName} />
                <AvatarFallback>{getInitials(user?.fullName ?? "User")}</AvatarFallback>
              </Avatar>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.email}</p>
              <p className="text-xs leading-none text-muted-foreground">
                @{user?.username}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Link to="/account/settings">{t("labels.profile")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/account/settings")}>
              {t("labels.settings")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={async () => await logout()}>
            {t("labels.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  ) : null;
}
