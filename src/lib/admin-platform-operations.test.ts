import assert from "node:assert/strict";
import test from "node:test";

import {
  adminAuditActionLabel,
  adminDirectoryDateTime,
  adminInviteStatusLabel,
  adminMembershipRoleLabel,
  adminTermAudienceLabel,
} from "./admin-platform-operations.ts";

test("platform operation labels distinguish invite, role, audit, and audience values", () => {
  assert.equal(adminInviteStatusLabel("pending_owner_claim"), "대표자 인증 대기");
  assert.equal(adminMembershipRoleLabel("doctor"), "치과의사");
  assert.equal(adminAuditActionLabel("terms.version.publish"), "약관 버전 게시");
  assert.equal(adminTermAudienceLabel("patient"), "치카픽");
  assert.equal(adminTermAudienceLabel("partner"), "파트너스");
});

test("platform operation timestamps render in Korea time and handle missing values", () => {
  assert.match(adminDirectoryDateTime("2026-07-17T00:00:00.000Z"), /2026/);
  assert.match(adminDirectoryDateTime("2026-07-17T00:00:00.000Z"), /9:00/);
  assert.equal(adminDirectoryDateTime(null), "—");
  assert.equal(adminDirectoryDateTime("not-a-date"), "—");
});
