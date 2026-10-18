export type OrganizationMemberRole = "Owner" | "Admin" | "Member";

export function isKnownMemberRole(role: unknown): role is OrganizationMemberRole {
  return role === "Owner" || role === "Admin" || role === "Member";
}

export function isEditableMemberRole(role: unknown): role is "Admin" | "Member" {
  return role === "Admin" || role === "Member";
}

export function findMemberRole(
  members: Array<{ id: string; role: unknown }> | undefined,
  userId: string | undefined,
): OrganizationMemberRole | undefined {
  const role = members?.find((member) => member.id === userId)?.role;
  return isKnownMemberRole(role) ? role : undefined;
}

export function canManageOrganization(role: OrganizationMemberRole | undefined) {
  return role === "Owner" || role === "Admin";
}
