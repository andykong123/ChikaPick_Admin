import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildAdminSessionRegistrationPayload,
  getOrCreateBrowserDeviceId,
  isSessionClearingError,
  sessionIdFromAccessToken,
} from "./session-device";
import { adminApiBaseUrl } from "./public-env.ts";

const heartbeatIntervalMs = 5 * 60 * 1000;
let registeredSessionId: string | null = null;

export async function registerCurrentAdminBrowserSession(
  supabase: SupabaseClient,
) {
  const accessToken = await getAccessToken(supabase);
  if (!accessToken) throw new Error("로그인이 필요합니다.");

  const sessionId = sessionIdFromAccessToken(accessToken) ?? accessToken;
  if (registeredSessionId === sessionId) return;

  await requestAdminSessionEndpoint(accessToken, "/api/v1/auth/session/register", {
    method: "POST",
    body: JSON.stringify(
      buildAdminSessionRegistrationPayload(getOrCreateBrowserDeviceId()),
    ),
  });
  registeredSessionId = sessionId;
}

export function startAdminSessionHeartbeat({
  supabase,
  onSessionInvalidated,
}: {
  supabase: SupabaseClient;
  onSessionInvalidated: () => void | Promise<void>;
}) {
  const heartbeat = () => {
    void sendHeartbeat(supabase, onSessionInvalidated);
  };
  const onVisible = () => {
    if (document.visibilityState === "visible") heartbeat();
  };

  const intervalId = window.setInterval(heartbeat, heartbeatIntervalMs);
  window.addEventListener("focus", heartbeat);
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    window.clearInterval(intervalId);
    window.removeEventListener("focus", heartbeat);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

async function sendHeartbeat(
  supabase: SupabaseClient,
  onSessionInvalidated: () => void | Promise<void>,
) {
  try {
    const accessToken = await getAccessToken(supabase);
    if (!accessToken) {
      await onSessionInvalidated();
      return;
    }

    await requestAdminSessionEndpoint(
      accessToken,
      "/api/v1/auth/session/heartbeat",
      { method: "POST" },
    );
  } catch (error) {
    if (isSessionClearingError(errorFromUnknown(error))) {
      registeredSessionId = null;
      await onSessionInvalidated();
    }
  }
}

async function getAccessToken(supabase: SupabaseClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function requestAdminSessionEndpoint(
  accessToken: string,
  path: string,
  init: RequestInit,
) {
  const response = await fetch(`${adminApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = payload as { error?: string; message?: string };
    const error = new Error(
      errorPayload.message ?? "관리자 세션 등록에 실패했습니다.",
    ) as Error & { code?: string; statusCode?: number };
    error.code = errorPayload.error;
    error.statusCode = response.status;
    throw error;
  }

  return payload;
}

function errorFromUnknown(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    ("code" in error || "statusCode" in error)
  ) {
    return error as { code?: string; statusCode?: number };
  }

  return {};
}
