export interface ChikapickAccountLookupPayload {
  account: {
    email: string | null;
    loginProvider: string;
    fullName: string | null;
    mobileNo: string | null;
    countryCode: string | null;
    status: string;
    createdAt: string | null;
    lastSignInAt: string | null;
    withdrawnAt: string | null;
    family: {
      registered: boolean;
      memberCount: number;
      memberNames: string[];
    };
  };
  masked: boolean;
}

const providerLabels: Record<string, string> = {
  apple: "Apple 로그인",
  email: "이메일 로그인",
  google: "Google 로그인",
  kakao: "카카오 로그인",
};

const statusLabels: Record<string, string> = {
  active: "정상",
  dormant: "휴면",
  suspended: "정지",
  withdrawn: "탈퇴",
};

export function chikapickLoginProviderLabel(provider: string) {
  const normalized = provider.trim().toLowerCase();
  return providerLabels[normalized] ?? `${provider || "기타"} 로그인`;
}

export function chikapickAccountStatusLabel(status: string) {
  return statusLabels[status] ?? (status || "-");
}

export function chikapickAccountStatusTone(status: string) {
  return status in statusLabels ? status : "unknown";
}

export function chikapickCountryLabel(countryCode: string | null) {
  if (!countryCode) return "-";
  if (countryCode === "KR") return "대한민국";
  if (countryCode === "OTHER") return "외국";
  return countryCode;
}

export function formatChikapickAccountDate(value: string | null) {
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
