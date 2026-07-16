export type SalesPerformanceDetailStatus = "INFORMATION_MISSING" | "ACTIVE";

export interface SalesPerformanceFilters {
  month: string;
  salespersonId: string;
  externalConnectorId: string;
  detailStatus: SalesPerformanceDetailStatus;
}

export interface SalesPerformancePerson {
  id: string;
  name: string;
}

export interface SalesPerformanceRow {
  id: string;
  salesperson: SalesPerformancePerson | null;
  externalConnector: SalesPerformancePerson | null;
  clinicName: string;
  status: "SIGNED";
  detailStatus: SalesPerformanceDetailStatus;
  lastStatusChangedAt: string;
}

export interface SalesPerformancePayload {
  month: string;
  status: "SIGNED";
  detailStatus: SalesPerformanceDetailStatus;
  metrics: {
    salespersonOnly: number;
    externalConnectorOnly: number;
    bothAssigned: number;
  };
  items: SalesPerformanceRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filterOptions: {
    salespeople: SalesPerformancePerson[];
    externalConnectors: SalesPerformancePerson[];
  };
}

export function canAccessSalesPerformance(
  users: Array<{ id: string; isSuperAdmin?: boolean }>,
  currentUserId: string | undefined,
) {
  return users.some(
    (user) => user.id === currentUserId && user.isSuperAdmin === true,
  );
}

export function defaultSalesPerformanceFilters(
  now = new Date(),
): SalesPerformanceFilters {
  return {
    month: koreaYearMonth(now),
    salespersonId: "",
    externalConnectorId: "",
    detailStatus: "ACTIVE",
  };
}

export function salesPerformanceMonthOptions(
  now = new Date(),
  count = 60,
) {
  const current = koreaYearMonth(now);
  const [year, month] = current.split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - index, 1));
    const value = `${date.getUTCFullYear()}-${String(
      date.getUTCMonth() + 1,
    ).padStart(2, "0")}`;
    return { value, label: value.replace("-", "/") };
  });
}

export function salesPerformanceDetailLabel(
  detailStatus: SalesPerformanceDetailStatus,
) {
  return detailStatus === "ACTIVE" ? "사용중" : "정보 미입력";
}

export function formatSalesPerformanceDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const parts = new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function koreaYearMonth(date: Date) {
  const parts = new Intl.DateTimeFormat("en", {
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}
