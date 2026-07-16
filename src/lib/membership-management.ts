export const membershipCategories = [
  { code: "all", label: "전체" },
  { code: "lab", label: "기공소" },
  { code: "equipment_materials", label: "장비/재료" },
  { code: "interior", label: "인테리어" },
  { code: "opening_consulting", label: "개원 컨설팅" },
  { code: "mso", label: "MSO" },
  { code: "tax_labor_legal", label: "세무/노무/법무" },
] as const;

export type MembershipCategory = Exclude<
  (typeof membershipCategories)[number]["code"],
  "all"
>;
export type MembershipCategoryFilter =
  (typeof membershipCategories)[number]["code"];
export type MembershipSort = "recommended" | "name" | "updated";

export interface AdminMembershipPartner {
  id: string;
  name: string;
  category: MembershipCategory;
  recommendedOrder: number;
  updatedAt: string;
  isVisible: boolean;
}

export interface AdminMembershipInquiry {
  id: string;
  partnerId: string;
  requesterName: string | null;
  requesterEmail: string | null;
  clinicName: string | null;
  partnerName: string;
  partnerCategory: MembershipCategory;
  createdAt: string;
}

export interface AdminMembershipManagementPayload {
  items: AdminMembershipPartner[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  inquiries: AdminMembershipInquiry[];
  pendingInquiryCount: number;
}

export interface AdminMembershipFilters {
  category: MembershipCategoryFilter;
  query: string;
  sort: MembershipSort;
}

export const defaultAdminMembershipFilters: AdminMembershipFilters = {
  category: "all",
  query: "",
  sort: "recommended",
};

export function membershipCategoryLabel(category: MembershipCategory) {
  return (
    membershipCategories.find((item) => item.code === category)?.label ?? category
  );
}

export function membershipSortLabel(sort: MembershipSort) {
  if (sort === "name") return "업체명순";
  if (sort === "updated") return "최근 수정순";
  return "추천순";
}

export function formatMembershipDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return year && month && day ? `${year}.${month}.${day}` : "-";
}

export function membershipPageNumbers(currentPage: number, totalPages: number) {
  const safeTotal = Math.max(1, totalPages);
  const start = Math.max(1, Math.min(currentPage - 1, safeTotal - 2));
  return Array.from(
    { length: Math.min(3, safeTotal) },
    (_, index) => start + index,
  );
}
