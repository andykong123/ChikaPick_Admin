export interface ExternalConnectorDirectoryItem {
  id: string;
  name: string;
  affiliation: string | null;
  createdAt: string;
}

export interface ExternalConnectorDirectoryPayload {
  items: ExternalConnectorDirectoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  canManage: boolean;
}

export function formatExternalConnectorDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const valueOf = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${valueOf("year")}.${valueOf("month")}.${valueOf("day")}`;
}
