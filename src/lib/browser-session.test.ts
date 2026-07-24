import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";

import { signOutCurrentAdminSession } from "./browser-session.ts";

test("Admin sign-out only ends the current browser session", async () => {
  const calls: unknown[] = [];
  const supabase = {
    auth: {
      signOut: async (options: unknown) => {
        calls.push(options);
        return { error: null };
      },
    },
  } as unknown as SupabaseClient;

  await signOutCurrentAdminSession(supabase);

  assert.deepEqual(calls, [{ scope: "local" }]);
});
