const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

function isLocalUrl(url: string): boolean {
  try {
    return LOCAL_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Public app URL for email links and other absolute URLs. */
export function getAppUrl(): string {
  return process.env.AUTH_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`;
}

/**
 * Auth.js uses AUTH_URL for OAuth redirect_uri. Shared .env files often point
 * at production while running `next dev` — override so Google sign-in stays local.
 */
export function configureAuthUrl(): void {
  if (process.env.NODE_ENV === "production") return;

  const configured = process.env.AUTH_URL;
  if (configured && isLocalUrl(configured)) return;

  const port = process.env.PORT ?? "3000";
  process.env.AUTH_URL = process.env.AUTH_URL_DEV ?? `http://localhost:${port}`;
}
