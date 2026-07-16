import type { AdminReviewStatus, ManualHospitalSubmission } from "./admin-api";

export function manualHospitalReviewStatusLabel(status: AdminReviewStatus) {
  if (status === "pending_review") return "심사 대기";
  if (status === "approved") return "승인 완료";
  if (status === "rejected") return "반려";
  return "신청 취소";
}

export function manualHospitalReviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function manualHospitalRequestAccount(item: ManualHospitalSubmission) {
  return item.user.email ?? item.user.fullName ?? "-";
}

export function normalizeManualHospitalRejectionReason(value: string) {
  return value.trim();
}
