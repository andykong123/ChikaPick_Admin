import assert from "node:assert/strict";
import { test } from "node:test";

import { signInWithAdminPassword } from "./password-auth.ts";

test("signInWithAdminPassword trims the email and uses Supabase password auth", async () => {
  const calls: unknown[] = [];
  const supabase = {
    auth: {
      signInWithPassword: async (credentials: unknown) => {
        calls.push(credentials);
        return { error: null };
      },
    },
  };

  await signInWithAdminPassword(supabase, {
    email: " admin@example.com ",
    password: "correct-password",
  });

  assert.deepEqual(calls, [
    { email: "admin@example.com", password: "correct-password" },
  ]);
});

test("signInWithAdminPassword requires both email and password before calling Supabase", async () => {
  let called = false;
  const supabase = {
    auth: {
      signInWithPassword: async () => {
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
      signInWithPassword: async () => ({
        error: new Error("Invalid login credentials"),
      }),
    },
  };

  await assert.rejects(
    () =>
      signInWithAdminPassword(supabase, {
        email: "admin@example.com",
        password: "wrong-password",
      }),
    /Invalid login credentials/,
  );
});
