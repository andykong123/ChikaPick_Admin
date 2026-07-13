import assert from "node:assert/strict";
import { test } from "node:test";

import { statusLabel } from "./admin-display.ts";

test("statusLabel localizes existing admin statuses", () => {
  assert.equal(statusLabel("pending_review"), "심사 대기");
  assert.equal(statusLabel("approved"), "승인");
  assert.equal(statusLabel("rejected"), "반려");
  assert.equal(statusLabel("pending"), "대기");
  assert.equal(statusLabel("active"), "활성");
  assert.equal(statusLabel("revoked"), "회수");
  assert.equal(statusLabel("redeemed"), "사용됨");
});

test("statusLabel localizes reservation lifecycle statuses", () => {
  assert.equal(statusLabel("confirmed"), "예약 확정");
  assert.equal(statusLabel("cancelled"), "예약 취소");
  assert.equal(statusLabel("completed"), "방문 완료");
});

test("statusLabel groups proposed-time reservation aliases", () => {
  assert.equal(statusLabel("time_proposed"), "예약 시간 확인 필요");
  assert.equal(statusLabel("alternative_proposed"), "예약 시간 확인 필요");
  assert.equal(statusLabel("proposed"), "예약 시간 확인 필요");
  assert.equal(statusLabel("reschedule_proposed"), "예약 시간 확인 필요");
});

test("statusLabel groups unavailable reservation aliases", () => {
  assert.equal(statusLabel("unavailable"), "예약 불가");
  assert.equal(statusLabel("reservation_unavailable"), "예약 불가");
  assert.equal(statusLabel("declined"), "예약 불가");
});

test("statusLabel falls back to the raw status", () => {
  assert.equal(statusLabel("custom_status"), "custom_status");
});
