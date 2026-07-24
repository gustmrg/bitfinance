export type OrganizationMemberRole = "Owner" | "Admin" | "Member";

export function isKnownMemberRole(role: unknown): role is OrganizationMemberRole {
  return role === "Owner" || role === "Admin" || role === "Member";
}

export function isEditableMemberRole(role: unknown): role is "Admin" | "Member" {
  return role === "Admin" || role === "Member";
}
