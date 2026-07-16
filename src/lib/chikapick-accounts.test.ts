import assert from "node:assert/strict";
import test from "node:test";

import {
  chikapickAccountStatusLabel,
  chikapickAccountStatusTone,
  chikapickCountryLabel,
  chikapickLoginProviderLabel,
  formatChikapickAccountDate,
} from "./chikapick-accounts.ts";

test("ChikaPick account labels map provider, status, and country values", () => {
  assert.equal(chikapickLoginProviderLabel("kakao"), "카카오 로그인");
  assert.equal(chikapickLoginProviderLabel("email"), "이메일 로그인");
  assert.equal(chikapickAccountStatusLabel("active"), "정상");
  assert.equal(chikapickAccountStatusLabel("withdrawn"), "탈퇴");
  assert.equal(chikapickAccountStatusTone("unsupported"), "unknown");
  assert.equal(chikapickCountryLabel("KR"), "대한민국");
  assert.equal(chikapickCountryLabel("OTHER"), "외국");
});

test("ChikaPick account timestamps render in Korea time", () => {
  assert.equal(
    formatChikapickAccountDate("2026-06-12T05:22:00.000Z"),
    "2026.06.12 14:22",
  );
  assert.equal(formatChikapickAccountDate(null), "-");
  assert.equal(formatChikapickAccountDate("invalid"), "-");
});
