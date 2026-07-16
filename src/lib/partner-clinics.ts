import type { DentalSalesHospitalInformation } from "./dental-sales";

export interface AdminPartnerClinicRow {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  representativeName: string | null;
  doctorCount: number;
  staffCount: number;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface AdminPartnerClinicsPayload {
  items: AdminPartnerClinicRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface AdminPartnerClinicDetailPayload {
  clinic: AdminPartnerClinicRow & {
    memberCount: number;
    isAppVisible: boolean;
  };
  metrics: {
    consultations: PartnerClinicResponseMetrics;
    resultRecords: PartnerClinicResponseMetrics;
    reservations: {
      requests: number;
      confirmed: number;
      cancelled: number;
      inProgress: number;
      averageConfirmationMinutes: number | null;
      recent30Days: number;
    };
    instantBookings: {
      monthlySlotRegistrations: number;
      totalBookings: number;
      latestRegistrationAt: string | null;
      monthlyTrend: Array<{ month: string; count: number }>;
    };
    feedback: {
      total: number;
      recent30Days: number;
      items: Array<{
        id: string;
        rating: string;
        submittedAt: string;
      }>;
    };
  };
  hospitalInformation: DentalSalesHospitalInformation;
}

interface PartnerClinicResponseMetrics {
  requests: number;
  responses: number;
  unanswered: number;
  averageResponseMinutes: number | null;
  recent30Days: number;
}

export function partnerClinicActivityLabel(
  value: string | null,
  now = new Date(),
) {
  if (!value) return "미접속";
  const activity = new Date(value);
  if (Number.isNaN(activity.getTime())) return "미접속";
  const difference = Math.max(0, koreaDayStamp(now) - koreaDayStamp(activity));
  return difference === 0 ? "오늘" : `${difference}일 전`;
}

export function partnerClinicRegistrationLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "Asia/Seoul",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  const hour = Number(parts.hour);
  const dayPeriod = hour < 12 ? "오전" : "오후";
  const twelveHour = String(hour % 12 || 12).padStart(2, "0");
  return `${parts.year}.${parts.month}.${parts.day}. ${dayPeriod} ${twelveHour}:${parts.minute}`;
}

export function partnerClinicDateLabel(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  })
    .format(date)
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}

export function partnerClinicDurationLabel(minutes: number | null) {
  if (minutes === null || !Number.isFinite(minutes)) return { value: "-", unit: "" };
  if (minutes >= 60) {
    return {
      value: (minutes / 60).toFixed(1).replace(/\.0$/, ""),
      unit: "시간",
    };
  }
  return { value: String(Math.max(0, Math.round(minutes))), unit: "분" };
}

export function partnerClinicResponseRate(requests: number, responses: number) {
  if (requests <= 0) return "0%";
  return `${((responses / requests) * 100).toFixed(1)}%`;
}

export function partnerClinicRatingLabel(value: string) {
  return (
    {
      very_satisfied: "매우만족",
      satisfied: "만족",
      ok: "보통",
      dissatisfied: "불만족",
      very_dissatisfied: "매우불만족",
    }[value] ?? "-"
  );
}

function koreaDayStamp(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Seoul",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) /
    86_400_000;
}
