import assert from "node:assert/strict";
import test from "node:test";

import {
  partnerClinicActivityLabel,
  partnerClinicDateLabel,
  partnerClinicDurationLabel,
  partnerClinicRatingLabel,
  partnerClinicRegistrationLabel,
  partnerClinicResponseRate,
} from "./partner-clinics.ts";

test("partner clinic activity uses Korea calendar days and preserves never-seen state", () => {
  const now = new Date("2026-07-16T03:00:00.000Z");

  assert.equal(partnerClinicActivityLabel(null, now), "미접속");
  assert.equal(
    partnerClinicActivityLabel("2026-07-16T00:00:00.000Z", now),
    "오늘",
  );
  assert.equal(
    partnerClinicActivityLabel("2026-07-14T14:59:00.000Z", now),
    "2일 전",
  );
});

test("partner clinic registration matches the compact Figma timestamp", () => {
  assert.equal(
    partnerClinicRegistrationLabel("2026-07-03T04:20:00.000Z"),
    "2026.07.03. 오후 01:20",
  );
});

test("partner clinic detail labels format live metric values", () => {
  assert.equal(partnerClinicDateLabel("2026-07-14T00:00:00.000Z"), "2026.07.14");
  assert.deepEqual(partnerClinicDurationLabel(144), { value: "2.4", unit: "시간" });
  assert.deepEqual(partnerClinicDurationLabel(38), { value: "38", unit: "분" });
  assert.equal(partnerClinicResponseRate(847, 812), "95.9%");
  assert.equal(partnerClinicRatingLabel("very_satisfied"), "매우만족");
});
