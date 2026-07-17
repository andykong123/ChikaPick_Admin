import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formatMembershipDate,
  membershipCategoryLabel,
  membershipPageNumbers,
  membershipSortLabel,
  validateMembershipRegistration,
} from "./membership-management.ts";

test("membership labels map API codes to the Figma copy", () => {
  assert.equal(membershipCategoryLabel("lab"), "기공소");
  assert.equal(membershipCategoryLabel("tax_labor_legal"), "세무/노무/법무");
  assert.equal(membershipSortLabel("recommended"), "추천순");
  assert.equal(membershipSortLabel("name"), "업체명순");
});

test("membership dates and compact pagination are stable", () => {
  assert.equal(formatMembershipDate("2026-03-09T15:00:00.000Z"), "2026.03.10");
  assert.equal(formatMembershipDate("invalid"), "-");
  assert.deepEqual(membershipPageNumbers(1, 5), [1, 2, 3]);
  assert.deepEqual(membershipPageNumbers(5, 5), [3, 4, 5]);
  assert.deepEqual(membershipPageNumbers(1, 1), [1]);
});

test("membership registration validates required fields and Figma upload limits", () => {
  const valid = {
    attachmentFile: null,
    attachmentLabel: "",
    benefitItems: [],
    cardImage: null,
    category: "lab" as const,
    contentType: "section" as const,
    description: "한 줄 소개",
    detailDescription: "",
    detailImage: null,
    detailTitle: "상세 제목",
    inquiryButtonLabel: "상담 신청",
    inquiryMethod: "external_link" as const,
    inquiryValue: "https://example.com",
    intro: "",
    isPreferred: true,
    isVisible: true,
    name: "서울기공연구소",
    recommendedOrder: 1,
    richContent: "",
    richContentImages: [],
    serviceTags: [],
    strengths: [],
  };
  assert.equal(validateMembershipRegistration(valid), null);
  assert.equal(
    validateMembershipRegistration({ ...valid, name: "" }),
    "업체명을 입력해 주세요.",
  );
  assert.equal(
    validateMembershipRegistration({
      ...valid,
      cardImage: { size: 2 * 1024 * 1024 + 1, type: "image/png" } as File,
    }),
    "대표 썸네일 이미지는 2MB 이하만 등록할 수 있습니다.",
  );
});
