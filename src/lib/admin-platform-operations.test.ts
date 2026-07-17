import assert from "node:assert/strict";
import test from "node:test";

import {
  adminAuditActionLabel,
  adminConsultationCategoryLabel,
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

test("consultation category labels localize every canonical Partners category", () => {
  assert.deepEqual(
    [
      "tooth_pain",
      "dental_trauma",
      "cavity",
      "cavity_treatment",
      "sensitive_teeth",
      "scaling_gum_treatment",
      "wisdom_tooth_extraction",
      "root_canal",
      "prosthodontic",
      "implant",
      "orthodontics",
      "tmj",
      "pediatric_dentistry",
      "oral_checkup",
    ].map(adminConsultationCategoryLabel),
    [
      "치아 통증",
      "치아 파절 / 외상",
      "충치 치료",
      "충치 치료",
      "시린 치아",
      "스케일링 / 잇몸 치료",
      "사랑니 발치",
      "신경 치료",
      "보철 치료",
      "임플란트",
      "치아 교정",
      "턱관절",
      "소아 치과",
      "구강 검진",
    ],
  );
  assert.equal(adminConsultationCategoryLabel(null), "미분류");
});
