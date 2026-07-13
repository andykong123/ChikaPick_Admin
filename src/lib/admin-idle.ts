export const adminIdleTimeoutMs = 60 * 60 * 1000;

export function shouldExpireAdminIdleSession({
  lastActivityAt,
  now,
}: {
  lastActivityAt: number;
  now: number;
}) {
  return now - lastActivityAt >= adminIdleTimeoutMs;
}
