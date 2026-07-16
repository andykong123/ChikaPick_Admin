import assert from "node:assert/strict";
import test from "node:test";

import {
  dentalSalesCompletionViewState,
  dentalSalesBusinessFileError,
  dentalSalesDetailLabel,
  dentalSalesPageNumbers,
  dentalSalesRegionLabel,
  dentalSalesStatusLabel,
  dentalSalesVisitNote,
  dentalSalesVisitPresentation,
  dentalSalesVisitTitle,
  isDentalSalesVisitDetailStatus,
} from "./dental-sales.ts";

test("dental sales status helpers expose the Korean lifecycle labels", () => {
  assert.equal(dentalSalesStatusLabel("NOT_VISITED"), "미방문");
  assert.equal(dentalSalesStatusLabel("VISITING"), "방문");
  assert.equal(dentalSalesStatusLabel("SIGNED"), "가입완료");
  assert.equal(dentalSalesDetailLabel("INFORMATION_MISSING"), "정보 미입력");
  assert.equal(dentalSalesDetailLabel("ACTIVE"), "사용중");
  assert.equal(dentalSalesDetailLabel(null), "—");
});

test("dental sales detail helpers format live detail-page labels", () => {
  assert.equal(dentalSalesRegionLabel("서울특별시", "중랑구"), "서울 / 중랑구");
  assert.equal(dentalSalesRegionLabel("경기도", "성남시"), "경기 / 성남시");
  assert.equal(
    dentalSalesVisitTitle("CODE_SHARED", "SU1234"),
    "초대코드 SU1234 전달",
  );
  assert.equal(dentalSalesVisitTitle("ON_HOLD", "SU1234"), "후속 논의 보류");
});

test("completion view switches to the completed card at exactly 100 percent", () => {
  assert.deepEqual(
    dentalSalesCompletionViewState({
      detailStatus: "INFORMATION_MISSING",
      percentage: 99,
    }),
    {
      completionPercentage: 99,
      isAppVisible: false,
      isComplete: false,
    },
  );
  assert.deepEqual(
    dentalSalesCompletionViewState({
      detailStatus: "ACTIVE",
      percentage: 100,
    }),
    {
      completionPercentage: 100,
      isAppVisible: true,
      isComplete: true,
    },
  );
});

test("business registration attachment validation enforces the Figma limits", () => {
  assert.equal(
    dentalSalesBusinessFileError({ type: "application/pdf", size: 10 * 1024 * 1024 }),
    null,
  );
  assert.equal(
    dentalSalesBusinessFileError({ type: "text/plain", size: 100 }),
    "JPG, PNG, PDF 파일만 선택할 수 있습니다.",
  );
  assert.equal(
    dentalSalesBusinessFileError({ type: "image/png", size: 10 * 1024 * 1024 + 1 }),
    "파일 크기는 10MB 이하여야 합니다.",
  );
});

test("visit notes preserve a custom modal title without changing the API contract", () => {
  const note = dentalSalesVisitNote("  첫 방문 상담  ", "  다음 주 재방문 예정  ");
  assert.deepEqual(
    dentalSalesVisitPresentation({
      detailStatus: "INTEREST",
      note,
      salesCode: "SU1234",
    }),
    {
      title: "첫 방문 상담",
      memo: "다음 주 재방문 예정",
    },
  );
});

test("visit presentation keeps historical notes and generated titles compatible", () => {
  assert.deepEqual(
    dentalSalesVisitPresentation({
      detailStatus: "CODE_SHARED",
      note: "가입 링크 안내 완료",
      salesCode: "SU1234",
    }),
    {
      title: "초대코드 SU1234 전달",
      memo: "가입 링크 안내 완료",
    },
  );
  assert.equal(isDentalSalesVisitDetailStatus("ON_HOLD"), true);
  assert.equal(isDentalSalesVisitDetailStatus("ACTIVE"), false);
  assert.equal(isDentalSalesVisitDetailStatus(null), false);
});

test("dentalSalesPageNumbers keeps a five-page window around the current page", () => {
  assert.deepEqual(dentalSalesPageNumbers(1, 12), [1, 2, 3, 4, 5]);
  assert.deepEqual(dentalSalesPageNumbers(6, 12), [4, 5, 6, 7, 8]);
  assert.deepEqual(dentalSalesPageNumbers(12, 12), [8, 9, 10, 11, 12]);
  assert.deepEqual(dentalSalesPageNumbers(2, 3), [1, 2, 3]);
});
