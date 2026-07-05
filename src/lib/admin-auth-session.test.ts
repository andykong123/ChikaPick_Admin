import assert from "node:assert/strict";
import { test } from "node:test";

import { shouldAutoLoadAdminConsole } from "./admin-auth-session.ts";

test("shouldAutoLoadAdminConsole skips empty sessions", () => {
  assert.equal(shouldAutoLoadAdminConsole(null, null), false);
  assert.equal(shouldAutoLoadAdminConsole(null, { access_token: "" }), false);
});

test("shouldAutoLoadAdminConsole loads once for a new access token", () => {
  assert.equal(
    shouldAutoLoadAdminConsole(null, { access_token: "access-token-1" }),
    true,
  );
});

test("shouldAutoLoadAdminConsole skips repeated access tokens", () => {
  assert.equal(
    shouldAutoLoadAdminConsole("access-token-1", {
      access_token: "access-token-1",
    }),
    false,
  );
});

test("shouldAutoLoadAdminConsole reloads after token refresh", () => {
  assert.equal(
    shouldAutoLoadAdminConsole("access-token-1", {
      access_token: "access-token-2",
    }),
    true,
  );
});
