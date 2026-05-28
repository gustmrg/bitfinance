export const DEFAULT_AVATAR_SRC = "/assets/avatars/04.png";

export function getUserAvatarSrc(avatarUrl?: string | null): string {
  return avatarUrl ?? DEFAULT_AVATAR_SRC;
}

export function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
