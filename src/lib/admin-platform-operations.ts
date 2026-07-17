export interface AdminDirectoryPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface AdminDirectoryIdentity {
  id: string | null;
  name: string | null;
}

export interface AdminDirectoryUser {
  id: string | null;
  email: string | null;
  fullName: string | null;
}

export interface AdminTermVersion {
  id: string;
  version: number;
  effectiveAt: string;
  contentUrl: string;
  checksum: string | null;
  isActive: boolean;
  changeSummary: string | null;
  createdAt: string;
}

export interface AdminManagedTermDocument {
  id: string;
  code: string;
  title: string;
  isRequired: boolean;
  appliesTo: string | null;
  locale: string;
  updatedAt: string;
  activeVersion: AdminTermVersion | null;
  versions: AdminTermVersion[];
}

export interface AdminTermsManagementPayload {
  items: AdminManagedTermDocument[];
  canManage: boolean;
}

export interface AdminReservationDirectoryItem {
  id: string;
  clinic: AdminDirectoryIdentity;
  patientName: string | null;
  status: string;
  bookingSource: string;
  instantSlotId: string | null;
  scheduledAt: string | null;
  createdAt: string;
  confirmedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  additionalRequest: string | null;
  recentTreatmentNote: string | null;
}

export interface AdminConsultationDirectoryItem {
  id: string;
  clinic: AdminDirectoryIdentity;
  patientName: string | null;
  title: string;
  categoryCode: string | null;
  status: string;
  createdAt: string;
  respondedAt: string | null;
  responsePreview: string | null;
}

export interface AdminInviteDirectoryItem {
  id: string;
  clinic: AdminDirectoryIdentity;
  issuer: AdminDirectoryUser;
  role: string;
  status: string;
  issuedAt: string | null;
  expiresAt: string | null;
  redeemedAt: string | null;
  createdAt: string;
}

export interface AdminClinicMembershipRequestItem {
  clinic: AdminDirectoryIdentity;
  user: AdminDirectoryUser;
  role: string;
  status: string;
  requestedAt: string;
}

export interface AdminAuditLogItem {
  id: string;
  action: string;
  result: string;
  metadata: Record<string, unknown>;
  actor: AdminDirectoryUser;
  target: AdminDirectoryUser;
  createdAt: string;
}

export interface AdminReservationDirectoryFilters {
  query: string;
  status: string;
  bookingSource: string;
}

export interface AdminConsultationDirectoryFilters {
  query: string;
  status: string;
}

export interface AdminInviteDirectoryFilters {
  query: string;
  status: string;
  role: string;
}

export interface AdminClinicMembershipRequestFilters {
  query: string;
  role: string;
}

export interface AdminAuditLogFilters {
  action: string;
  result: string;
}

export interface AdminReservationDirectoryPayload {
  items: AdminReservationDirectoryItem[];
  pagination: AdminDirectoryPagination;
}

export interface AdminConsultationDirectoryPayload {
  items: AdminConsultationDirectoryItem[];
  pagination: AdminDirectoryPagination;
}

export interface AdminInviteDirectoryPayload {
  items: AdminInviteDirectoryItem[];
  pagination: AdminDirectoryPagination;
}

export interface AdminClinicMembershipRequestPayload {
  items: AdminClinicMembershipRequestItem[];
  pagination: AdminDirectoryPagination;
}

export interface AdminAuditLogPayload {
  items: AdminAuditLogItem[];
  pagination: AdminDirectoryPagination;
}

export const defaultAdminReservationDirectoryFilters: AdminReservationDirectoryFilters = {
  query: "",
  status: "all",
  bookingSource: "all",
};

export const defaultAdminConsultationDirectoryFilters: AdminConsultationDirectoryFilters = {
  query: "",
  status: "all",
};

export const defaultAdminInviteDirectoryFilters: AdminInviteDirectoryFilters = {
  query: "",
  status: "all",
  role: "all",
};

export const defaultAdminClinicMembershipRequestFilters: AdminClinicMembershipRequestFilters =
  {
    query: "",
    role: "all",
  };

export const defaultAdminAuditLogFilters: AdminAuditLogFilters = {
  action: "",
  result: "all",
};

export function adminDirectoryDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

export function adminMembershipRoleLabel(role: string) {
  return (
    {
      owner: "대표자",
      doctor: "치과의사",
      manager: "매니저",
      staff: "스태프",
    }[role] ?? role
  );
}

export function adminInviteStatusLabel(status: string) {
  return (
    {
      pending_owner_claim: "대표자 인증 대기",
      active: "사용 가능",
      redeemed: "사용 완료",
      revoked: "폐기",
    }[status] ?? status
  );
}

export function adminConsultationCategoryLabel(categoryCode: string | null) {
  if (!categoryCode) return "미분류";
  return (
    {
      tooth_pain: "치아 통증",
      dental_trauma: "치아 파절 / 외상",
      cavity: "충치 치료",
      cavity_treatment: "충치 치료",
      sensitive_teeth: "시린 치아",
      scaling_gum_treatment: "스케일링 / 잇몸 치료",
      wisdom_tooth_extraction: "사랑니 발치",
      root_canal: "신경 치료",
      prosthodontic: "보철 치료",
      tmj: "턱관절",
      pediatric_dentistry: "소아 치과",
      oral_checkup: "구강 검진",
      treatment_plan: "치료 계획",
      implant: "임플란트",
      orthodontics: "치아 교정",
      prosthetics: "보철",
      general: "일반 진료",
    }[categoryCode] ?? categoryCode
  );
}

export function adminAuditActionLabel(action: string) {
  return (
    {
      "terms.version.publish": "약관 버전 게시",
      "clinic_membership.update": "소속 신청 처리",
      "partner_invite.revoke": "초대코드 폐기",
      "admin.account.invite": "어드민 계정 초대",
      "admin.account.lock": "어드민 계정 잠금",
      "admin.account.unlock": "어드민 계정 잠금 해제",
      "admin.account.withdraw": "어드민 권한 회수",
    }[action] ?? action
  );
}

export function adminAuditResultLabel(result: string) {
  return result === "success" ? "성공" : result === "failure" ? "실패" : result;
}

export function adminDirectoryPersonLabel(user: AdminDirectoryUser) {
  return user.fullName ?? user.email ?? "—";
}

export function adminTermAudienceLabel(appliesTo: string | null) {
  return (
    {
      client: "치카픽",
      patient: "치카픽",
      partner: "파트너스",
      partners: "파트너스",
      all: "전체 서비스",
    }[appliesTo ?? ""] ?? appliesTo ?? "전체 서비스"
  );
}
