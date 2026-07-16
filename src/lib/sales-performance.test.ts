import assert from "node:assert/strict";
import test from "node:test";

import {
  canAccessSalesPerformance,
  defaultSalesPerformanceFilters,
  formatSalesPerformanceDate,
  salesPerformanceDetailLabel,
  salesPerformanceMonthOptions,
} from "./sales-performance.ts";

test("sales performance access is limited to the current Super Admin", () => {
  const users = [
    { id: "admin-1", isSuperAdmin: false },
    { id: "super-1", isSuperAdmin: true },
  ];
  assert.equal(canAccessSalesPerformance(users, "admin-1"), false);
  assert.equal(canAccessSalesPerformance(users, "super-1"), true);
  assert.equal(canAccessSalesPerformance(users, "missing"), false);
});

test("sales performance defaults match the Super Admin monthly report", () => {
  const filters = defaultSalesPerformanceFilters(
    new Date("2026-06-30T15:00:00.000Z"),
  );
  assert.deepEqual(filters, {
    month: "2026-07",
    salespersonId: "",
    externalConnectorId: "",
    detailStatus: "ACTIVE",
  });
});

test("sales performance labels and dates match the Korean Figma table", () => {
  assert.equal(salesPerformanceDetailLabel("ACTIVE"), "사용중");
  assert.equal(salesPerformanceDetailLabel("INFORMATION_MISSING"), "정보 미입력");
  assert.equal(
    formatSalesPerformanceDate("2026-06-30T15:00:00.000Z"),
    "2026-07-01",
  );
  assert.deepEqual(
    salesPerformanceMonthOptions(new Date("2026-06-01T00:00:00.000Z"), 3),
    [
      { value: "2026-06", label: "2026/06" },
      { value: "2026-05", label: "2026/05" },
      { value: "2026-04", label: "2026/04" },
    ],
  );
});
