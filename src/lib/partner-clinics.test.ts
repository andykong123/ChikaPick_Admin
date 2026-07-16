import assert from "node:assert/strict";
import test from "node:test";

import {
  partnerClinicActivityLabel,
  partnerClinicRegistrationLabel,
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
