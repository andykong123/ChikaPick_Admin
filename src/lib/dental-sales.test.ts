import assert from "node:assert/strict";
import test from "node:test";

import {
  dentalSalesDetailLabel,
  dentalSalesPageNumbers,
  dentalSalesStatusLabel,
} from "./dental-sales.ts";

test("dental sales status helpers expose the Korean lifecycle labels", () => {
  assert.equal(dentalSalesStatusLabel("NOT_VISITED"), "미방문");
  assert.equal(dentalSalesStatusLabel("VISITING"), "방문");
  assert.equal(dentalSalesStatusLabel("SIGNED"), "가입완료");
  assert.equal(dentalSalesDetailLabel("INFORMATION_MISSING"), "정보 미입력");
  assert.equal(dentalSalesDetailLabel("ACTIVE"), "사용중");
  assert.equal(dentalSalesDetailLabel(null), "—");
});

test("dentalSalesPageNumbers keeps a five-page window around the current page", () => {
  assert.deepEqual(dentalSalesPageNumbers(1, 12), [1, 2, 3, 4, 5]);
  assert.deepEqual(dentalSalesPageNumbers(6, 12), [4, 5, 6, 7, 8]);
  assert.deepEqual(dentalSalesPageNumbers(12, 12), [8, 9, 10, 11, 12]);
  assert.deepEqual(dentalSalesPageNumbers(2, 3), [1, 2, 3]);
});
