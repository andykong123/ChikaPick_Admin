import assert from "node:assert/strict";
import { test } from "node:test";

import {
  inviteAdminAccount,
  sendAdminPasswordReset,
  unlockAdminAccount,
} from "./admin-api.ts";

test("inviteAdminAccount posts super-admin invite details to the Admin API", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com/";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ ok: true, message: "sent" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await inviteAdminAccount("access-token", {
      email: "admin@example.com",
      fullName: "관리자",
      role: "super_admin",
      redirectTo: "https://admin.example.com",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls[0]?.input, "https://api.example.com/api/v1/admin/accounts/invite");
  assert.equal(
    (calls[0]?.init?.headers as Record<string, string>).Authorization,
    "Bearer access-token",
  );
  assert.deepEqual(JSON.parse(calls[0]?.init?.body as string), {
    email: "admin@example.com",
    fullName: "관리자",
    role: "super_admin",
    redirectTo: "https://admin.example.com",
  });
});

test("sendAdminPasswordReset posts the target admin id", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ ok: true, message: "sent" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await sendAdminPasswordReset(
      "access-token",
      "admin-2",
      "https://admin.example.com/reset",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/accounts/admin-2/password-reset",
  );
  assert.deepEqual(JSON.parse(calls[0]?.init?.body as string), {
    redirectTo: "https://admin.example.com/reset",
  });
});

test("unlockAdminAccount posts the target admin id", async () => {
  const calls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com";
  globalThis.fetch = async (input, init) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ ok: true, message: "unlocked" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    await unlockAdminAccount("access-token", "admin-2");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(
    calls[0]?.input,
    "https://api.example.com/api/v1/admin/accounts/admin-2/unlock",
  );
  assert.equal(calls[0]?.init?.method, "POST");
});
