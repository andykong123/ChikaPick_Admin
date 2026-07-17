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
  attachments: DentalSalesDocument[];
}

export interface DentalSalesDocument {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedByAdminUserId: string | null;
  url: string | null;
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

export interface DentalSalesHospitalInformation {
  clinic_id: string;
  basic_info: {
    clinic_name: string;
  };
  photos: {
    summary: {
      representative_count: number;
      total_count: number;
    };
  };
  staff: {
    summary: {
      total_count: number;
      completed_count: number;
      incomplete_count: number;
      percentage: number;
    };
  };
  operating_hours: {
    weekly: Partial<Record<string, object | null>>;
  };
  fee_schedule: {
    has_items: boolean;
  };
  completion: {
    completed_count: number;
    total_count: number;
    missing_count: number;
    percentage: number;
  };
  updated_at: string | null;
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
    businessLicense?: DentalSalesDocument | null;
    informationCompletion?: {
      percentage: number;
      updatedAt: string | null;
    } | null;
  };
  visits: DentalSalesVisit[];
  visitPagination: DentalSalesPagination;
  salespeople: DentalSalesperson[];
  externalConnectors: DentalSalesperson[];
  hospitalInformation: DentalSalesHospitalInformation | null;
}

export const dentalSalesHospitalInformationCards = [
  {
    key: "basicInfo",
    title: "병원 기본 정보",
    description:
      "사업자등록번호로 불러온 병원 정보를 확인하고 수정해 주세요. 병원명, 주소, 대표 전화번호 등 기본 정보를 설정합니다.",
    primaryAction: "내용 확인하기",
    secondaryAction: "수정하기",
    wide: false,
  },
  {
    key: "photos",
    title: "병원 사진 업로드",
    description:
      "환자가 병원을 미리 확인할 수 있도록 사진을 등록해 주세요.\n외관, 내부, 진료실, 주차장 안내 사진을 카테고리별로 업로드할 수 있습니다.",
    primaryAction: "미리보기",
    secondaryAction: "수정하기",
    wide: false,
  },
  {
    key: "staff",
    title: "의료진 프로필 관리",
    description:
      "병원 소속 의료진이 직접 입력한 프로필 현황을 확인하세요. 입력 완료된 정보는 환자용 앱 의사 소개 영역에 노출됩니다.",
    primaryAction: "미리보기",
    secondaryAction: "진행률 보기",
    wide: false,
  },
  {
    key: "hours",
    title: "진료시간 및 휴진",
    description:
      "환자에게 안내할 진료시간과 휴진 정보를 설정해 주세요.\n요일별 운영시간, 점심시간, 공휴일 및 특별 휴진일을 관리합니다.",
    primaryAction: "미리보기",
    secondaryAction: "수정하기",
    wide: true,
  },
  {
    key: "fees",
    title: "비급여 진료 수가표",
    description:
      "비급여 진료 항목과 금액 정보를 등록해 주세요.\n항목별 병원 금액과 치카픽 제휴가를 입력해 환자에게 안내할 수 있습니다.",
    primaryAction: "미리보기",
    secondaryAction: "수정하기",
    wide: true,
  },
] as const;

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

export function dentalSalesCompletionViewState({
  detailStatus,
  isAppVisible,
  percentage,
}: {
  detailStatus: DentalSalesDetailStatus | null;
  isAppVisible?: boolean;
  percentage?: number | null;
}) {
  const completionPercentage =
    percentage ?? (detailStatus === "ACTIVE" ? 100 : null);
  const isComplete = completionPercentage === 100;

  return {
    completionPercentage,
    isAppVisible: isAppVisible ?? isComplete,
    isComplete,
  };
}

export function dentalSalesHospitalInformationReviewState(
  information: DentalSalesHospitalInformation,
) {
  const staff = information.staff.summary;
  return {
    cardStatuses: {
      basicInfo: information.basic_info.clinic_name ? "complete" : "needsSetup",
      photos: information.photos.summary.total_count > 0 ? "complete" : "needsSetup",
      staff:
        staff.total_count > 0 && staff.incomplete_count === 0
          ? "complete"
          : "needsSetup",
      hours: Object.values(information.operating_hours.weekly).some(Boolean)
        ? "complete"
        : "needsSetup",
      fees: information.fee_schedule.has_items ? "complete" : "needsSetup",
    } as const,
    staffMetric: `총 의료진 ${staff.total_count}명 · 입력 완료 ${staff.completed_count}명 · 미입력 ${staff.incomplete_count}명 · 진행률 ${staff.percentage}%`,
  };
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
