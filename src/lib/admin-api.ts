export type AdminReviewStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "cancelled";
export type AdminAccountRole =
  | "admin"
  | "super_admin"
  | "sales";
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

export interface AdminManualHospitalSubmissionsPayload {
  items: ManualHospitalSubmission[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
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
  clinicName: string;
  membershipRole: "owner" | "doctor";
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
  isSuperAdmin?: boolean;
  adminAccountType?: "admin" | "sales";
  adminSecurity?: {
    failedLoginCount: number;
    lockedAt: string | null;
  };
  memberships: Array<{
    clinicId: string;
    clinicName: string | null;
    role: MembershipRole;
    status: MembershipStatus;
  }>;
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
  operations: AdminOperations;
}

export interface AdminActionResult {
  ok: boolean;
  message: string;
}

export interface AdminInviteCodeReveal {
  code: string;
  clinic: {
    id: string | null;
    name: string | null;
  };
  expiresAt: string | null;
}

export interface ManualHospitalApprovalResult extends AdminActionResult {
  clinicId: string;
  invite: {
    code: string;
    role: "staff";
    expiresAt: string;
  };
}

import { adminApiBaseUrl } from "./public-env.ts";

export async function fetchAdminConsole(accessToken: string) {
  return adminFetch<AdminConsolePayload>("/api/v1/admin/console", accessToken);
}

export async function fetchAdminManualHospitalSubmissions(
  accessToken: string,
  page: number,
  pageSize = 10,
) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return adminFetch<AdminManualHospitalSubmissionsPayload>(
    `/api/v1/admin/manual-hospital-submissions?${params.toString()}`,
    accessToken,
  );
}

