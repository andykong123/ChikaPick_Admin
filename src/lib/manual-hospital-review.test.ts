import assert from "node:assert/strict";
import test from "node:test";

import {
  manualHospitalRequestAccount,
  manualHospitalReviewDate,
  manualHospitalReviewStatusLabel,
  normalizeManualHospitalRejectionReason,
} from "./manual-hospital-review.ts";

test("manual hospital review labels every persisted review state", () => {
  assert.equal(manualHospitalReviewStatusLabel("pending_review"), "심사 대기");
  assert.equal(manualHospitalReviewStatusLabel("approved"), "승인 완료");
  assert.equal(manualHospitalReviewStatusLabel("rejected"), "반려");
  assert.equal(manualHospitalReviewStatusLabel("cancelled"), "신청 취소");
});

test("manual hospital review presents the Korea request date and account", () => {
  assert.equal(
    manualHospitalReviewDate("2026-07-14T15:30:00.000Z"),
    "2026-07-15",
  );
  assert.equal(manualHospitalReviewDate("invalid"), "-");
  assert.equal(
    manualHospitalRequestAccount({
      id: "submission-1",
      status: "pending_review",
      createdAt: "2026-07-14T15:30:00.000Z",
      hospitalName: "바른이치과",
      businessName: "바른이치과",
      ownerName: "김대표",
      representativePhone: "02-1234-5678",
      address: "서울시 강남구",
      businessLicenseFileName: "첨부파일.pdf",
      businessLicenseContentType: "application/pdf",
      businessLicenseUrl: null,
      user: { id: "user-1", email: "admin@baruni.com", fullName: "김대표" },
    }),
    "admin@baruni.com",
  );
  assert.equal(normalizeManualHospitalRejectionReason("  서류가 흐립니다.  "), "서류가 흐립니다.");
});
