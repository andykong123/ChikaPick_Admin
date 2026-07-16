export type AdminDetailHistorySelection = {
  tab: "dental-sales" | "partner-clinics";
  id: string;
};

type AdminDetailHistory = Pick<
  History,
  "back" | "pushState" | "replaceState" | "state"
>;

const stateKey = "chikapickAdminDetail";

export function adminDetailFromHistoryState(
  state: unknown,
): AdminDetailHistorySelection | null {
  if (!state || typeof state !== "object") return null;
  const value = (state as Record<string, unknown>)[stateKey];
  if (!value || typeof value !== "object") return null;
  const tab = (value as Record<string, unknown>).tab;
  const id = (value as Record<string, unknown>).id;
  if (
    (tab !== "dental-sales" && tab !== "partner-clinics") ||
    typeof id !== "string" ||
    !id
  ) {
    return null;
  }
  return { tab, id };
}

export function adminDetailHistoryState(
  currentState: unknown,
  selection: AdminDetailHistorySelection | null,
) {
  const state =
    currentState && typeof currentState === "object"
      ? { ...(currentState as Record<string, unknown>) }
      : {};
  if (selection) state[stateKey] = selection;
  else delete state[stateKey];
  return state;
}

export function pushAdminDetailHistory(
  history: AdminDetailHistory,
  href: string,
  selection: AdminDetailHistorySelection,
) {
  history.pushState(adminDetailHistoryState(history.state, selection), "", href);
}

export function replaceAdminDetailHistory(
  history: AdminDetailHistory,
  href: string,
  selection: AdminDetailHistorySelection | null,
) {
  history.replaceState(adminDetailHistoryState(history.state, selection), "", href);
}

export function requestAdminDetailBack(
  history: AdminDetailHistory,
  tab: AdminDetailHistorySelection["tab"],
) {
  if (adminDetailFromHistoryState(history.state)?.tab !== tab) return false;
  history.back();
  return true;
}
