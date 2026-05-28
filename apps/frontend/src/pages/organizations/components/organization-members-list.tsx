import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { OrganizationMember } from "@/api/organizations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface OrganizationMembersListProps {
  members: OrganizationMember[];
}

export function OrganizationMembersList({ members }: OrganizationMembersListProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("organization.members.manageRolesTitle")}</AlertTitle>
        <AlertDescription>
          {t("organization.members.manageRolesDescription")}
        </AlertDescription>
      </Alert>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("organization.members.empty")}</p>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate font-medium">
                  {member.username ? `@${member.username}` : member.email}
                </p>
                <p className="truncate text-sm text-muted-foreground">{member.email}</p>
              </div>

              <Badge variant={member.role ? "default" : "secondary"}>
                {member.role
                  ? t(`organization.roles.${member.role.toLowerCase()}`)
                  : t("organization.members.roleUnavailable")}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
