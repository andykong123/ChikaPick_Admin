export type DentalSalesHospitalStatus = "NOT_VISITED" | "VISITING" | "SIGNED";
export type DentalSalesVisitDetailStatus =
  | "INTEREST"
  | "CODE_SHARED"
  | "REJECTED"
  | "ON_HOLD";
export type DentalSalesDetailStatus =
  | DentalSalesVisitDetailStatus
  | "INFORMATION_MISSING"
  | "ACTIVE";

export interface DentalSalesperson {
  id: string;
  name: string;
  teamName?: string | null;
}

export interface DentalSalesRow {
  id: string;
  city: string;
  district: string;
  neighborhood: string | null;
  clinicName: string;
  phone: string | null;
  salesperson: DentalSalesperson | null;
  salesCode: string;
  status: DentalSalesHospitalStatus;
  detailStatus: DentalSalesDetailStatus | null;
}

export interface DentalSalesVisit {
  id: string;
  salesperson: { id: string | null; name: string };
  detailStatus: DentalSalesVisitDetailStatus;
  visitedAt: string;
  note: string | null;
  createdByAdminUserId: string | null;
  createdAt: string;
}

export interface DentalSalesPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface DentalSalesFilters {
  city: string;
  district: string;
  clinicName: string;
  salespersonId: string;
  status: "" | DentalSalesHospitalStatus;
  detailStatus: "" | DentalSalesDetailStatus;
}

export interface DentalSalesListPayload {
  items: DentalSalesRow[];
  pagination: DentalSalesPagination;
  filterOptions: {
    regions: Array<{ name: string; prefix: string }>;
    districts: string[];
    salespeople: DentalSalesperson[];
  };
}

export interface DentalSalesDetailPayload {
  canEditAssignment: boolean;
  profile: DentalSalesRow & {
    address: string;
    assignedSalesperson: DentalSalesperson | null;
    externalConnector: DentalSalesperson | null;
    claimedAt: string | null;
    signedAt: string | null;
    representativeName?: string | null;
    businessRegistrationNumber?: string | null;
    medicalInstitutionType?: string | null;
    isAppVisible?: boolean;
    businessLicense?: {
      fileName: string;
      url?: string | null;
    } | null;
    informationCompletion?: {
      percentage: number;
      updatedAt: string | null;
    } | null;
  };
  visits: DentalSalesVisit[];
  visitPagination: DentalSalesPagination;
  salespeople: DentalSalesperson[];
  externalConnectors: DentalSalesperson[];
}

export const emptyDentalSalesFilters: DentalSalesFilters = {
  city: "",
  district: "",
  clinicName: "",
  salespersonId: "",
  status: "",
  detailStatus: "",
};

export const dentalSalesStatusOptions: Array<{
  value: "" | DentalSalesHospitalStatus;
  label: string;
}> = [
  { value: "", label: "전체" },
  { value: "NOT_VISITED", label: "미방문" },
  { value: "VISITING", label: "방문" },
  { value: "SIGNED", label: "가입완료" },
];

export const dentalSalesDetailOptions: Array<{
  value: "" | DentalSalesDetailStatus;
  label: string;
}> = [
  { value: "", label: "전체" },
  { value: "INTEREST", label: "관심/검토" },
  { value: "CODE_SHARED", label: "코드전달" },
  { value: "REJECTED", label: "거절" },
  { value: "ON_HOLD", label: "보류" },
  { value: "INFORMATION_MISSING", label: "정보 미입력" },
  { value: "ACTIVE", label: "사용중" },
];

export function dentalSalesStatusLabel(status: DentalSalesHospitalStatus) {
  return dentalSalesStatusOptions.find((option) => option.value === status)?.label ?? status;
}

export function dentalSalesDetailLabel(status: DentalSalesDetailStatus | null) {
  if (!status) return "—";
  return dentalSalesDetailOptions.find((option) => option.value === status)?.label ?? status;
}

export function dentalSalesVisitTitle(
  status: DentalSalesVisitDetailStatus,
  salesCode: string,
) {
  switch (status) {
    case "INTEREST":
      return "방문 상담 - 관심/검토 중";
    case "CODE_SHARED":
      return `초대코드 ${salesCode} 전달`;
    case "REJECTED":
      return "영업 제안 거절";
    case "ON_HOLD":
      return "후속 논의 보류";
  }
}

const dentalSalesVisitTitlePrefix = "[영업 기록 제목] ";

export function dentalSalesVisitNote(title: string, memo: string) {
  const cleanTitle = title.trim();
  const cleanMemo = memo.trim();
  return `${dentalSalesVisitTitlePrefix}${cleanTitle}${cleanMemo ? `\n${cleanMemo}` : ""}`;
}

export function dentalSalesVisitPresentation({
  detailStatus,
  note,
  salesCode,
}: {
  detailStatus: DentalSalesVisitDetailStatus;
  note: string | null;
  salesCode: string;
}) {
  if (note?.startsWith(dentalSalesVisitTitlePrefix)) {
    const [titleLine, ...memoLines] = note.split("\n");
    return {
      title: titleLine.slice(dentalSalesVisitTitlePrefix.length).trim(),
      memo: memoLines.join("\n").trim(),
    };
  }
  return {
    title: dentalSalesVisitTitle(detailStatus, salesCode),
    memo: note?.trim() ?? "",
  };
}

export function isDentalSalesVisitDetailStatus(
  status: DentalSalesDetailStatus | null,
): status is DentalSalesVisitDetailStatus {
  return status !== null && ["INTEREST", "CODE_SHARED", "REJECTED", "ON_HOLD"].includes(status);
}

export function dentalSalesRegionLabel(city: string, district: string) {
  const shortCity = city
    .replace(/특별자치시$/, "")
    .replace(/특별자치도$/, "")
    .replace(/특별시$/, "")
    .replace(/광역시$/, "")
    .replace(/도$/, "");
  return `${shortCity} / ${district}`;
}

export function dentalSalesBusinessFileError(file: {
  size: number;
  type: string;
}) {
  if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
    return "JPG, PNG, PDF 파일만 선택할 수 있습니다.";
  }
  if (file.size > 10 * 1024 * 1024) {
    return "파일 크기는 10MB 이하여야 합니다.";
  }
  return null;
}

export function dentalSalesPageNumbers(currentPage: number, totalPages: number) {
  const visibleCount = Math.min(5, Math.max(1, totalPages));
  const start = Math.min(
    Math.max(1, currentPage - Math.floor(visibleCount / 2)),
    Math.max(1, totalPages - visibleCount + 1),
  );
  return Array.from({ length: visibleCount }, (_, index) => start + index);
}
