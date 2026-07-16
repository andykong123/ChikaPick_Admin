import type { LicenseVerificationRequest } from "./admin-api.ts";

export interface LicenseVerificationSummary {
  total: number;
  approved: number;
  pending: number;
  unrequested: number;
}

export function summarizeLicenseVerifications(
  requests: LicenseVerificationRequest[],
): LicenseVerificationSummary {
  return requests.reduce<LicenseVerificationSummary>(
    (summary, request) => {
      summary.total += 1;
      if (request.licenseVerified) summary.approved += 1;
      else if (request.latestSubmission?.status === "pending_review") {
        summary.pending += 1;
      } else summary.unrequested += 1;
      return summary;
    },
    { total: 0, approved: 0, pending: 0, unrequested: 0 },
  );
}

export function pendingLicenseVerificationRequests(
  requests: LicenseVerificationRequest[],
) {
  return requests.filter(
    (request) =>
      !request.licenseVerified &&
      request.latestSubmission?.status === "pending_review",
  );
}

export function licenseRequestTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
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
  return `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`;
}

export function licenseMembershipRoleLabel(role: "owner" | "doctor") {
  return role === "owner" ? "원장" : "치과의사";
}

export function normalizeLicenseRejectionReason(value: string) {
  const reason = value.trim();
  return reason || null;
}
