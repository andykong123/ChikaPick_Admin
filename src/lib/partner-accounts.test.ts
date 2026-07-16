import assert from "node:assert/strict";
import test from "node:test";

import {
  formatPartnerAccountDate,
  partnerAccountClassificationLabel,
  partnerAccountLoginProviderLabel,
  partnerAccountMembershipStatusLabel,
  partnerAccountStatusLabel,
} from "./partner-accounts.ts";

test("Partners account labels map directory and detail values", () => {
  assert.equal(partnerAccountClassificationLabel("representative"), "대표");
  assert.equal(
    partnerAccountClassificationLabel("affiliated_dentist"),
    "소속 치과 의사",
  );
  assert.equal(partnerAccountClassificationLabel("staff"), "직원");
  assert.equal(partnerAccountMembershipStatusLabel("active"), "소속 승인");
  assert.equal(partnerAccountMembershipStatusLabel(null), "미소속");
  assert.equal(partnerAccountStatusLabel("withdrawn"), "탈퇴");
  assert.equal(partnerAccountLoginProviderLabel("kakao"), "카카오 로그인");
});

test("Partners account timestamps render in Korea time", () => {
  assert.equal(
    formatPartnerAccountDate("2026-06-12T05:22:00.000Z"),
    "2026.06.12 14:22",
  );
  assert.equal(formatPartnerAccountDate(null), "-");
  assert.equal(formatPartnerAccountDate("invalid"), "-");
});
