import assert from "node:assert/strict";
import test from "node:test";

import {
  adminDetailFromHistoryState,
  adminDetailHistoryState,
  pushAdminDetailHistory,
  replaceAdminDetailHistory,
  requestAdminDetailBack,
} from "./admin-detail-history.ts";

test("admin detail history preserves unrelated browser state", () => {
  const state = adminDetailHistoryState(
    { existing: true },
    { tab: "partner-clinics", id: "clinic-1" },
  );

  assert.deepEqual(state, {
    existing: true,
    chikapickAdminDetail: { tab: "partner-clinics", id: "clinic-1" },
  });
  assert.deepEqual(adminDetailFromHistoryState(state), {
    tab: "partner-clinics",
    id: "clinic-1",
  });
});

test("admin detail history clears detail without losing unrelated state", () => {
  assert.deepEqual(
    adminDetailHistoryState(
      {
        existing: true,
        chikapickAdminDetail: { tab: "dental-sales", id: "profile-1" },
      },
      null,
    ),
    { existing: true },
  );
});

test("admin detail history rejects malformed selections", () => {
  assert.equal(
    adminDetailFromHistoryState({
      chikapickAdminDetail: { tab: "unknown", id: "clinic-1" },
    }),
    null,
  );
});

test("browser Back returns both Admin detail tabs to their default list state", () => {
  for (const selection of [
    { tab: "partner-clinics", id: "clinic-1" },
    { tab: "dental-sales", id: "profile-1" },
  ] as const) {
    const history = new FakeHistory({ unrelated: true });

    pushAdminDetailHistory(history, "https://admin.chikapick.com/", selection);
    assert.deepEqual(adminDetailFromHistoryState(history.state), selection);
    assert.equal(requestAdminDetailBack(history, selection.tab), true);
    assert.equal(adminDetailFromHistoryState(history.state), null);
    assert.deepEqual(history.state, { unrelated: true });
  }
});

test("clearing detail replaces the current entry without creating Back history", () => {
  const history = new FakeHistory();
  pushAdminDetailHistory(history, "https://admin.chikapick.com/", {
    tab: "partner-clinics",
    id: "clinic-1",
  });

  replaceAdminDetailHistory(history, "https://admin.chikapick.com/", null);

  assert.equal(adminDetailFromHistoryState(history.state), null);
  assert.equal(requestAdminDetailBack(history, "partner-clinics"), false);
});

class FakeHistory {
  private index = 0;
  private readonly entries: unknown[];

  constructor(initialState: unknown = null) {
    this.entries = [initialState];
  }

  get state() {
    return this.entries[this.index];
  }

  pushState(state: unknown) {
    this.entries.splice(this.index + 1, Infinity, state);
    this.index += 1;
  }

  replaceState(state: unknown) {
    this.entries[this.index] = state;
  }

  back() {
    this.index = Math.max(0, this.index - 1);
  }
}
