export type AdminAccountDirectoryRole =
  | "all"
  | "super_admin"
  | "sales"
  | "admin";

export interface AdminAccountDirectoryFilters {
  role: AdminAccountDirectoryRole;
  query: string;
}

export interface AdminAccountDirectoryItem {
  id: string;
  fullName: string | null;
  email: string | null;
  accountId: string;
  role: Exclude<AdminAccountDirectoryRole, "all">;
  status: string;
  lastLoginAt: string | null;
  joinedAt: string;
}

export interface AdminAccountDirectoryPayload {
  items: AdminAccountDirectoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  canManage: boolean;
}

export const defaultAdminAccountDirectoryFilters: AdminAccountDirectoryFilters = {
  role: "all",
  query: "",
};

export function adminInviteDisplayName(email: string) {
  const normalizedEmail = email.trim();
  return normalizedEmail.split("@", 1)[0] || normalizedEmail;
}

export function adminAccountDirectoryRoleLabel(
  role: Exclude<AdminAccountDirectoryRole, "all">,
) {
  if (role === "super_admin") return "최고 관리자";
  if (role === "sales") return "영업 담당자";
  return "운영 관리자";
}

export function adminAccountDirectoryStatusLabel(status: string) {
  if (status === "active") return "활성";
  if (status === "invited") return "초대 대기";
  if (status === "locked") return "잠금";
  return "비활성";
}

export function formatAdminAccountDirectoryDate(
  value: string | null,
  includeTime = false,
) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(includeTime
      ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" as const }
      : {}),
  }).formatToParts(date);
  const valueOf = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const day = `${valueOf("year")}.${valueOf("month")}.${valueOf("day")}`;
  return includeTime ? `${day} ${valueOf("hour")}:${valueOf("minute")}` : day;
}
