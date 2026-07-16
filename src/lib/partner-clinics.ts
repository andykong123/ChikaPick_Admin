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
  hospitalInformation: DentalSalesHospitalInformation;
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
