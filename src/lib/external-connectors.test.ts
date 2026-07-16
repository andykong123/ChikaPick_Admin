import assert from "node:assert/strict";
import test from "node:test";

import { formatExternalConnectorDate } from "./external-connectors.ts";

test("external connector dates use the Korea calendar date from the Figma table", () => {
  assert.equal(
    formatExternalConnectorDate("2026-01-11T15:00:00.000Z"),
    "2026.01.12",
  );
  assert.equal(formatExternalConnectorDate("invalid"), "-");
});
