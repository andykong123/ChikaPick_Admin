export type AdminReviewStatus = "pending_review" | "approved" | "rejected";
export type AdminAccountRole = "admin" | "super_admin";
export type MembershipRole = "owner" | "doctor" | "manager" | "staff";
export type MembershipStatus = "active" | "pending" | "revoked";

export interface AdminMetric {
  label: string;
  value: number;
  tone: "blue" | "orange" | "green" | "red";
}

export interface ManualHospitalSubmission {
  id: string;
  status: AdminReviewStatus;
  createdAt: string;
  hospitalName: string;
  businessName: string;
  ownerName: string;
  representativePhone: string;
  address: string;
  businessLicenseFileName: string;
  businessLicenseContentType: string;
  businessLicenseUrl: string | null;
  user: {
    id: string;
    email: string | null;
    fullName: string | null;
  };
}

export interface ClinicJoinRequest {
  clinicId: string;
  clinicName: string;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  role: Exclude<MembershipRole, "owner">;
  status: MembershipStatus;
  requestedAt: string;
}

export interface LicenseVerificationRequest {
  userId: string;
  email: string | null;
  displayName: string | null;
  jobTitle: string | null;
  licenseVerified: boolean;
  updatedAt: string | null;
  latestSubmission: LicenseVerificationSubmission | null;
}

export interface LicenseVerificationSubmission {
  id: string;
  status: AdminReviewStatus;
  submittedAt: string;
  reviewedAt: string | null;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  signedUrl: string | null;
}

export interface AdminClinic {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  isChikapickPartner: boolean;
  ownerCount: number;
  memberCount: number;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string | null;
  fullName: string | null;
  roles: string[];
  accountStatus: string | null;
  memberships: Array<{
    clinicId: string;
    clinicName: string | null;
    role: MembershipRole;
    status: MembershipStatus;
  }>;
}

export interface AdminInvite {
  id: string;
  clinicName: string | null;
  invitedRole: MembershipRole;
  status: string;
  expiresAt: string | null;
  issuedAt: string | null;
  redeemedAt: string | null;
}

export interface AdminReservation {
  id: string;
  clinicName: string | null;
  patientName: string | null;
  status: string;
  scheduledAt: string | null;
  createdAt: string;
}

export interface AdminConsultation {
  id: string;
  clinicName: string | null;
  patientName: string | null;
  title: string;
  status: string;
  createdAt: string;
  respondedAt: string | null;
}

export interface AdminTermDocument {
  id: string;
  code: string;
  title: string;
  appliesTo: string | null;
  isRequired: boolean;
  activeVersion: number | null;
  updatedAt: string;
}

export interface AdminOperations {
  aiPendingCount: number;
  hiraOperatingHoursPendingCount: number;
  recentJobNote: string | null;
}

export interface AdminConsolePayload {
  metrics: AdminMetric[];
  manualHospitalSubmissions: ManualHospitalSubmission[];
  clinicJoinRequests: ClinicJoinRequest[];
  licenseVerificationRequests: LicenseVerificationRequest[];
  clinics: AdminClinic[];
  users: AdminUser[];
  invites: AdminInvite[];
  reservations: AdminReservation[];
  consultations: AdminConsultation[];
  terms: AdminTermDocument[];
  operations: AdminOperations;
}

export interface AdminActionResult {
  ok: boolean;
  message: string;
}

const apiBaseUrl = () =>
  process.env.NEXT_PUBLIC_CHIKAPICK_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

export async function fetchAdminConsole(accessToken: string) {
  return adminFetch<AdminConsolePayload>("/api/v1/admin/console", accessToken);
}

export async function approveManualHospitalSubmission(
  accessToken: string,
  submissionId: string,
  note: string,
) {
  return adminFetch<AdminActionResult>(
    `/api/v1/admin/manual-hospital-submissions/${submissionId}/approve`,
    accessToken,
    { method: "POST", body: JSON.stringify({ note }) },
  );
}

export async function rejectManualHospitalSubmission(
  accessToken: string,
  submissionId: string,
  note: string,
) {
  return adminFetch<AdminActionResult>(
    `/api/v1/admin/manual-hospital-submissions/${submissionId}/reject`,
    accessToken,
    { method: "POST", body: JSON.stringify({ note }) },
  );
}

export async function updateClinicMembership(
  accessToken: string,
  clinicId: string,
  userId: string,
  status: MembershipStatus,
  role?: MembershipRole,
) {
  return adminFetch<AdminActionResult>(
    `/api/v1/admin/clinic-memberships/${clinicId}/${userId}`,
    accessToken,
    { method: "PATCH", body: JSON.stringify({ status, role }) },
  );
}

export async function updateLicenseVerification(
  accessToken: string,
  userId: string,
  licenseVerified: boolean,
  note: string,
) {
  return adminFetch<AdminActionResult>(
    `/api/v1/admin/license-verifications/${userId}`,
    accessToken,
    { method: "PATCH", body: JSON.stringify({ licenseVerified, note }) },
  );
}

export async function revokeInvite(accessToken: string, inviteId: string) {
  return adminFetch<AdminActionResult>(
    `/api/v1/admin/invites/${inviteId}/revoke`,
    accessToken,
    { method: "POST" },
  );
}

export async function inviteAdminAccount(
  accessToken: string,
  body: {
    email: string;
    fullName: string;
    role: AdminAccountRole;
    redirectTo?: string;
  },
) {
  return adminFetch<AdminActionResult>(
    "/api/v1/admin/accounts/invite",
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
}

export async function sendAdminPasswordReset(
  accessToken: string,
  userId: string,
  redirectTo?: string,
) {
  return adminFetch<AdminActionResult>(
    `/api/v1/admin/accounts/${userId}/password-reset`,
    accessToken,
    { method: "POST", body: JSON.stringify({ redirectTo }) },
  );
}

export async function unlockAdminAccount(accessToken: string, userId: string) {
  return adminFetch<AdminActionResult>(
    `/api/v1/admin/accounts/${userId}/unlock`,
    accessToken,
    { method: "POST" },
  );
}

async function adminFetch<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {}),
    },
  });
  const payload = (await response.json().catch(() => ({}))) as unknown;

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "관리자 API 요청에 실패했습니다.";
    throw new Error(
      message,
    );
  }

  return payload as T;
}
