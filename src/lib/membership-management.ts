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
export type MembershipInquiryMethod = "external_link" | "phone" | "kakao";
export type MembershipContentType = "section" | "editor" | "download";

export interface AdminMembershipCreateInput {
  attachmentFile: File | null;
  attachmentLabel: string;
  benefitItems: string[];
  cardImage: File | null;
  category: MembershipCategory;
  contentType: MembershipContentType;
  description: string;
  detailDescription: string;
  detailImage: File | null;
  detailTitle: string;
  inquiryButtonLabel: string;
  inquiryMethod: MembershipInquiryMethod;
  inquiryValue: string;
  intro: string;
  isPreferred: boolean;
  isVisible: boolean;
  name: string;
  recommendedOrder: number;
  richContent: string;
  serviceTags: string[];
  strengths: string[];
}

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

export function validateMembershipRegistration(input: AdminMembershipCreateInput) {
  if (!input.name.trim()) return "업체명을 입력해 주세요.";
  if (!input.description.trim()) return "한 줄 소개를 입력해 주세요.";
  if (!Number.isInteger(input.recommendedOrder) || input.recommendedOrder < 1) {
    return "추천순 노출 가중치를 확인해 주세요.";
  }
  if (!input.detailTitle.trim()) return "상세 페이지 제목을 입력해 주세요.";
  if (!input.inquiryButtonLabel.trim()) return "문의 버튼명을 입력해 주세요.";
  if (!input.inquiryValue.trim()) return "문의 연결 값을 입력해 주세요.";
  return (
    membershipAssetError(input.cardImage, "card") ??
    membershipAssetError(input.detailImage, "detail") ??
    membershipAssetError(input.attachmentFile, "attachment")
  );
}

export function membershipAssetError(
  file: File | null,
  kind: "card" | "detail" | "attachment",
) {
  if (!file) return null;
  const imageTypes = ["image/jpeg", "image/png", "image/gif"];
  const attachmentTypes = [
    ...imageTypes,
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];
  const allowed = kind === "attachment" ? attachmentTypes : imageTypes;
  if (!allowed.includes(file.type)) {
    return kind === "attachment"
      ? "첨부파일은 JPG, PNG, GIF, PDF, PPT, PPTX 형식만 등록할 수 있습니다."
      : "이미지는 JPG, PNG, GIF 형식만 등록할 수 있습니다.";
  }
  const maximum = kind === "card" ? 2 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maximum) {
    return kind === "card"
      ? "대표 썸네일 이미지는 2MB 이하만 등록할 수 있습니다."
      : "파일은 10MB 이하만 등록할 수 있습니다.";
  }
  return null;
}
