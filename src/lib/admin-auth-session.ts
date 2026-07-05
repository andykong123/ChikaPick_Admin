type AccessTokenSession = {
  access_token?: string | null;
} | null;

export function shouldAutoLoadAdminConsole(
  lastLoadedAccessToken: string | null,
  nextSession: AccessTokenSession,
) {
  const nextAccessToken = nextSession?.access_token ?? null;
  return Boolean(nextAccessToken && nextAccessToken !== lastLoadedAccessToken);
}
