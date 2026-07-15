import assert from "node:assert/strict";
import test from "node:test";

import {
  emptyDentalSalesFilters,
  filterDentalSalesRows,
  type DentalSalesRow,
} from "./dental-sales.ts";

const rows: DentalSalesRow[] = [
  {
    city: "서울",
    district: "강남구",
    neighborhood: "역삼1동",
    clinicName: "서울미소치과",
    phone: "02-9876-1111",
    salesperson: "김현우",
    inviteCode: "SU6201",
    status: "방문",
    detailStatus: "관심/검토",
  },
  {
    city: "서울",
    district: "마포구",
    neighborhood: "서교동",
    clinicName: "홍대바른치과",
    phone: "02-334-0909",
    salesperson: "김지태",
    inviteCode: "SU5238",
    status: "가입완료",
    detailStatus: "정보 미입력",
  },
];

test("filterDentalSalesRows applies location and status filters", () => {
  const result = filterDentalSalesRows(rows, {
    ...emptyDentalSalesFilters,
    district: "강남구",
    status: "방문",
  });

  assert.deepEqual(result, [rows[0]]);
});

test("filterDentalSalesRows searches clinic names without surrounding whitespace", () => {
  const result = filterDentalSalesRows(rows, {
    ...emptyDentalSalesFilters,
    clinicName: "  홍대  ",
  });

  assert.deepEqual(result, [rows[1]]);
});

test("filterDentalSalesRows combines salesperson and detail status", () => {
  const result = filterDentalSalesRows(rows, {
    ...emptyDentalSalesFilters,
    salesperson: "김지태",
    detailStatus: "정보 미입력",
  });

  assert.deepEqual(result, [rows[1]]);
});
