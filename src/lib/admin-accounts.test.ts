import assert from "node:assert/strict";
import test from "node:test";

import {
  adminAccountDirectoryRoleLabel,
  adminAccountDirectoryStatusLabel,
  formatAdminAccountDirectoryDate,
} from "./admin-accounts.ts";

test("admin account directory uses the Figma role and status labels", () => {
  assert.equal(adminAccountDirectoryRoleLabel("super_admin"), "최고 관리자");
  assert.equal(adminAccountDirectoryRoleLabel("sales"), "영업 담당자");
  assert.equal(adminAccountDirectoryRoleLabel("admin"), "운영 관리자");
  assert.equal(adminAccountDirectoryStatusLabel("active"), "활성");
  assert.equal(adminAccountDirectoryStatusLabel("invited"), "초대 대기");
  assert.equal(adminAccountDirectoryStatusLabel("locked"), "잠금");
  assert.equal(adminAccountDirectoryStatusLabel("suspended"), "비활성");
});

test("admin account directory dates render in Korea time", () => {
  assert.equal(
    formatAdminAccountDirectoryDate("2026-07-15T04:42:00.000Z", true),
    "2026.07.15 13:42",
  );
  assert.equal(
    formatAdminAccountDirectoryDate("2026-01-11T15:00:00.000Z"),
    "2026.01.12",
  );
  assert.equal(formatAdminAccountDirectoryDate(null, true), "-");
});
