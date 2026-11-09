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

const sessionHintKey = "bitfinance-session";

export function rememberSession() {
  try {
    localStorage.setItem(sessionHintKey, "1");
  } catch {
    return;
  }
}

export function forgetSession() {
  try {
    localStorage.removeItem(sessionHintKey);
  } catch {
    return;
  }
}

export function hadSession() {
  try {
    return localStorage.getItem(sessionHintKey) === "1";
  } catch {
    return false;
  }
}
