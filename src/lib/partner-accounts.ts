export interface AdminPartnerAccountRow {
  id: string;
  email: string | null;
  fullName: string | null;
  clinicId: string | null;
  clinicName: string | null;
  membershipRole: string | null;
  classification: string;
  membershipStatus: string | null;
  lastActiveAt: string | null;
  joinedAt: string | null;
  accountStatus: string;
}

export interface AdminPartnerAccountsPayload {
  items: AdminPartnerAccountRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface AdminPartnerAccountDetail extends AdminPartnerAccountRow {
  membershipJoinedAt: string | null;
  withdrawnAt: string | null;
  loginProvider: string;
  licenseVerified: boolean;
  phoneVerified: boolean;
}

export interface AdminPartnerAccountDetailPayload {
  account: AdminPartnerAccountDetail;
}

const classificationLabels: Record<string, string> = {
  affiliated_dentist: "소속 치과 의사",
  representative: "대표",
  staff: "직원",
  unassigned: "미소속",
};

const membershipStatusLabels: Record<string, string> = {
  active: "소속 승인",
  pending: "소속 승인 대기",
  revoked: "소속 해제",
};

const accountStatusLabels: Record<string, string> = {
  active: "정상",
  dormant: "휴면",
  suspended: "정지",
  withdrawn: "탈퇴",
};

const loginProviderLabels: Record<string, string> = {
  apple: "Apple 로그인",
  email: "이메일 로그인",
  google: "Google 로그인",
  kakao: "카카오 로그인",
};

export function partnerAccountClassificationLabel(classification: string) {
  return (classificationLabels[classification] ?? classification) || "-";
}

export function partnerAccountMembershipStatusLabel(status: string | null) {
  if (!status) return "미소속";
  return membershipStatusLabels[status] ?? status;
}

export function partnerAccountStatusLabel(status: string) {
  return (accountStatusLabels[status] ?? status) || "-";
}

export function partnerAccountLoginProviderLabel(provider: string) {
  const normalized = provider.trim().toLowerCase();
  return loginProviderLabels[normalized] ?? `${provider || "기타"} 로그인`;
}

export function formatPartnerAccountDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}.${part("month")}.${part("day")} ${part("hour")}:${part("minute")}`;
}
