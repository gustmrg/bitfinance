let accessToken: string | null = null;
let accessTokenExpiresAt: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string, expiresAt: string) {
  accessToken = token;
  accessTokenExpiresAt = expiresAt;
}

export function clearAccessToken() {
  accessToken = null;
  accessTokenExpiresAt = null;
}

export function getAccessTokenExpiresAt() {
  return accessTokenExpiresAt;
}

export function isAccessTokenExpired() {
  return !accessTokenExpiresAt || Date.now() >= new Date(accessTokenExpiresAt).getTime() - 30_000;
}
