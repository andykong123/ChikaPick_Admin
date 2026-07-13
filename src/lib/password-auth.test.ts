import assert from "node:assert/strict";
import { test } from "node:test";

import { signInWithAdminPassword } from "./password-auth.ts";

test("signInWithAdminPassword trims the email, calls Admin API, and stores returned session", async () => {
  const originalFetch = globalThis.fetch;
  const fetchCalls: Array<{ input: string | URL | Request; init?: RequestInit }> = [];
  const setSessionCalls: unknown[] = [];
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL = "https://api.example.com/";
  globalThis.fetch = async (input, init) => {
    fetchCalls.push({ input, init });
    return new Response(
      JSON.stringify({
        data: {
          session: {
            access_token: "access-token",
            refresh_token: "refresh-token",
          },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };
  const supabase = {
    auth: {
      setSession: async (session: unknown) => {
        setSessionCalls.push(session);
        return { error: null };
      },
    },
  };

  try {
    await signInWithAdminPassword(supabase, {
      email: " admin@example.com ",
      password: "correct-password",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(fetchCalls[0]?.input, "https://api.example.com/api/v1/admin/auth/login");
  assert.deepEqual(JSON.parse(fetchCalls[0]?.init?.body as string), {
    email: "admin@example.com",
    password: "correct-password",
  });
  assert.deepEqual(setSessionCalls, [
    { access_token: "access-token", refresh_token: "refresh-token" },
  ]);
});

test("signInWithAdminPassword requires both email and password before calling Supabase", async () => {
  let called = false;
  const supabase = {
    auth: {
      setSession: async () => {
        called = true;
        return { error: null };
      },
    },
  };

  await assert.rejects(
    () => signInWithAdminPassword(supabase, { email: " ", password: "" }),
    /이메일과 비밀번호를 입력해 주세요\./,
  );
  assert.equal(called, false);
});

test("signInWithAdminPassword surfaces Supabase auth errors", async () => {
  const supabase = {
    auth: {
      setSession: async () => ({ error: null }),
    },
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: "이메일 또는 비밀번호를 확인해 주세요." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });

  try {
    await assert.rejects(
      () =>
        signInWithAdminPassword(supabase, {
          email: "admin@example.com",
          password: "wrong-password",
        }),
      /이메일 또는 비밀번호를 확인해 주세요\./,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
