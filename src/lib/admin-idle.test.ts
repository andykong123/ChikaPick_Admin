import assert from "node:assert/strict";
import { test } from "node:test";

import { shouldExpireAdminIdleSession } from "./admin-idle.ts";

test("shouldExpireAdminIdleSession expires after one hour without activity", () => {
  assert.equal(
    shouldExpireAdminIdleSession({
      lastActivityAt: 1000,
      now: 1000 + 60 * 60 * 1000,
    }),
    true,
  );
  assert.equal(
    shouldExpireAdminIdleSession({
      lastActivityAt: 1000,
      now: 1000 + 60 * 60 * 1000 - 1,
    }),
    false,
  );
});
