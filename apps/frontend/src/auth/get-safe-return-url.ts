const DEFAULT_RETURN_URL = "/dashboard";

export function getSafeReturnUrl(returnUrl: string | null | undefined): string {
  if (!returnUrl) {
    return DEFAULT_RETURN_URL;
  }

  if (!returnUrl.startsWith("/") || returnUrl.startsWith("//")) {
    return DEFAULT_RETURN_URL;
  }

  return returnUrl;
}
