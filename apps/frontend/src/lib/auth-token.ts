let _accessToken: string | null = null;
let _accessTokenExpiresAt: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(
  token: string | null,
  expiresAt?: string | null
): void {
  _accessToken = token;
  _accessTokenExpiresAt = expiresAt ?? null;
}

export function getAccessTokenExpiresAt(): string | null {
  return _accessTokenExpiresAt;
}

export function clearAccessToken(): void {
  _accessToken = null;
  _accessTokenExpiresAt = null;
}

export function isTokenExpired(): boolean {
  if (!_accessTokenExpiresAt) return true;
  const expiresAt = new Date(_accessTokenExpiresAt).getTime();
  return Date.now() >= expiresAt - 30_000;
}
