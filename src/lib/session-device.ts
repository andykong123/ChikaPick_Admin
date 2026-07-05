const browserDeviceIdKey = "admin.session_device_id.v1";

export interface SessionDeviceErrorLike {
  code?: string;
  statusCode?: number;
}

export function getOrCreateBrowserDeviceId(
  storage: Storage = window.localStorage,
  generateId: () => string = defaultDeviceIdSeed,
) {
  const existing = storage.getItem(browserDeviceIdKey);
  if (existing && existing.trim().length >= 12) {
    return existing;
  }

  const generated = `admin-web-${generateId()}`;
  storage.setItem(browserDeviceIdKey, generated);
  return generated;
}

export function buildAdminSessionRegistrationPayload(deviceId: string) {
  return {
    deviceId,
    deviceLabel: "Admin Web",
    platform: "web",
    appSurface: "admin",
    interactiveLogin: true,
  };
}

export function isSessionClearingError(error: SessionDeviceErrorLike) {
  return (
    error.code === "SESSION_REVOKED" ||
    error.code === "SESSION_UNREGISTERED" ||
    error.statusCode === 401
  );
}

export function sessionIdFromAccessToken(accessToken?: string | null) {
  const parts = accessToken?.split(".");
  if (!parts || parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { session_id?: unknown };
    return typeof payload.session_id === "string" && payload.session_id
      ? payload.session_id
      : null;
  } catch {
    return null;
  }
}

function defaultDeviceIdSeed() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