export async function approveManualHospitalSubmission(
  accessToken: string,
  submissionId: string,
  note: string,
) {
  return adminFetch<ManualHospitalApprovalResult>(
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

export async function revealInviteCode(accessToken: string, inviteId: string) {
  return adminFetch<AdminInviteCodeReveal>(
    `/api/v1/admin/invites/${encodeURIComponent(inviteId)}/reveal`,
    accessToken,
    { method: "POST" },
  );
}

export async function fetchAdminTerms(accessToken: string) {
  return adminFetch<AdminTermsManagementPayload>("/api/v1/admin/terms", accessToken);
}

export async function publishAdminTermVersion(
  accessToken: string,
  documentId: string,
  body: { contentUrl: string; changeSummary: string },
) {
  return adminFetch<AdminActionResult & { version?: unknown }>(
    `/api/v1/admin/terms/${encodeURIComponent(documentId)}/versions`,
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
}

export async function fetchAdminReservationDirectory(
  accessToken: string,
  filters: AdminReservationDirectoryFilters,
  page: number,
  pageSize = 10,
) {
  const params = directoryParams(filters, page, pageSize);
  return adminFetch<AdminReservationDirectoryPayload>(
    `/api/v1/admin/reservations?${params.toString()}`,
    accessToken,
  );
}

export async function fetchAdminConsultationDirectory(
  accessToken: string,
  filters: AdminConsultationDirectoryFilters,
  page: number,
  pageSize = 10,
) {
  const params = directoryParams(filters, page, pageSize);
  return adminFetch<AdminConsultationDirectoryPayload>(
    `/api/v1/admin/consultations?${params.toString()}`,
    accessToken,
  );
}

export async function fetchAdminInviteDirectory(
  accessToken: string,
  filters: AdminInviteDirectoryFilters,
  page: number,
  pageSize = 10,
) {
  const params = directoryParams(filters, page, pageSize);
  return adminFetch<AdminInviteDirectoryPayload>(
    `/api/v1/admin/invites?${params.toString()}`,
    accessToken,
  );
}

export async function fetchAdminClinicMembershipRequests(
  accessToken: string,
  filters: AdminClinicMembershipRequestFilters,
  page: number,
  pageSize = 10,
) {
  const params = directoryParams(filters, page, pageSize);
  return adminFetch<AdminClinicMembershipRequestPayload>(
    `/api/v1/admin/clinic-memberships?${params.toString()}`,
    accessToken,
  );
}

export async function fetchAdminAuditLog(
  accessToken: string,
  filters: AdminAuditLogFilters,
  page: number,
  pageSize = 20,
) {
  const params = directoryParams(filters, page, pageSize);
  return adminFetch<AdminAuditLogPayload>(
    `/api/v1/admin/audit-log?${params.toString()}`,
    accessToken,
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

export async function createAdminExternalConnector(
  accessToken: string,
  body: { affiliation: string; name: string },
) {
  return adminFetch<AdminActionResult>(
    "/api/v1/admin/external-connectors",
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
}

export async function fetchAdminExternalConnectors(
  accessToken: string,
  page: number,
  pageSize = 10,
) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return adminFetch<ExternalConnectorDirectoryPayload>(
    `/api/v1/admin/external-connectors?${params.toString()}`,
    accessToken,
  );
}

export async function fetchAdminSecretFeedback(
  accessToken: string,
  page: number,
  pageSize = 10,
) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return adminFetch<SecretFeedbackPayload>(
    `/api/v1/admin/secret-feedback?${params.toString()}`,
    accessToken,
  );
}

export async function lookupAdminChikapickAccount(
  accessToken: string,
  body: { email: string; unmask?: boolean },
) {
  return adminFetch<ChikapickAccountLookupPayload>(
    "/api/v1/admin/chikapick-accounts/lookup",
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
}

export async function searchAdminPartnerAccounts(
  accessToken: string,
  body: { query?: string; page?: number; pageSize?: number },
) {
  return adminFetch<AdminPartnerAccountsPayload>(
    "/api/v1/admin/partner-accounts/search",
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
}

export async function lookupAdminPartnerAccount(
  accessToken: string,
  body: { email: string; unmask?: boolean },
) {
  return adminFetch<AdminPartnerAccountLookupPayload>(
    "/api/v1/admin/partner-accounts/lookup",
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
}

export async function fetchAdminPartnerAccountDetail(
  accessToken: string,
  userId: string,
) {
  return adminFetch<AdminPartnerAccountDetailPayload>(
    `/api/v1/admin/partner-accounts/${encodeURIComponent(userId)}`,
    accessToken,
  );
}

export async function deleteAdminExternalConnector(
  accessToken: string,
  connectorId: string,
) {
  return adminFetch<AdminActionResult>(
    `/api/v1/admin/external-connectors/${encodeURIComponent(connectorId)}`,
    accessToken,
    { method: "DELETE" },
  );
}

export async function fetchAdminMembershipManagement(
  accessToken: string,
  filters: AdminMembershipFilters,
  page: number,
  pageSize = 6,
) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    sort: filters.sort,
  });
  if (filters.category !== "all") params.set("category", filters.category);
  const search = filters.query.trim();
  if (search) params.set("search", search);
  return adminFetch<AdminMembershipManagementPayload>(
    `/api/v1/admin/memberships?${params.toString()}`,
    accessToken,
  );
}

export async function createAdminMembershipPartner(
  accessToken: string,
  input: AdminMembershipCreateInput,
) {
  const body = new FormData();
  body.set("name", input.name);
  body.set("category", input.category);
  body.set("recommendedOrder", String(input.recommendedOrder));
  body.set("description", input.description);
  body.set("isPreferred", String(input.isPreferred));
  body.set("isVisible", String(input.isVisible));
  body.set("detailTitle", input.detailTitle);
  body.set("detailDescription", input.detailDescription);
  body.set("inquiryButtonLabel", input.inquiryButtonLabel);
  body.set("inquiryMethod", input.inquiryMethod);
  body.set("inquiryValue", input.inquiryValue);
  body.set("intro", input.intro);
  body.set("serviceTags", JSON.stringify(input.serviceTags));
  body.set("strengths", JSON.stringify(input.strengths));
  body.set("benefitItems", JSON.stringify(input.benefitItems));
  body.set("contentType", input.contentType);
  body.set("richContent", input.richContent);
  body.set(
    "richContentImageTokens",
    JSON.stringify(input.richContentImages.map((image) => image.token)),
  );
  input.richContentImages.forEach((image) =>
    body.append("richContentImages", image.file),
  );
  body.set("attachmentLabel", input.attachmentLabel);
  if (input.cardImage) body.set("cardImage", input.cardImage);
  if (input.detailImage) body.set("detailImage", input.detailImage);
  if (input.attachmentFile) body.set("attachmentFile", input.attachmentFile);
  return adminFetch<AdminActionResult>("/api/v1/admin/memberships", accessToken, {
    method: "POST",
    body,
  });
}

export async function updateAdminMembershipPartner(
  accessToken: string,
  partnerId: string,
  body: Partial<{
    category: MembershipCategory;
    isVisible: boolean;
    name: string;
    recommendedOrder: number;
  }>,
) {
  return adminFetch<AdminActionResult>(
    `/api/v1/admin/memberships/${encodeURIComponent(partnerId)}`,
    accessToken,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export async function deleteAdminMembershipPartner(
  accessToken: string,
  partnerId: string,
) {
  return adminFetch<AdminActionResult>(
    `/api/v1/admin/memberships/${encodeURIComponent(partnerId)}`,
    accessToken,
    { method: "DELETE" },
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

export async function lockAdminAccount(accessToken: string, userId: string) {
  return adminFetch<AdminActionResult>(
    `/api/v1/admin/accounts/${userId}/lock`,
    accessToken,
    { method: "POST" },
  );
}

export async function withdrawAdminAccount(accessToken: string, userId: string) {
  return adminFetch<AdminActionResult>(
    `/api/v1/admin/accounts/${userId}`,
    accessToken,
    { method: "DELETE" },
  );
}

export async function fetchAdminAccountDirectory(
  accessToken: string,
  filters: AdminAccountDirectoryFilters,
  page: number,
  pageSize = 10,
) {
  const params = new URLSearchParams({
    role: filters.role,
    page: String(page),
    pageSize: String(pageSize),
  });
  const query = filters.query.trim();
  if (query) params.set("query", query);
  return adminFetch<AdminAccountDirectoryPayload>(
    `/api/v1/admin/accounts?${params.toString()}`,
    accessToken,
  );
}

export async function fetchAdminDentalSales(
  accessToken: string,
  filters: DentalSalesFilters,
  page: number,
  pageSize = 20,
) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  for (const [key, value] of Object.entries(filters)) {
    const clean = value.trim();
    if (clean) params.set(key, clean);
  }
  return adminFetch<DentalSalesListPayload>(
    `/api/v1/admin/dental-sales?${params.toString()}`,
    accessToken,
  );
}

export async function fetchAdminSalesPerformance(
  accessToken: string,
  filters: SalesPerformanceFilters,
  page: number,
  pageSize = 10,
) {
  const params = new URLSearchParams({
    month: filters.month,
    detailStatus: filters.detailStatus,
    page: String(page),
    pageSize: String(pageSize),
  });
  if (filters.salespersonId.trim()) {
    params.set("salespersonId", filters.salespersonId.trim());
  }
  if (filters.externalConnectorId.trim()) {
    params.set("externalConnectorId", filters.externalConnectorId.trim());
  }
  return adminFetch<SalesPerformancePayload>(
    `/api/v1/admin/sales-performance?${params.toString()}`,
    accessToken,
  );
}

export async function fetchAdminDentalSalesDetail(
  accessToken: string,
  profileId: string,
  visitPage = 1,
) {
  return adminFetch<DentalSalesDetailPayload>(
    `/api/v1/admin/dental-sales/${encodeURIComponent(profileId)}?visitPage=${visitPage}`,
    accessToken,
  );
}

export async function assignAdminDentalSalesperson(
  accessToken: string,
  profileId: string,
  assignedSalespersonUserId: string | null,
  externalConnectorId: string | null,
) {
  return adminFetch<AdminActionResult>(
    `/api/v1/admin/dental-sales/${encodeURIComponent(profileId)}`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify({ assignedSalespersonUserId, externalConnectorId }),
    },
  );
}

export async function createAdminDentalSalesVisit(
  accessToken: string,
  profileId: string,
  body: {
    visitedAt: string;
    salespersonUserId: string;
    detailStatus: DentalSalesVisitDetailStatus;
    note?: string;
    attachments?: File[];
  },
) {
  const formData = new FormData();
  formData.set("visitedAt", body.visitedAt);
  formData.set("salespersonUserId", body.salespersonUserId);
  formData.set("detailStatus", body.detailStatus);
  if (body.note) formData.set("note", body.note);
  body.attachments?.forEach((file) => formData.append("attachmentFiles", file));
  return adminFetch<AdminActionResult>(
    `/api/v1/admin/dental-sales/${encodeURIComponent(profileId)}/visits`,
    accessToken,
    { method: "POST", body: formData },
  );
}

export async function uploadAdminDentalSalesBusinessLicense(
  accessToken: string,
  profileId: string,
  file: File,
) {
  const body = new FormData();
  body.set("businessLicenseFile", file);
  return adminFetch<AdminActionResult>(
    `/api/v1/admin/dental-sales/${encodeURIComponent(profileId)}/business-license`,
    accessToken,
    { method: "POST", body },
  );
}

export async function fetchAdminPartnerClinics(
  accessToken: string,
  query: string,
  page: number,
  pageSize = 10,
) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  const cleanQuery = query.trim();
  if (cleanQuery) params.set("query", cleanQuery);
  return adminFetch<AdminPartnerClinicsPayload>(
    `/api/v1/admin/partner-clinics?${params.toString()}`,
    accessToken,
  );
}

export async function fetchAdminPartnerClinicDetail(
  accessToken: string,
  clinicId: string,
) {
  return adminFetch<AdminPartnerClinicDetailPayload>(
    `/api/v1/admin/partner-clinics/${encodeURIComponent(clinicId)}`,
    accessToken,
  );
}

export async function assignAdminPartnerClinicOperator(
  accessToken: string,
  clinicId: string,
  assignedOperatorUserId: string | null,
) {
  return adminFetch<AdminActionResult>(
    `/api/v1/admin/partner-clinics/${encodeURIComponent(clinicId)}/operations`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify({ assignedOperatorUserId }),
    },
  );
}

export async function createAdminPartnerClinicOperationEvent(
  accessToken: string,
  clinicId: string,
  body: {
    type: "operation_memo" | "support_history";
    content: string;
    occurredAt: string;
    resolvedAt?: string | null;
    resolvedByAdminUserId?: string | null;
  },
) {
  return adminFetch<AdminActionResult>(
    `/api/v1/admin/partner-clinics/${encodeURIComponent(clinicId)}/operation-events`,
    accessToken,
    { method: "POST", body: JSON.stringify(body) },
  );
}

export async function bulkUpdateAdminMembershipPartners(
  accessToken: string,
  partnerIds: string[],
  action: "show" | "hide" | "delete",
) {
  return adminFetch<AdminActionResult>(
    "/api/v1/admin/memberships/bulk-action",
    accessToken,
    { method: "POST", body: JSON.stringify({ action, partnerIds }) },
  );
}

export class AdminApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly requestId: string | null;

  constructor(
    message: string,
    status: number,
    code: string | null,
    requestId: string | null,
  ) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export function isAdminApiNotFound(error: unknown) {
  return error instanceof AdminApiError && error.status === 404;
}

function directoryParams(
  filters: object,
  page: number,
  pageSize: number,
) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  for (const [key, value] of Object.entries(filters as Record<string, string>)) {
    const clean = value.trim();
    if (clean && clean !== "all") params.set(key, clean);
  }
  return params;
}

async function adminFetch<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = {
    ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    Authorization: `Bearer ${accessToken}`,
    ...Object.fromEntries(new Headers(init.headers).entries()),
  };
  const response = await fetch(`${adminApiBaseUrl()}${path}`, {
    ...init,
    headers,
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
    const code =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : null;
    const requestId =
      typeof payload === "object" &&
      payload !== null &&
      "requestId" in payload &&
      typeof payload.requestId === "string"
        ? payload.requestId
        : null;
    throw new AdminApiError(
      requestId ? `${message} (요청 ID: ${requestId})` : message,
      response.status,
      code,
      requestId,
    );
  }

  return payload as T;
}
import type {
  AdminAccountDirectoryFilters,
  AdminAccountDirectoryPayload,
} from "./admin-accounts";
import type { ExternalConnectorDirectoryPayload } from "./external-connectors";
import type { SecretFeedbackPayload } from "./secret-feedback";
import type { ChikapickAccountLookupPayload } from "./chikapick-accounts";
import type {
  AdminPartnerAccountDetailPayload,
  AdminPartnerAccountLookupPayload,
  AdminPartnerAccountsPayload,
} from "./partner-accounts";
import type {
  DentalSalesDetailPayload,
  DentalSalesFilters,
  DentalSalesListPayload,
  DentalSalesVisitDetailStatus,
} from "./dental-sales";
import type {
  AdminPartnerClinicDetailPayload,
  AdminPartnerClinicsPayload,
} from "./partner-clinics";
import type {
  SalesPerformanceFilters,
  SalesPerformancePayload,
} from "./sales-performance";
import type {
  AdminMembershipCreateInput,
  AdminMembershipFilters,
  AdminMembershipManagementPayload,
  MembershipCategory,
} from "./membership-management";
import type {
  AdminAuditLogFilters,
  AdminAuditLogPayload,
  AdminClinicMembershipRequestFilters,
  AdminClinicMembershipRequestPayload,
  AdminConsultationDirectoryFilters,
  AdminConsultationDirectoryPayload,
  AdminInviteDirectoryFilters,
  AdminInviteDirectoryPayload,
  AdminReservationDirectoryFilters,
  AdminReservationDirectoryPayload,
  AdminTermsManagementPayload,
} from "./admin-platform-operations";
