import assert from "node:assert/strict";
import test from "node:test";

import {
  formatSecretFeedbackDate,
  secretFeedbackImpressionTags,
  secretFeedbackRatingLabel,
  secretFeedbackRatings,
} from "./secret-feedback.ts";

test("secret feedback labels and assets preserve the Client survey contract", () => {
  assert.deepEqual(
    secretFeedbackRatings.map((rating) => rating.code),
    [
      "very_satisfied",
      "satisfied",
      "ok",
      "dissatisfied",
      "very_dissatisfied",
    ],
  );
  assert.equal(secretFeedbackRatingLabel("very_satisfied", true), "매우만족");
  assert.equal(secretFeedbackRatingLabel("very_dissatisfied"), "매우 아쉬움");
  assert.equal(secretFeedbackImpressionTags.length, 6);
  assert.match(secretFeedbackRatings[0].assetPath, /piki_rate_very_satisfied/);
});

test("secret feedback received dates use the Korea calendar day", () => {
  assert.equal(
    formatSecretFeedbackDate("2026-06-30T15:00:00.000Z"),
    "26.07.01",
  );
  assert.equal(formatSecretFeedbackDate("invalid"), "-");
});
