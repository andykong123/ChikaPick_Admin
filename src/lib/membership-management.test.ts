import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formatMembershipDate,
  membershipCategoryLabel,
  membershipPageNumbers,
  membershipSortLabel,
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
