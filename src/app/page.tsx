"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import {
  approveManualHospitalSubmission,
  assignAdminDentalSalesperson,
  assignAdminPartnerClinicOperator,
  bulkUpdateAdminMembershipPartners,
  createAdminMembershipPartner,
  createAdminPartnerClinicOperationEvent,
  createAdminExternalConnector,
  createAdminDentalSalesVisit,
  deleteAdminMembershipPartner,
  deleteAdminExternalConnector,
  fetchAdminAccountDirectory,
  fetchAdminAuditLog,
  fetchAdminClinicMembershipRequests,
  fetchAdminConsultationDirectory,
  fetchAdminConsole,
  fetchAdminDentalSales,
  fetchAdminDentalSalesDetail,
  fetchAdminExternalConnectors,
  fetchAdminInviteDirectory,
  fetchAdminManualHospitalSubmissions,
  fetchAdminMembershipManagement,
  fetchAdminPartnerClinicDetail,
  fetchAdminPartnerClinics,
  fetchAdminPartnerAccountDetail,
  fetchAdminReservationDirectory,
  fetchAdminSalesPerformance,
  fetchAdminSecretFeedback,
  fetchAdminTerms,
  inviteAdminAccount,
  isAdminApiNotFound,
  lockAdminAccount,
  lookupAdminChikapickAccount,
  lookupAdminPartnerAccount,
  publishAdminTermVersion,
  rejectManualHospitalSubmission,
  revokeInvite,
  sendAdminPasswordReset,
  searchAdminPartnerAccounts,
  unlockAdminAccount,
  updateAdminMembershipPartner,
  withdrawAdminAccount,
  updateClinicMembership,
  updateLicenseVerification,
  uploadAdminDentalSalesBusinessLicense,
  type AdminAccountRole,
  type AdminConsolePayload,
  type AdminManualHospitalSubmissionsPayload,
  type ManualHospitalSubmission,
} from "@/lib/admin-api";
import {
  adminAccountDirectoryRoleLabel,
  adminAccountDirectoryStatusLabel,
  adminInviteDisplayName,
  defaultAdminAccountDirectoryFilters,
  formatAdminAccountDirectoryDate,
  type AdminAccountDirectoryFilters,
  type AdminAccountDirectoryPayload,
  type AdminAccountDirectoryRole,
} from "@/lib/admin-accounts";
import { shouldAutoLoadAdminConsole } from "@/lib/admin-auth-session";
import {
  adminDetailFromHistoryState,
  pushAdminDetailHistory,
  replaceAdminDetailHistory,
  requestAdminDetailBack,
  type AdminDetailHistorySelection,
} from "@/lib/admin-detail-history";
import {
  reservationSourceLabel,
  statusLabel,
} from "@/lib/admin-display";
import {
  adminAuditActionLabel,
  adminAuditResultLabel,
  adminConsultationCategoryLabel,
  adminDirectoryDateTime,
  adminDirectoryPersonLabel,
  adminInviteStatusLabel,
  adminMembershipRoleLabel,
  adminTermAudienceLabel,
  defaultAdminAuditLogFilters,
  defaultAdminClinicMembershipRequestFilters,
  defaultAdminConsultationDirectoryFilters,
  defaultAdminInviteDirectoryFilters,
  defaultAdminReservationDirectoryFilters,
  type AdminAuditLogFilters,
  type AdminAuditLogPayload,
  type AdminClinicMembershipRequestFilters,
  type AdminClinicMembershipRequestPayload,
  type AdminConsultationDirectoryFilters,
  type AdminConsultationDirectoryPayload,
  type AdminDirectoryPagination,
  type AdminInviteDirectoryFilters,
  type AdminInviteDirectoryPayload,
  type AdminManagedTermDocument,
  type AdminReservationDirectoryFilters,
  type AdminReservationDirectoryPayload,
  type AdminTermsManagementPayload,
} from "@/lib/admin-platform-operations";
import { shouldExpireAdminIdleSession } from "@/lib/admin-idle";
import {
  registerCurrentAdminBrowserSession,
  startAdminSessionHeartbeat,
} from "@/lib/browser-session";
import {
  chikapickAccountStatusLabel,
  chikapickAccountStatusTone,
  chikapickCountryLabel,
  chikapickLoginProviderLabel,
  formatChikapickAccountDate,
  type ChikapickAccountLookupPayload,
} from "@/lib/chikapick-accounts";
import {
  formatPartnerAccountDate,
  partnerAccountClassificationLabel,
  partnerAccountCountryLabel,
  partnerAccountLoginProviderLabel,
  partnerAccountMembershipStatusLabel,
  partnerAccountStatusLabel,
  type AdminPartnerAccountDetail,
  type AdminPartnerAccountLookupPayload,
  type AdminPartnerAccountsPayload,
} from "@/lib/partner-accounts";
import {
  dentalSalesDetailLabel,
  dentalSalesBusinessFileError,
  dentalSalesDetailOptions,
  dentalSalesCompletionViewState,
  dentalSalesHospitalInformationCards,
  dentalSalesHospitalInformationReviewState,
  dentalSalesPageNumbers,
  dentalSalesRegionLabel,
  dentalSalesStatusLabel,
  dentalSalesStatusOptions,
  dentalSalesVisitNote,
  dentalSalesVisitPresentation,
  emptyDentalSalesFilters,
  isDentalSalesVisitDetailStatus,
  type DentalSalesDetailPayload,
  type DentalSalesFilters,
  type DentalSalesHospitalInformation,
  type DentalSalesListPayload,
  type DentalSalesVisitDetailStatus,
} from "@/lib/dental-sales";
import {
  manualHospitalRequestAccount,
  manualHospitalReviewDate,
  manualHospitalReviewStatusLabel,
  normalizeManualHospitalRejectionReason,
} from "@/lib/manual-hospital-review";
import {
  defaultAdminMembershipFilters,
  formatMembershipDate,
  membershipCategories,
  membershipAssetError,
  membershipCategoryLabel,
  membershipPageNumbers,
  membershipSortLabel,
  validateMembershipRegistration,
  type AdminMembershipCreateInput,
  type AdminMembershipFilters,
  type AdminMembershipManagementPayload,
  type AdminMembershipPartner,
  type MembershipCategory,
  type MembershipContentType,
  type MembershipInquiryMethod,
} from "@/lib/membership-management";
import {
  formatExternalConnectorDate,
  type ExternalConnectorDirectoryPayload,
} from "@/lib/external-connectors";
import {
  formatSecretFeedbackDate,
  secretFeedbackImpressionTags,
  secretFeedbackRatingLabel,
  secretFeedbackRatings,
  type SecretFeedbackItem,
  type SecretFeedbackPayload,
} from "@/lib/secret-feedback";
import {
  partnerClinicActivityLabel,
  partnerClinicDateLabel,
  partnerClinicDurationLabel,
  partnerClinicRatingLabel,
  partnerClinicRegistrationLabel,
  partnerClinicResponseRate,
  type AdminPartnerClinicDetailPayload,
  type AdminPartnerClinicsPayload,
} from "@/lib/partner-clinics";
import {
  canAccessSalesPerformance,
  defaultSalesPerformanceFilters,
  formatSalesPerformanceDate,
  salesPerformanceDetailLabel,
  salesPerformanceMonthOptions,
  type SalesPerformanceFilters,
  type SalesPerformancePayload,
} from "@/lib/sales-performance";
import {
  licenseMembershipRoleLabel,
  licenseRequestTimeLabel,
  normalizeLicenseRejectionReason,
  pendingLicenseVerificationRequests,
  summarizeLicenseVerifications,
} from "@/lib/license-verifications";
import { signInWithAdminPassword } from "@/lib/password-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const primaryTabs = [
  { id: "dashboard", label: "운영 현황", icon: "/Type=Dashboard.svg" },
  { id: "dental-sales", label: "치과 영업 관리", icon: "/Type=Graph.svg" },
  { id: "partner-clinics", label: "파트너 치과 관리", icon: "/Type=Hospital.svg" },
  { id: "hospital-review", label: "병원 가입 심사", icon: "/Type=Accept.svg" },
  { id: "license-review", label: "치과의사 면허 인증", icon: "/Type=Accept.svg" },
  { id: "clinic-membership-requests", label: "소속 신청 관리", icon: "/Type=Staff.svg" },
  { id: "reservations", label: "예약 운영 관리", icon: "/Type=Diary.svg" },
  { id: "consultations", label: "전문의 소견 운영", icon: "/Type=Response.svg" },
  { id: "secret-feedback", label: "시크릿 피드백", icon: "/Type=Opinion.svg" },
  { id: "chikapick-accounts", label: "치카픽 계정 조회", icon: "/Type=Family.svg" },
  { id: "partner-accounts", label: "파트너스 계정 조회", icon: "/Type=Family.svg" },
  { id: "partner-invites", label: "파트너 초대코드 관리", icon: "/Type=Settings.svg" },
  { id: "memberships", label: "멤버십 관리", icon: "/Type=Ticket.svg" },
  { id: "terms-management", label: "약관 관리", icon: "/Type=Diary.svg" },
  { id: "sales-performance", label: "영업 성과 관리", icon: "/Type=Price.svg" },
  { id: "admin-accounts", label: "어드민 계정 관리", icon: "/Type=Mypage.svg" },
  { id: "external-connectors", label: "외부 연결자 관리", icon: "/Type=Share.svg" },
  { id: "audit-log", label: "감사 로그", icon: "/Type=Log.svg" },
] as const;

type PrimaryAdminTab = (typeof primaryTabs)[number]["id"];
type AdminContentLayout = "fluid" | "compact" | "form";

const primaryTabContentLayouts: Record<PrimaryAdminTab, AdminContentLayout> = {
  dashboard: "fluid",
  "dental-sales": "fluid",
  "partner-clinics": "fluid",
  "hospital-review": "fluid",
  "license-review": "fluid",
  "clinic-membership-requests": "fluid",
  reservations: "fluid",
  consultations: "fluid",
  "secret-feedback": "compact",
  "chikapick-accounts": "fluid",
  "partner-accounts": "fluid",
  "partner-invites": "fluid",
  memberships: "fluid",
  "terms-management": "fluid",
  "sales-performance": "fluid",
  "admin-accounts": "fluid",
  "external-connectors": "fluid",
  "audit-log": "fluid",
};

const primaryTabDescriptions: Record<PrimaryAdminTab, string> = {
  dashboard: "치카픽의 주요 운영 지표를 확인하고 각 관리 메뉴로 바로 이동할 수 있습니다.",
  "dental-sales":
    "전국 치과를 지역별로 조회하고 초대 코드를 확인 할 수 있으며 영업 현황을 관리합니다.",
  "partner-clinics":
    "가입 완료한 파트너 치과의 운영 상태를 모니터링하고 필요한 지원을 빠르게 진행할 수 있습니다.",
  "hospital-review": "직접 입력한 병원 정보와 사업자등록증 제출 건을 검토합니다.",
  "license-review":
    "제출된 치과의사 면허증의 식별 가능 여부와 성명, 면허번호, 보건복지부 발급 여부를 확인한 후 승인 또는 반려해 주세요.",
  "clinic-membership-requests":
    "치카픽 파트너스 사용자의 치과 소속 신청을 병원 구분 없이 검토하고 처리합니다.",
  reservations:
    "치카픽에서 접수된 일반 예약과 즉시 예약의 처리 상태를 전체 치과 기준으로 조회합니다.",
  consultations:
    "전문의 소견 요청과 답변 상태를 전체 치과 기준으로 조회합니다.",
  "secret-feedback": "어드민 관리자에게만 전송되는 시크릿 피드백 입니다.",
  "chikapick-accounts":
    "치카픽 서비스에 가입한 환자 계정을 이메일로 조회하고 계정 상태를 확인합니다.",
  "partner-accounts":
    "치카픽 파트너스에 가입한 계정을 이메일로 조회하고 소속 정보를 확인합니다.",
  "partner-invites":
    "파트너 치과가 발급한 초대코드의 상태와 사용 이력을 조회하고 필요한 코드를 폐기합니다.",
  memberships: "치카픽 멤버십 탭에 노출될 제휴 업체를 등록합니다.",
  "terms-management":
    "치카픽과 파트너스에 적용되는 약관 버전을 조회하고 새 버전을 게시합니다.",
  "sales-performance": "월 기준으로 영업 성과를 확인할 수 있습니다.",
  "admin-accounts":
    "치카픽 어드민 계정을 생성하고 초대하며, 권한 및 계정 정보를 관리할 수 있습니다.",
  "external-connectors":
    "외부 연결자 정보를 등록하면 치과 및 영업 관련 담당자 정보에서 활용하게 됩니다.",
  "audit-log": "어드민의 주요 변경 작업과 처리 결과를 시간순으로 확인합니다.",
};

const emptyConsole: AdminConsolePayload = {
  metrics: [
    { label: "수동 병원 심사 대기", value: 0, tone: "orange" },
    { label: "소속 승인 대기", value: 0, tone: "blue" },
    { label: "면허 미승인", value: 0, tone: "red" },
    { label: "활성 파트너 병원", value: 0, tone: "green" },
  ],
  manualHospitalSubmissions: [],
  clinicJoinRequests: [],
  licenseVerificationRequests: [],
  clinics: [],
  users: [],
  operations: {
    aiPendingCount: 0,
    hiraOperatingHoursPendingCount: 0,
    recentJobNote: null,
  },
};

export default function AdminHome() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activePrimaryTab, setActivePrimaryTab] =
    useState<PrimaryAdminTab>("dashboard");
  const [selectedDentalSalesProfileId, setSelectedDentalSalesProfileId] = useState<
    string | null
  >(null);
  const [selectedPartnerClinicId, setSelectedPartnerClinicId] = useState<string | null>(
    null,
  );
  const [consoleData, setConsoleData] = useState<AdminConsolePayload>(emptyConsole);
  const [isLoadingConsole, setIsLoadingConsole] = useState(false);
  const [hasLoadedConsole, setHasLoadedConsole] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [message, setMessage] = useState("");
  const [adminAccountDialog, setAdminAccountDialog] = useState<"invite" | null>(null);
  const [isPartnerAccountSearchView, setIsPartnerAccountSearchView] = useState(false);
  const [isMembershipRegistrationView, setIsMembershipRegistrationView] =
    useState(false);

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const lastAutoLoadedAccessTokenRef = useRef<string | null>(null);
  const lastActivityAtRef = useRef(0);
  const isDentalSalesDetailView =
    activePrimaryTab === "dental-sales" && selectedDentalSalesProfileId !== null;
  const isPartnerClinicDetailView =
    activePrimaryTab === "partner-clinics" && selectedPartnerClinicId !== null;
  const isAdminDetailView = isDentalSalesDetailView || isPartnerClinicDetailView;
  const isSuperAdmin = canAccessSalesPerformance(
    consoleData.users,
    session?.user.id,
  );
  const visiblePrimaryTabs = primaryTabs.filter(
    (tab) => tab.id !== "sales-performance" || isSuperAdmin,
  );
  const adminContentLayout: AdminContentLayout = isMembershipRegistrationView
    ? "form"
    : primaryTabContentLayouts[activePrimaryTab];

  const applyDetailSelection = useCallback(
    (selection: AdminDetailHistorySelection | null) => {
      if (selection?.tab === "dental-sales") {
        setActivePrimaryTab("dental-sales");
        setSelectedDentalSalesProfileId(selection.id);
        setSelectedPartnerClinicId(null);
      } else if (selection?.tab === "partner-clinics") {
        setActivePrimaryTab("partner-clinics");
        setSelectedPartnerClinicId(selection.id);
        setSelectedDentalSalesProfileId(null);
      } else {
        setSelectedDentalSalesProfileId(null);
        setSelectedPartnerClinicId(null);
      }
    },
    [],
  );

  const openAdminDetail = useCallback(
    (selection: AdminDetailHistorySelection) => {
      pushAdminDetailHistory(window.history, window.location.href, selection);
      applyDetailSelection(selection);
    },
    [applyDetailSelection],
  );

  const closeAdminDetail = useCallback(
    (tab: AdminDetailHistorySelection["tab"]) => {
      if (!requestAdminDetailBack(window.history, tab)) {
        applyDetailSelection(null);
      }
    },
    [applyDetailSelection],
  );

  const clearAdminDetail = useCallback(() => {
    replaceAdminDetailHistory(window.history, window.location.href, null);
    applyDetailSelection(null);
  }, [applyDetailSelection]);

  const navigateToPrimaryTab = useCallback(
    (tab: PrimaryAdminTab) => {
      clearAdminDetail();
      setIsPartnerAccountSearchView(false);
      setIsMembershipRegistrationView(false);
      setActivePrimaryTab(tab);
    },
    [clearAdminDetail],
  );

  const loadConsole = useCallback(
    async (currentSession: Session | null) => {
      if (!currentSession?.access_token) return;
      setIsLoadingConsole(true);
      setMessage("");
      try {
        await registerCurrentAdminBrowserSession(supabase);
        const payload = await fetchAdminConsole(currentSession.access_token);
        setConsoleData(payload);
        setHasLoadedConsole(true);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "관리자 데이터를 불러오지 못했습니다.",
        );
      } finally {
        setIsLoadingConsole(false);
      }
    },
    [supabase],
  );

  const autoLoadConsole = useCallback(
    (nextSession: Session | null) => {
      if (!shouldAutoLoadAdminConsole(lastAutoLoadedAccessTokenRef.current, nextSession)) {
        return;
      }

      lastAutoLoadedAccessTokenRef.current = nextSession?.access_token ?? null;
      void loadConsole(nextSession);
    },
    [loadConsole],
  );

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setIsAuthLoading(false);
      autoLoadConsole(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        autoLoadConsole(nextSession);
      } else {
        lastAutoLoadedAccessTokenRef.current = null;
        setConsoleData(emptyConsole);
        setHasLoadedConsole(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [autoLoadConsole, supabase]);

  useEffect(() => {
    if (!session) return;

    return startAdminSessionHeartbeat({
      supabase,
      onSessionInvalidated: async () => {
        await supabase.auth.signOut();
        lastAutoLoadedAccessTokenRef.current = null;
        setSession(null);
        setConsoleData(emptyConsole);
        setHasLoadedConsole(false);
        setMessage("세션이 만료되어 다시 로그인해 주세요.");
      },
    });
  }, [session, supabase]);

  useEffect(() => {
    const syncFromHistory = () => {
      applyDetailSelection(adminDetailFromHistoryState(window.history.state));
    };
    syncFromHistory();
    window.addEventListener("popstate", syncFromHistory);
    return () => window.removeEventListener("popstate", syncFromHistory);
  }, [applyDetailSelection]);

  useEffect(() => {
    if (!session) return;

    const markActivity = () => {
      lastActivityAtRef.current = Date.now();
    };
    const checkIdle = () => {
      if (
        shouldExpireAdminIdleSession({
          lastActivityAt: lastActivityAtRef.current,
          now: Date.now(),
        })
      ) {
        void supabase.auth.signOut().then(() => {
          lastAutoLoadedAccessTokenRef.current = null;
          setSession(null);
          setConsoleData(emptyConsole);
          setHasLoadedConsole(false);
          setMessage("1시간 동안 활동이 없어 자동 로그아웃되었습니다.");
        });
      }
    };

    markActivity();
    window.addEventListener("click", markActivity);
    window.addEventListener("keydown", markActivity);
    window.addEventListener("pointermove", markActivity);
    window.addEventListener("scroll", markActivity, { passive: true });
    const intervalId = window.setInterval(checkIdle, 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("click", markActivity);
      window.removeEventListener("keydown", markActivity);
      window.removeEventListener("pointermove", markActivity);
      window.removeEventListener("scroll", markActivity);
    };
  }, [session, supabase]);

  async function handlePasswordSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setIsSigningIn(true);

    try {
      await signInWithAdminPassword(supabase, {
        email: loginEmail,
        password: loginPassword,
      });
      setLoginPassword("");
      setIsPasswordVisible(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    } finally {
      setIsSigningIn(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    lastAutoLoadedAccessTokenRef.current = null;
    setSession(null);
  }

  async function runAction(action: (accessToken: string) => Promise<unknown>) {
    if (!session?.access_token) return false;
    setMessage("");
    try {
      await action(session.access_token);
      setMessage("처리되었습니다.");
      await loadConsole(session);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "처리에 실패했습니다.");
      return false;
    }
  }

  function adminResetRedirectUrl() {
    return typeof window === "undefined" ? undefined : window.location.origin;
  }

  if (isAuthLoading) {
    return (
      <main className="admin-entry">
        <div className="admin-loading">관리자 세션을 확인하고 있습니다.</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="admin-login">
        {message ? (
          <div className="admin-login-toast" role="alert" aria-atomic="true">
            <span className="admin-login-toast-icon" aria-hidden="true">
              <Image src="/Type=Error.svg" alt="" width={20} height={20} />
            </span>
            <p>{message}</p>
          </div>
        ) : null}
        <div className="admin-login-brand" aria-label="치카픽 어드민">
          <span className="admin-login-brand-symbol">
            <Image
              src="/chikapick_logo.png"
              alt=""
              fill
              sizes="45px"
              priority
            />
          </span>
          <span className="admin-login-brand-text">
            <Image
              src="/chikapick_logo_text.svg"
              alt=""
              fill
              sizes="101px"
              priority
            />
          </span>
          <span className="admin-login-brand-label">어드민</span>
        </div>
        <section className="admin-login-card" aria-labelledby="admin-login-title">
          <h1 id="admin-login-title">치과하면 치카픽, 오늘도 함께 힘내요!</h1>
          <form className="admin-login-form" onSubmit={handlePasswordSignIn}>
            <label>
              <span>이메일</span>
              <input
                autoComplete="username"
                inputMode="email"
                name="email"
                placeholder="your@email.com"
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
            </label>
            <label>
              <span>비밀번호</span>
              <span className="admin-password-field">
                <input
                  autoComplete="current-password"
                  name="password"
                  placeholder="비밀번호"
                  type={isPasswordVisible ? "text" : "password"}
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                />
                <button
                  className="admin-password-toggle"
                  type="button"
                  aria-label={isPasswordVisible ? "비밀번호 숨기기" : "비밀번호 표시"}
                  aria-pressed={isPasswordVisible}
                  onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
                >
                  <span
                    className="admin-password-toggle-icon"
                    aria-hidden="true"
                    style={maskIcon(
                      isPasswordVisible ? "/Type=Visible.svg" : "/Type=Invisible.svg",
                    )}
                  />
                </button>
              </span>
            </label>
            <button className="admin-login-submit" type="submit" disabled={isSigningIn}>
              {isSigningIn ? "로그인 중" : "로그인"}
            </button>
          </form>
          <p className="admin-login-help">
            계정 발급 및 비밀번호 재설정은 회사 대표에게 요청해 주세요.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar" aria-label="관리자 메뉴">
        <div className="admin-sidebar-brand">
          <span className="admin-sidebar-brand-symbol">
            <Image
              src="/chikapick_logo.png"
              alt=""
              fill
              sizes="28px"
              priority
            />
          </span>
          <span className="admin-sidebar-brand-text" aria-label="치카픽">
            <Image
              src="/chikapick_logo_text_light.svg"
              alt=""
              fill
              sizes="54px"
              priority
            />
          </span>
          <span>어드민</span>
        </div>
        <nav className="admin-navigation">
          <div className="admin-navigation-primary">
            {visiblePrimaryTabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                className={activePrimaryTab === tab.id ? "admin-nav-active" : undefined}
                aria-current={activePrimaryTab === tab.id ? "page" : undefined}
                onClick={() => navigateToPrimaryTab(tab.id)}
              >
                <span className="admin-nav-icon" style={maskIcon(tab.icon)} />
                <span className="admin-nav-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </aside>

      <section className="admin-main">
        <header
          className={`admin-topbar${isAdminDetailView ? " admin-topbar--detail" : ""}`}
        >
          {isAdminDetailView ? (
            <nav className="admin-detail-breadcrumb" aria-label="현재 위치">
              <button
                type="button"
                onClick={() =>
                  closeAdminDetail(
                    isDentalSalesDetailView ? "dental-sales" : "partner-clinics",
                  )
                }
              >
                {isDentalSalesDetailView ? "치과 영업 관리" : "파트너 치과 관리"}
              </button>
              <span aria-hidden="true">›</span>
              <strong>상세보기</strong>
            </nav>
          ) : null}
          <div className="admin-topbar-tools">
            <button type="button" aria-label="검색 (준비 중)" title="준비 중" disabled>
              <Image src="/Type=Search.svg" alt="" width={24} height={24} />
            </button>
            <span className="admin-topbar-divider" aria-hidden="true" />
            <button type="button" aria-label="알림 (준비 중)" title="준비 중" disabled>
              <Image src="/Type=Notification.svg" alt="" width={24} height={24} />
            </button>
            <button type="button" aria-label="도움말 (준비 중)" title="준비 중" disabled>
              <Image src="/Type=Question.svg" alt="" width={24} height={24} />
            </button>
          </div>
        </header>

        {!isAdminDetailView && !isMembershipRegistrationView ? (
          <div
            className={`admin-workspace-heading${
              activePrimaryTab === "dental-sales" ||
              activePrimaryTab === "partner-clinics" ||
              activePrimaryTab === "sales-performance" ||
              activePrimaryTab === "hospital-review" ||
              activePrimaryTab === "license-review" ||
              activePrimaryTab === "secret-feedback" ||
              activePrimaryTab === "chikapick-accounts" ||
              activePrimaryTab === "partner-accounts" ||
              activePrimaryTab === "memberships" ||
              activePrimaryTab === "external-connectors"
                ? " admin-workspace-heading--sales"
                : ""
            }${
              activePrimaryTab === "chikapick-accounts"
                ? " admin-workspace-heading--chikapick-accounts"
                : ""
            }${
              activePrimaryTab === "secret-feedback"
                ? " admin-workspace-heading--secret-feedback"
                : ""
            }${
              activePrimaryTab === "partner-accounts"
                ? " admin-workspace-heading--partner-accounts"
                : ""
            }${
              activePrimaryTab === "partner-accounts" && isPartnerAccountSearchView
                ? " admin-workspace-heading--partner-account-search"
                : ""
            }`}
          >
            <div>
              <div className="admin-workspace-title-row">
                <h1>
                  {activePrimaryTab === "partner-accounts"
                    ? isPartnerAccountSearchView
                      ? "치카픽 파트너스 계정 조회"
                      : "파트너스 계정 관리"
                    : activePrimaryTab === "memberships"
                      ? "치카픽 멤버십 관리"
                      : primaryTabs.find((tab) => tab.id === activePrimaryTab)?.label}
                </h1>
                {activePrimaryTab === "dental-sales" ? <DentalSalesInfoTooltip /> : null}
              </div>
              {activePrimaryTab !== "partner-accounts" || isPartnerAccountSearchView ? <p>
                {primaryTabDescriptions[activePrimaryTab]}
              </p> : null}
            </div>
            {activePrimaryTab === "partner-accounts" && !isPartnerAccountSearchView ? (
              <button
                type="button"
                className="admin-partner-accounts-lookup-trigger"
                onClick={() => setIsPartnerAccountSearchView(true)}
              >
                단일 계정 정보 상세 조회하기
              </button>
            ) : activePrimaryTab === "dashboard" ? (
              <div className="admin-topbar-actions">
                <button type="button" onClick={() => loadConsole(session)}>
                  {isLoadingConsole ? "새로고침 중" : "새로고침"}
                </button>
                <button type="button" onClick={signOut}>
                  로그아웃
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {message &&
        activePrimaryTab !== "dental-sales" &&
        activePrimaryTab !== "partner-clinics" &&
        activePrimaryTab !== "sales-performance" &&
        activePrimaryTab !== "chikapick-accounts" &&
        activePrimaryTab !== "partner-accounts" &&
        activePrimaryTab !== "memberships" ? (
          <p className="admin-message">{message}</p>
        ) : null}

        <div
          className={`admin-content admin-content--layout-${adminContentLayout}${
            activePrimaryTab === "dental-sales" ? " admin-content--sales" : ""
          }${
            activePrimaryTab === "partner-clinics"
              ? " admin-content--partner-clinics"
              : ""
          }${
            activePrimaryTab === "sales-performance"
              ? " admin-content--sales-performance"
              : ""
          }${
            activePrimaryTab === "hospital-review"
              ? " admin-content--hospital-review"
              : ""
          }${
            activePrimaryTab === "license-review"
              ? " admin-content--license-review"
              : ""
          }${
            activePrimaryTab === "secret-feedback"
              ? " admin-content--secret-feedback"
              : ""
          }${
            activePrimaryTab === "chikapick-accounts"
              ? " admin-content--chikapick-accounts"
              : ""
          }${
            activePrimaryTab === "partner-accounts"
              ? " admin-content--partner-accounts"
              : ""
          }${
            activePrimaryTab === "partner-accounts" && isPartnerAccountSearchView
              ? " admin-content--partner-account-search"
              : ""
          }${
            activePrimaryTab === "memberships"
              ? " admin-content--memberships"
              : ""
          }${isMembershipRegistrationView ? " admin-content--membership-registration" : ""}${
            activePrimaryTab === "admin-accounts"
              ? " admin-content--admin-accounts"
              : ""
          }${
            activePrimaryTab === "external-connectors"
              ? " admin-content--external-connectors"
              : ""
          }${
            activePrimaryTab === "dashboard" ? " admin-content--overview" : ""
          }${isDentalSalesDetailView ? " admin-content--sales-detail" : ""}${
            isPartnerClinicDetailView ? " admin-content--partner-detail" : ""
          }`}
        >
          {activePrimaryTab === "dental-sales" ? (
            <DentalSalesTab
              accessToken={session?.access_token ?? ""}
              selectedProfileId={selectedDentalSalesProfileId}
              onSelectProfile={(profileId) =>
                profileId
                  ? openAdminDetail({ tab: "dental-sales", id: profileId })
                  : closeAdminDetail("dental-sales")
              }
            />
          ) : activePrimaryTab === "partner-clinics" ? (
            <PartnerClinicsTab
              accessToken={session?.access_token ?? ""}
              selectedClinicId={selectedPartnerClinicId}
              onSelectClinic={(clinicId) =>
                clinicId
                  ? openAdminDetail({ tab: "partner-clinics", id: clinicId })
                  : closeAdminDetail("partner-clinics")
              }
            />
          ) : activePrimaryTab === "sales-performance" ? (
            <SalesPerformanceTab
              accessToken={session?.access_token ?? ""}
              isSuperAdmin={isSuperAdmin}
            />
          ) : activePrimaryTab === "hospital-review" ? (
            <ManualHospitalReviewTab
              accessToken={session?.access_token ?? ""}
              onApprove={(id) =>
                runAction((token) => approveManualHospitalSubmission(token, id, ""))
              }
              onReject={(id, note) =>
                runAction((token) => rejectManualHospitalSubmission(token, id, note))
              }
            />
          ) : activePrimaryTab === "secret-feedback" ? (
            <SecretFeedbackTab accessToken={session?.access_token ?? ""} />
          ) : activePrimaryTab === "chikapick-accounts" ? (
            <ChikapickAccountsTab accessToken={session?.access_token ?? ""} />
          ) : activePrimaryTab === "partner-accounts" ? (
            isPartnerAccountSearchView ? (
              <PartnerAccountSearchView accessToken={session?.access_token ?? ""} />
            ) : (
              <PartnerAccountsTab accessToken={session?.access_token ?? ""} />
            )
          ) : activePrimaryTab === "memberships" ? (
            <MembershipManagementTab
              accessToken={session?.access_token ?? ""}
              isRegistrationView={isMembershipRegistrationView}
              onRegistrationViewChange={setIsMembershipRegistrationView}
            />
          ) : activePrimaryTab === "admin-accounts" ? (
            <AdminAccountsTab
              accessToken={session?.access_token ?? ""}
              dialog={adminAccountDialog}
              onDialogChange={setAdminAccountDialog}
              onInvite={(body) =>
                runAction((token) =>
                  inviteAdminAccount(token, {
                    ...body,
                    redirectTo: adminResetRedirectUrl(),
                  }),
                )
              }
              onPasswordReset={(userId) =>
                runAction((token) =>
                  sendAdminPasswordReset(token, userId, adminResetRedirectUrl()),
                )
              }
              onUnlock={(userId) =>
                runAction((token) => unlockAdminAccount(token, userId))
              }
              onLock={(userId) =>
                runAction((token) => lockAdminAccount(token, userId))
              }
              onWithdraw={(userId) =>
                runAction((token) => withdrawAdminAccount(token, userId))
              }
            />
          ) : activePrimaryTab === "external-connectors" ? (
            <ExternalConnectorsTab
              accessToken={session?.access_token ?? ""}
              onCreate={(body) =>
                runAction((token) => createAdminExternalConnector(token, body))
              }
              onDelete={(connectorId) =>
                runAction((token) =>
                  deleteAdminExternalConnector(token, connectorId),
                )
              }
            />
          ) : activePrimaryTab === "license-review" ? (
            <LicenseReviewTab
              data={consoleData}
              isLoading={isLoadingConsole}
              onDecision={(userId, approved, note) =>
                runAction((token) =>
                  updateLicenseVerification(token, userId, approved, note),
                )
              }
            />
          ) : activePrimaryTab === "clinic-membership-requests" ? (
            <ClinicMembershipRequestsTab
              accessToken={session?.access_token ?? ""}
              onDecision={(clinicId, userId, status) =>
                runAction((token) =>
                  updateClinicMembership(token, clinicId, userId, status),
                )
              }
            />
          ) : activePrimaryTab === "reservations" ? (
            <AdminReservationsTab accessToken={session?.access_token ?? ""} />
          ) : activePrimaryTab === "consultations" ? (
            <AdminConsultationsTab accessToken={session?.access_token ?? ""} />
          ) : activePrimaryTab === "partner-invites" ? (
            <PartnerInviteDirectoryTab
              accessToken={session?.access_token ?? ""}
              onRevoke={(inviteId) =>
                runAction((token) => revokeInvite(token, inviteId))
              }
            />
          ) : activePrimaryTab === "terms-management" ? (
            <TermsManagementTab
              accessToken={session?.access_token ?? ""}
              onPublish={(documentId, body) =>
                runAction((token) =>
                  publishAdminTermVersion(token, documentId, body),
                )
              }
            />
          ) : activePrimaryTab === "audit-log" ? (
            <AdminAuditLogTab accessToken={session?.access_token ?? ""} />
          ) : activePrimaryTab === "dashboard" ? (
            <OverviewTab
              data={consoleData}
              isInitialLoading={!hasLoadedConsole}
              isSuperAdmin={isSuperAdmin}
              onNavigatePrimary={navigateToPrimaryTab}
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}

function MembershipManagementTab({
  accessToken,
  isRegistrationView,
  onRegistrationViewChange,
}: {
  accessToken: string;
  isRegistrationView: boolean;
  onRegistrationViewChange: (isOpen: boolean) => void;
}) {
  const [filters, setFilters] = useState<AdminMembershipFilters>(
    defaultAdminMembershipFilters,
  );
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<AdminMembershipManagementPayload>({
    items: [],
    pagination: { page: 1, pageSize: 6, totalItems: 0, totalPages: 1 },
    inquiries: [],
    pendingInquiryCount: 0,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingPartner, setEditingPartner] = useState<AdminMembershipPartner | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState<MembershipCategory>("lab");
  const [editOrder, setEditOrder] = useState("1");
  const [busyPartnerId, setBusyPartnerId] = useState<string | null>(null);
  const [isBulkBusy, setIsBulkBusy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const requestSequenceRef = useRef(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setCurrentPage(1);
      setFilters((current) =>
        current.query === searchInput
          ? current
          : { ...current, query: searchInput },
      );
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const loadMemberships = useCallback(async () => {
    if (!accessToken) return;
    const requestSequence = ++requestSequenceRef.current;
    setIsLoading(true);
    setError("");
    try {
      const payload = await fetchAdminMembershipManagement(
        accessToken,
        filters,
        currentPage,
      );
      if (requestSequence !== requestSequenceRef.current) return;
      setData(payload);
      setSelectedIds((current) => {
        const visibleIds = new Set(payload.items.map((item) => item.id));
        return new Set([...current].filter((id) => visibleIds.has(id)));
      });
    } catch (loadError) {
      if (requestSequence !== requestSequenceRef.current) return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : "멤버십 업체 목록을 불러오지 못했습니다.",
      );
    } finally {
      if (requestSequence === requestSequenceRef.current) setIsLoading(false);
    }
  }, [accessToken, currentPage, filters]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadMemberships(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadMemberships]);

  function openEditDialog(partner: AdminMembershipPartner) {
    setEditingPartner(partner);
    setEditName(partner.name);
    setEditCategory(partner.category);
    setEditOrder(String(partner.recommendedOrder));
    setNotice("");
  }

  async function runPartnerAction(
    partnerId: string,
    action: () => Promise<{ message: string }>,
  ) {
    setBusyPartnerId(partnerId);
    setError("");
    setNotice("");
    try {
      const result = await action();
      setNotice(result.message);
      await loadMemberships();
      return true;
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "멤버십 업체 정보를 변경하지 못했습니다.",
      );
      return false;
    } finally {
      setBusyPartnerId(null);
    }
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingPartner) return;
    const recommendedOrder = Number(editOrder);
    if (!editName.trim() || !Number.isInteger(recommendedOrder) || recommendedOrder < 1) {
      setError("업체명과 추천순을 확인해 주세요.");
      return;
    }
    const saved = await runPartnerAction(editingPartner.id, () =>
      updateAdminMembershipPartner(accessToken, editingPartner.id, {
        category: editCategory,
        name: editName.trim(),
        recommendedOrder,
      }),
    );
    if (saved) setEditingPartner(null);
  }

  const allRowsSelected =
    data.items.length > 0 && data.items.every((item) => selectedIds.has(item.id));

  async function runBulkAction(action: "show" | "hide" | "delete") {
    const partnerIds = [...selectedIds];
    if (!partnerIds.length) return;
    if (
      action === "delete" &&
      !window.confirm(`선택한 ${partnerIds.length}개 업체를 삭제하시겠습니까?`)
    ) {
      return;
    }
    setIsBulkBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await bulkUpdateAdminMembershipPartners(
        accessToken,
        partnerIds,
        action,
      );
      setNotice(result.message);
      setSelectedIds(new Set());
      await loadMemberships();
    } catch (bulkError) {
      setError(
        bulkError instanceof Error
          ? bulkError.message
          : "선택한 업체를 처리하지 못했습니다.",
      );
    } finally {
      setIsBulkBusy(false);
    }
  }

  if (isRegistrationView) {
    return (
      <MembershipRegistrationView
        accessToken={accessToken}
        onCancel={() => onRegistrationViewChange(false)}
        onSaved={async (message) => {
          setNotice(message);
          await loadMemberships();
          onRegistrationViewChange(false);
        }}
      />
    );
  }

  return (
    <section className="admin-membership-management" aria-label="치카픽 멤버십 관리">
      <div className="admin-membership-toolbar">
        <div className="admin-membership-category-filters" aria-label="업체 카테고리">
          {membershipCategories.map((category) => (
            <button
              type="button"
              key={category.code}
              className={filters.category === category.code ? "is-active" : undefined}
              aria-pressed={filters.category === category.code}
              onClick={() => {
                setCurrentPage(1);
                setFilters((current) => ({ ...current, category: category.code }));
              }}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="admin-membership-search-controls">
          <button
            type="button"
            className="admin-membership-create-button"
            onClick={() => onRegistrationViewChange(true)}
          >
            <span aria-hidden="true">＋</span>
            업체 등록
          </button>
          <label className="admin-membership-search">
            <span className="admin-membership-search-icon" aria-hidden="true" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="업체명 검색"
              aria-label="업체명 검색"
            />
          </label>
          <label className="admin-membership-sort">
            <span className="sr-only">정렬 기준</span>
            <select
              value={filters.sort}
              aria-label="정렬 기준"
              onChange={(event) => {
                setCurrentPage(1);
                setFilters((current) => ({
                  ...current,
                  sort: event.target.value as AdminMembershipFilters["sort"],
                }));
              }}
            >
              <option value="recommended">{membershipSortLabel("recommended")}</option>
              <option value="name">{membershipSortLabel("name")}</option>
              <option value="updated">{membershipSortLabel("updated")}</option>
            </select>
          </label>
        </div>
      </div>

      {error ? <p className="admin-membership-feedback is-error" role="alert">{error}</p> : null}
      {notice ? <p className="admin-membership-feedback" role="status">{notice}</p> : null}
      {selectedIds.size > 0 ? (
        <div className="admin-membership-bulk-actions" role="toolbar" aria-label="선택 업체 작업">
          <strong>{selectedIds.size}개 선택</strong>
          <button type="button" disabled={isBulkBusy} onClick={() => void runBulkAction("show")}>
            노출
          </button>
          <button type="button" disabled={isBulkBusy} onClick={() => void runBulkAction("hide")}>
            숨김
          </button>
          <button type="button" disabled={isBulkBusy} onClick={() => void runBulkAction("delete")}>
            삭제
          </button>
        </div>
      ) : null}

      <div className="admin-membership-content-grid">
        <div className="admin-membership-directory">
          <div className="admin-membership-table-shell" aria-busy={isLoading}>
            <table className="admin-membership-table">
              <thead>
                <tr>
                  <th className="admin-membership-check-cell">
                    <input
                      type="checkbox"
                      aria-label="현재 페이지 전체 선택"
                      checked={allRowsSelected}
                      onChange={(event) =>
                        setSelectedIds(
                          event.target.checked
                            ? new Set(data.items.map((item) => item.id))
                            : new Set(),
                        )
                      }
                    />
                  </th>
                  <th>업체명</th>
                  <th>카테고리</th>
                  <th className="is-centered">추천순</th>
                  <th className="is-centered">수정일</th>
                  <th className="is-centered">수정</th>
                  <th className="is-centered">삭제</th>
                  <th className="is-centered">On/Off</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((partner) => {
                  const isBusy = busyPartnerId === partner.id;
                  return (
                    <tr key={partner.id}>
                      <td className="admin-membership-check-cell">
                        <input
                          type="checkbox"
                          aria-label={`${partner.name} 선택`}
                          checked={selectedIds.has(partner.id)}
                          onChange={(event) =>
                            setSelectedIds((current) => {
                              const next = new Set(current);
                              if (event.target.checked) next.add(partner.id);
                              else next.delete(partner.id);
                              return next;
                            })
                          }
                        />
                      </td>
                      <td className="admin-membership-name-cell">{partner.name}</td>
                      <td>
                        <span className="admin-membership-category-badge">
                          {membershipCategoryLabel(partner.category)}
                        </span>
                      </td>
                      <td className="is-centered">{partner.recommendedOrder}</td>
                      <td className="is-centered admin-membership-date-cell">
                        {formatMembershipDate(partner.updatedAt)}
                      </td>
                      <td className="is-centered">
                        <button
                          type="button"
                          className="admin-membership-edit-button"
                          disabled={isBusy}
                          onClick={() => openEditDialog(partner)}
                        >
                          수정
                        </button>
                      </td>
                      <td className="is-centered">
                        <button
                          type="button"
                          className="admin-membership-delete-button"
                          disabled={isBusy}
                          onClick={() => {
                            if (!window.confirm(`${partner.name} 업체를 삭제하시겠습니까?`)) return;
                            void runPartnerAction(partner.id, () =>
                              deleteAdminMembershipPartner(accessToken, partner.id),
                            );
                          }}
                        >
                          삭제
                        </button>
                      </td>
                      <td className="is-centered">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={partner.isVisible}
                          aria-label={`${partner.name} 노출 ${partner.isVisible ? "끄기" : "켜기"}`}
                          className="admin-membership-toggle"
                          disabled={isBusy}
                          onClick={() =>
                            void runPartnerAction(partner.id, () =>
                              updateAdminMembershipPartner(accessToken, partner.id, {
                                isVisible: !partner.isVisible,
                              }),
                            )
                          }
                        >
                          <span />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && data.items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="admin-membership-empty-row">
                      조회된 멤버십 업체가 없습니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            {isLoading ? <div className="admin-membership-loading">불러오는 중...</div> : null}
          </div>

          <nav className="admin-membership-pagination" aria-label="멤버십 업체 페이지">
            <button
              type="button"
              aria-label="이전 페이지"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              ←
            </button>
            {membershipPageNumbers(currentPage, data.pagination.totalPages).map((page) => (
              <button
                type="button"
                key={page}
                className={page === currentPage ? "is-active" : undefined}
                aria-current={page === currentPage ? "page" : undefined}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              aria-label="다음 페이지"
              disabled={currentPage >= data.pagination.totalPages || isLoading}
              onClick={() =>
                setCurrentPage((page) => Math.min(data.pagination.totalPages, page + 1))
              }
            >
              →
            </button>
          </nav>
        </div>

        <aside className="admin-membership-inquiries" aria-label="문의 요청">
          <div className="admin-membership-inquiry-title">
            <h2>문의 요청</h2>
            <span>{data.pendingInquiryCount}</span>
          </div>
          <div className="admin-membership-inquiry-list">
            {data.inquiries.map((inquiry) => (
              <article key={inquiry.id}>
                <div>
                  <strong>{inquiry.requesterName ?? "이름 미등록"}</strong>
                  <p>{inquiry.requesterEmail ?? "이메일 미등록"}</p>
                  <b>{inquiry.partnerName} 문의 요청</b>
                  {inquiry.clinicName ? <small>{inquiry.clinicName}</small> : null}
                </div>
                <span className="admin-membership-category-badge">
                  {membershipCategoryLabel(inquiry.partnerCategory)}
                </span>
              </article>
            ))}
            {!isLoading && data.inquiries.length === 0 ? (
              <p className="admin-membership-inquiry-empty">대기 중인 문의 요청이 없습니다.</p>
            ) : null}
          </div>
        </aside>
      </div>

      {editingPartner ? (
        <div className="admin-account-dialog-layer admin-membership-edit-layer">
          <button
            type="button"
            className="admin-account-dialog-backdrop"
            aria-label="멤버십 업체 수정 닫기"
            onClick={() => setEditingPartner(null)}
          />
          <div
            className="admin-account-dialog admin-membership-edit-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-membership-edit-title"
          >
            <header>
              <h2 id="admin-membership-edit-title">멤버십 업체 수정</h2>
              <button type="button" onClick={() => setEditingPartner(null)} aria-label="닫기">
                ×
              </button>
            </header>
            <form onSubmit={submitEdit}>
              <label>
                <span>업체명</span>
                <input
                  value={editName}
                  maxLength={80}
                  onChange={(event) => setEditName(event.target.value)}
                />
              </label>
              <label>
                <span>카테고리</span>
                <select
                  value={editCategory}
                  onChange={(event) =>
                    setEditCategory(event.target.value as MembershipCategory)
                  }
                >
                  {membershipCategories.slice(1).map((category) => (
                    <option key={category.code} value={category.code}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>추천순</span>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  value={editOrder}
                  onChange={(event) => setEditOrder(event.target.value)}
                />
              </label>
              <div className="admin-account-dialog-actions">
                <button type="button" onClick={() => setEditingPartner(null)}>
                  취소
                </button>
                <button type="submit" disabled={busyPartnerId === editingPartner.id}>
                  {busyPartnerId === editingPartner.id ? "저장 중" : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MembershipRegistrationView({
  accessToken,
  onCancel,
  onSaved,
}: {
  accessToken: string;
  onCancel: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MembershipCategory>("lab");
  const [recommendedOrder, setRecommendedOrder] = useState("1");
  const [description, setDescription] = useState("");
  const [cardImage, setCardImage] = useState<File | null>(null);
  const [isPreferred, setIsPreferred] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [detailTitle, setDetailTitle] = useState("");
  const [detailDescription, setDetailDescription] = useState("");
  const [detailImage, setDetailImage] = useState<File | null>(null);
  const [inquiryButtonLabel, setInquiryButtonLabel] = useState(
    "상세 보기 및 혜택 신청",
  );
  const [inquiryMethod, setInquiryMethod] =
    useState<MembershipInquiryMethod>("external_link");
  const [inquiryValue, setInquiryValue] = useState("");
  const [intro, setIntro] = useState("");
  const [serviceTags, setServiceTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [strengths, setStrengths] = useState<string[]>([""]);
  const [benefitItems, setBenefitItems] = useState<string[]>([""]);
  const [contentType, setContentType] = useState<MembershipContentType>("section");
  const [richContent, setRichContent] = useState("");
  const [richContentImages, setRichContentImages] = useState<
    AdminMembershipCreateInput["richContentImages"]
  >([]);
  const [attachmentLabel, setAttachmentLabel] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState<{
    index: number;
    list: "strengths" | "benefits";
  } | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const richContentRef = useRef<HTMLTextAreaElement>(null);
  const richContentImageInputRef = useRef<HTMLInputElement>(null);

  function addTag() {
    const normalized = tagDraft.trim();
    if (!normalized || serviceTags.includes(normalized)) return;
    setServiceTags((current) => [...current, normalized]);
    setTagDraft("");
    setIsAddingTag(false);
  }

  function updateListItem(
    list: "strengths" | "benefits",
    index: number,
    value: string,
  ) {
    const setter = list === "strengths" ? setStrengths : setBenefitItems;
    setter((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function removeListItem(list: "strengths" | "benefits", index: number) {
    const setter = list === "strengths" ? setStrengths : setBenefitItems;
    setter((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function moveListItem(
    list: "strengths" | "benefits",
    fromIndex: number,
    toIndex: number,
  ) {
    if (fromIndex === toIndex) return;
    const setter = list === "strengths" ? setStrengths : setBenefitItems;
    setter((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      if (moved === undefined) return current;
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function applyRichContentFormat(
    prefix: string,
    suffix: string,
    placeholder: string,
  ) {
    const textarea = richContentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = richContent.slice(start, end) || placeholder;
    const next =
      richContent.slice(0, start) +
      prefix +
      selected +
      suffix +
      richContent.slice(end);
    if (next.length > 20_000) return;
    setRichContent(next);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length,
      );
    });
  }

  function addRichContentImages(files: FileList | null) {
    if (!files) return;
    const available = Math.max(0, 5 - richContentImages.length);
    const selected = Array.from(files).slice(0, available);
    if (selected.length === 0) {
      setError("본문 이미지는 최대 5개까지 등록할 수 있습니다.");
      return;
    }
    const invalid = selected
      .map((file) => membershipAssetError(file, "detail"))
      .find((message) => message !== null);
    if (invalid) {
      setError(invalid);
      return;
    }
    const images = selected.map((file) => ({
      file,
      token: crypto.randomUUID(),
    }));
    setRichContentImages((current) => [...current, ...images]);
    setRichContent((current) => {
      const separator = current && !current.endsWith("\n") ? "\n" : "";
      const markup = images
        .map(
          ({ file, token }) =>
            `![${file.name.replace(/[\\[\]]/g, "")}](membership-inline://${token})`,
        )
        .join("\n");
      return `${current}${separator}${markup}`.slice(0, 20_000);
    });
    setError("");
  }

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: AdminMembershipCreateInput = {
      attachmentFile,
      attachmentLabel: attachmentLabel.trim(),
      benefitItems: benefitItems.map((item) => item.trim()).filter(Boolean),
      cardImage,
      category,
      contentType,
      description: description.trim(),
      detailDescription: detailDescription.trim(),
      detailImage,
      detailTitle: detailTitle.trim(),
      inquiryButtonLabel: inquiryButtonLabel.trim(),
      inquiryMethod,
      inquiryValue: inquiryValue.trim(),
      intro: intro.trim(),
      isPreferred,
      isVisible,
      name: name.trim(),
      recommendedOrder: Number(recommendedOrder),
      richContent: richContent.trim(),
      richContentImages,
      serviceTags,
      strengths: strengths.map((item) => item.trim()).filter(Boolean),
    };
    const validationError = validateMembershipRegistration(input);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const result = await createAdminMembershipPartner(accessToken, input);
      await onSaved(result.message);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "멤버십 업체를 등록하지 못했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="admin-membership-registration" aria-label="제휴 업체 등록">
      <header className="admin-membership-registration-heading">
        <nav aria-label="현재 위치">
          <button type="button" onClick={onCancel}>멤버십 관리</button>
          <span aria-hidden="true">›</span>
          <strong>업체 등록</strong>
        </nav>
        <h1>제휴 업체 등록</h1>
      </header>

      <form onSubmit={submitRegistration}>
        <div className="admin-membership-registration-grid">
          <div className="admin-membership-registration-column">
            <MembershipFormCard title="카드 기본 정보">
              <MembershipFormField label="업체명" required>
                <input
                  value={name}
                  maxLength={80}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="업체명을 입력해 주세요."
                />
              </MembershipFormField>
              <div className="admin-membership-form-row">
                <MembershipFormField label="카테고리" required>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as MembershipCategory)}
                  >
                    {membershipCategories.slice(1).map((item) => (
                      <option key={item.code} value={item.code}>{item.label}</option>
                    ))}
                  </select>
                </MembershipFormField>
                <MembershipFormField label="추천순 노출 가중치" required>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={recommendedOrder}
                    onChange={(event) => setRecommendedOrder(event.target.value)}
                  />
                </MembershipFormField>
              </div>
              <MembershipFormField label="한 줄 소개" required>
                <input
                  value={description}
                  maxLength={200}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="멤버십 목록 카드에 노출될 간단한 소개를 적어주세요."
                />
              </MembershipFormField>
              <MembershipFileField
                label="대표 썸네일 이미지"
                file={cardImage}
                accept="image/jpeg,image/png,image/gif"
                hint="JPG, PNG, GIF (최대 2MB)"
                onChange={setCardImage}
              />
              <div className="admin-membership-form-toggles">
                <MembershipToggleField
                  checked={isPreferred}
                  label="치카픽 회원 우대 여부"
                  onChange={setIsPreferred}
                />
                <MembershipToggleField
                  checked={isVisible}
                  label="노출 여부"
                  onChange={setIsVisible}
                />
              </div>
            </MembershipFormCard>

            <MembershipFormCard title="상세 상단 정보">
              <MembershipFormField label="상세 페이지 제목" required>
                <input
                  value={detailTitle}
                  maxLength={120}
                  onChange={(event) => setDetailTitle(event.target.value)}
                  placeholder="상세화면 최상단에 노출될 헤드라인 타이틀"
                />
              </MembershipFormField>
              <MembershipFormField label="상세 페이지 부제목">
                <input
                  value={detailDescription}
                  maxLength={200}
                  onChange={(event) => setDetailDescription(event.target.value)}
                  placeholder="보조 타이틀 문구를 입력하세요."
                />
              </MembershipFormField>
              <MembershipFileField
                label="상세 페이지 대표 이미지"
                file={detailImage}
                accept="image/jpeg,image/png,image/gif"
                hint="권장 사이즈: 1200 × 630px (최대 10MB)"
                large
                onChange={setDetailImage}
              />
              <div className="admin-membership-form-row">
                <MembershipFormField label="문의 버튼명" required>
                  <input
                    value={inquiryButtonLabel}
                    maxLength={60}
                    onChange={(event) => setInquiryButtonLabel(event.target.value)}
                  />
                </MembershipFormField>
                <fieldset className="admin-membership-inquiry-method">
                  <legend>문의 연결 방식</legend>
                  <div>
                    {([
                      ["external_link", "외부 링크"],
                      ["phone", "전화번호"],
                      ["kakao", "카카오 채널"],
                    ] as const).map(([value, label]) => (
                      <label key={value}>
                        <input
                          type="radio"
                          name="membership-inquiry-method"
                          checked={inquiryMethod === value}
                          onChange={() => setInquiryMethod(value)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
              <MembershipFormField label="문의 연결 값 (URL / 전화번호 등)" required>
                <input
                  value={inquiryValue}
                  maxLength={500}
                  onChange={(event) => setInquiryValue(event.target.value)}
                  placeholder="https:// 또는 숫자만 입력"
                />
              </MembershipFormField>
            </MembershipFormCard>
          </div>

          <div className="admin-membership-registration-column">
            <MembershipFormCard title="상세 섹션형 콘텐츠">
              <MembershipFormField label="소개 및 안내글">
                <textarea
                  value={intro}
                  maxLength={5000}
                  onChange={(event) => setIntro(event.target.value)}
                  placeholder="제휴 업체를 소개하는 본문 내용을 적어주세요. (줄바꿈 가능)"
                />
              </MembershipFormField>
              <div className="admin-membership-tags-field">
                <span>주요 서비스 또는 태그</span>
                <div>
                  {serviceTags.map((tag) => (
                    <span className="admin-membership-tag" key={tag}>
                      {tag}
                      <button
                        type="button"
                        aria-label={`${tag} 삭제`}
                        onClick={() => setServiceTags((current) => current.filter((item) => item !== tag))}
                      >×</button>
                    </span>
                  ))}
                  {isAddingTag ? (
                    <span className="admin-membership-tag-entry">
                      <input
                        autoFocus
                        value={tagDraft}
                        maxLength={60}
                        aria-label="태그 입력"
                        onChange={(event) => setTagDraft(event.target.value)}
                        onBlur={addTag}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addTag();
                          }
                          if (event.key === "Escape") setIsAddingTag(false);
                        }}
                      />
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="admin-membership-tag-add"
                      onClick={() => setIsAddingTag(true)}
                    >＋ 추가</button>
                  )}
                </div>
              </div>
              <MembershipListField
                label="업체 특장점 / 보유 장비 (리스트 항목)"
                list="strengths"
                items={strengths}
                dragging={dragging}
                onAdd={() => setStrengths((current) => [...current, ""])}
                onDrag={setDragging}
                onMove={moveListItem}
                onRemove={removeListItem}
                onUpdate={updateListItem}
              />
              <MembershipListField
                label="치카픽 회원 우대 혜택 (리스트 항목)"
                list="benefits"
                items={benefitItems}
                dragging={dragging}
                onAdd={() => setBenefitItems((current) => [...current, ""])}
                onDrag={setDragging}
                onMove={moveListItem}
                onRemove={removeListItem}
                onUpdate={updateListItem}
              />
            </MembershipFormCard>

            <MembershipFormCard title="확장 콘텐츠">
              <div className="admin-membership-content-type">
                <span>상세 콘텐츠 유형 선택</span>
                <div role="tablist" aria-label="상세 콘텐츠 유형">
                  {([
                    ["section", "섹션형"],
                    ["editor", "자유 본문형 (에디터)"],
                    ["download", "첨부파일 다운로드형"],
                  ] as const).map(([value, label]) => (
                    <button
                      type="button"
                      role="tab"
                      key={value}
                      aria-selected={contentType === value}
                      onClick={() => setContentType(value)}
                    >{label}</button>
                  ))}
                </div>
              </div>
              <MembershipFormField label="자유 본문 편집 영역">
                <div className="admin-membership-rich-editor">
                  <div
                    className="admin-membership-rich-toolbar"
                    role="toolbar"
                    aria-label="본문 서식"
                  >
                    <button
                      type="button"
                      aria-label="굵게"
                      onClick={() =>
                        applyRichContentFormat("**", "**", "강조할 내용")
                      }
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      aria-label="목록"
                      onClick={() =>
                        applyRichContentFormat("- ", "", "목록 항목")
                      }
                    >
                      ▧
                    </button>
                    <button
                      type="button"
                      aria-label="링크"
                      onClick={() =>
                        applyRichContentFormat("[", "](https://)", "링크 문구")
                      }
                    >
                      ⌁
                    </button>
                    <button
                      type="button"
                      aria-label="본문 이미지 추가"
                      onClick={() => richContentImageInputRef.current?.click()}
                    >
                      ▧
                    </button>
                    <i />
                    <span>Pretendard Regular</span><b>⌄</b>
                  </div>
                  <textarea
                    ref={richContentRef}
                    value={richContent}
                    maxLength={20000}
                    onChange={(event) => setRichContent(event.target.value)}
                    placeholder="본문을 입력하고 상단 서식 버튼으로 강조, 목록, 링크를 추가하세요."
                  />
                  <input
                    ref={richContentImageInputRef}
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    multiple
                    onChange={(event) => {
                      addRichContentImages(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </div>
                {richContentImages.length > 0 ? (
                  <ul className="admin-membership-inline-images">
                    {richContentImages.map((image) => (
                      <li key={image.token}>
                        <span>{image.file.name}</span>
                        <button
                          type="button"
                          aria-label={`${image.file.name} 본문 이미지 삭제`}
                          onClick={() => {
                            setRichContentImages((current) =>
                              current.filter((item) => item.token !== image.token),
                            );
                            setRichContent((current) =>
                              current
                                .replace(
                                  new RegExp(
                                    `!?\\[[^\\]]*\\]\\(membership-inline://${image.token}\\)\\n?`,
                                    "g",
                                  ),
                                  "",
                                )
                                .trimEnd(),
                            );
                          }}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </MembershipFormField>
              <MembershipFormField label="첨부파일 명칭">
                <input
                  value={attachmentLabel}
                  maxLength={150}
                  onChange={(event) => setAttachmentLabel(event.target.value)}
                  placeholder="예: [브로셔] 업체명_소개서.pdf"
                />
              </MembershipFormField>
              <MembershipFileField
                label="첨부파일 업로드 (PDF, PPTX 등)"
                file={attachmentFile}
                accept="image/jpeg,image/png,image/gif,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                hint="JPG, PNG, GIF, PDF, PPT, PPTX (최대 10MB)"
                onChange={setAttachmentFile}
              />
            </MembershipFormCard>
          </div>
        </div>

        {error ? <p className="admin-membership-registration-error" role="alert">{error}</p> : null}
        <div className="admin-membership-registration-actions">
          <button type="button" onClick={onCancel} disabled={isSaving}>취소</button>
          <button type="submit" disabled={isSaving}>{isSaving ? "저장 중..." : "저장하기"}</button>
        </div>
      </form>
    </section>
  );
}

function MembershipFormCard({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="admin-membership-form-card">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function MembershipFormField({
  children,
  label,
  required = false,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="admin-membership-form-field">
      <span>{label}{required ? <b aria-hidden="true"> *</b> : null}</span>
      {children}
    </label>
  );
}

function MembershipFileField({
  accept,
  file,
  hint,
  label,
  large = false,
  onChange,
}: {
  accept: string;
  file: File | null;
  hint: string;
  label: string;
  large?: boolean;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="admin-membership-file-field">
      <span>{label}</span>
      <label
        className={large ? "admin-membership-upload-zone is-large" : "admin-membership-upload-zone"}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          onChange(event.dataTransfer.files[0] ?? null);
        }}
      >
        <input
          type="file"
          accept={accept}
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
        <Image src="/Type=Upload.svg" alt="" width={24} height={24} />
        <strong>{file ? file.name : "클릭하거나 파일을 드래그하여 업로드하세요."}</strong>
        <small>{hint}</small>
      </label>
    </div>
  );
}

function MembershipToggleField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="admin-membership-toggle-field">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i aria-hidden="true" />
    </label>
  );
}

function MembershipListField({
  dragging,
  items,
  label,
  list,
  onAdd,
  onDrag,
  onMove,
  onRemove,
  onUpdate,
}: {
  dragging: { index: number; list: "strengths" | "benefits" } | null;
  items: string[];
  label: string;
  list: "strengths" | "benefits";
  onAdd: () => void;
  onDrag: (value: { index: number; list: "strengths" | "benefits" } | null) => void;
  onMove: (list: "strengths" | "benefits", fromIndex: number, toIndex: number) => void;
  onRemove: (list: "strengths" | "benefits", index: number) => void;
  onUpdate: (list: "strengths" | "benefits", index: number, value: string) => void;
}) {
  return (
    <div className="admin-membership-list-field">
      <div>
        <span>{label}</span>
        <button type="button" onClick={onAdd}>+ 항목 추가</button>
      </div>
      <ul>
        {items.map((item, index) => (
          <li
            key={`${list}-${index}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragging?.list === list) onMove(list, dragging.index, index);
              onDrag(null);
            }}
          >
            <button
              type="button"
              className="admin-membership-grip"
              draggable
              aria-label={`${index + 1}번 항목 순서 변경`}
              onDragStart={() => onDrag({ index, list })}
              onDragEnd={() => onDrag(null)}
            >
              <Image src="/Type=Grip.svg" alt="" width={24} height={24} />
            </button>
            <input
              value={item}
              maxLength={200}
              aria-label={`${label} ${index + 1}`}
              onChange={(event) => onUpdate(list, index, event.target.value)}
            />
            <button
              type="button"
              className="admin-membership-list-delete"
              aria-label={`${index + 1}번 항목 삭제`}
              onClick={() => onRemove(list, index)}
            >
              <Image src="/Type=Delete.svg" alt="" width={24} height={24} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdminAccountsTab({
  accessToken,
  dialog,
  onDialogChange,
  onInvite,
  onLock,
  onPasswordReset,
  onUnlock,
  onWithdraw,
}: {
  accessToken: string;
  dialog: "invite" | null;
  onDialogChange: (dialog: "invite" | null) => void;
  onInvite: (body: {
    email: string;
    fullName: string;
    role: AdminAccountRole;
  }) => Promise<boolean>;
  onLock: (userId: string) => Promise<boolean>;
  onPasswordReset: (userId: string) => Promise<boolean>;
  onUnlock: (userId: string) => Promise<boolean>;
  onWithdraw: (userId: string) => Promise<boolean>;
}) {
  const [filters, setFilters] = useState<AdminAccountDirectoryFilters>(
    defaultAdminAccountDirectoryFilters,
  );
  const [draftQuery, setDraftQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<AdminAccountDirectoryPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ left: 0, top: 0 });
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminAccountRole>("super_admin");
  const [dialogError, setDialogError] = useState("");
  const [isDialogSubmitting, setIsDialogSubmitting] = useState(false);

  const loadAccounts = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setErrorMessage("");
    try {
      const payload = await fetchAdminAccountDirectory(
        accessToken,
        filters,
        currentPage,
      );
      setData(payload);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "어드민 계정 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, currentPage, filters]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadAccounts(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadAccounts]);

  useEffect(() => {
    if (!openActionId) return;

    const closeMenu = () => setOpenActionId(null);
    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest(".admin-account-row-action")
      ) {
        return;
      }
      closeMenu();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [openActionId]);

  const pagination = data?.pagination;
  const pageNumbers = dentalSalesPageNumbers(
    pagination?.page ?? currentPage,
    pagination?.totalPages ?? 1,
  );
  const canManage = data?.canManage === true;
  const roleFilters: Array<{ label: string; value: AdminAccountDirectoryRole }> = [
    { label: "전체", value: "all" },
    { label: "최고 관리자", value: "super_admin" },
    { label: "영업 담당자", value: "sales" },
    { label: "운영 관리자", value: "admin" },
  ];

  function closeDialog() {
    if (isDialogSubmitting) return;
    onDialogChange(null);
    setDialogError("");
  }

  async function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = inviteEmail.trim();
    if (!email) {
      setDialogError("이메일을 입력해 주세요.");
      return;
    }
    setDialogError("");
    setIsDialogSubmitting(true);
    const succeeded = await onInvite({
      fullName: adminInviteDisplayName(email),
      email,
      role: inviteRole,
    });
    if (succeeded) {
      setInviteEmail("");
      setInviteRole("super_admin");
      onDialogChange(null);
      await loadAccounts();
    }
    setIsDialogSubmitting(false);
  }

  async function handlePasswordReset(userId: string) {
    setActionUserId(userId);
    const succeeded = await onPasswordReset(userId);
    if (succeeded) setOpenActionId(null);
    setActionUserId(null);
  }

  async function handleUnlock(userId: string) {
    if (!window.confirm("이 어드민 계정의 잠금을 해제하시겠습니까?")) return;
    setActionUserId(userId);
    const succeeded = await onUnlock(userId);
    if (succeeded) {
      setOpenActionId(null);
      await loadAccounts();
    }
    setActionUserId(null);
  }

  async function handleLock(userId: string) {
    if (
      !window.confirm(
        "이 어드민 계정을 잠그시겠습니까? 잠금을 해제하기 전까지 로그인할 수 없습니다.",
      )
    ) {
      return;
    }
    setActionUserId(userId);
    const succeeded = await onLock(userId);
    if (succeeded) {
      setOpenActionId(null);
      await loadAccounts();
    }
    setActionUserId(null);
  }

  async function handleWithdraw(userId: string) {
    if (
      !window.confirm(
        "이 어드민 계정을 탈퇴 처리하시겠습니까? 어드민 권한과 로그인 세션이 즉시 해제됩니다.",
      )
    ) {
      return;
    }
    setActionUserId(userId);
    const succeeded = await onWithdraw(userId);
    if (succeeded) {
      setOpenActionId(null);
      await loadAccounts();
    }
    setActionUserId(null);
  }

  function toggleActionMenu(
    accountId: string,
    button: HTMLButtonElement,
  ) {
    if (openActionId === accountId) {
      setOpenActionId(null);
      return;
    }

    const rect = button.getBoundingClientRect();
    const viewportPadding = 8;
    const menuGap = 4;
    const menuWidth = 224;
    const menuHeight = 126;
    const left = Math.min(
      window.innerWidth - menuWidth - viewportPadding,
      Math.max(viewportPadding, rect.right - menuWidth),
    );
    const below = rect.bottom + menuGap;
    const top =
      below + menuHeight <= window.innerHeight - viewportPadding
        ? below
        : Math.max(viewportPadding, rect.top - menuHeight - menuGap);

    setActionMenuPosition({ left, top });
    setOpenActionId(accountId);
  }

  return (
    <section className="admin-account-directory">
      <div className="admin-account-directory-toolbar">
        <div className="admin-account-role-filters" aria-label="어드민 계정 역할 필터">
          {roleFilters.map((filter) => (
            <button
              type="button"
              key={filter.value}
              className={filters.role === filter.value ? "is-active" : undefined}
              aria-pressed={filters.role === filter.value}
              onClick={() => {
                setCurrentPage(1);
                setFilters((current) => ({ ...current, role: filter.value }));
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="admin-account-directory-actions">
          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              setCurrentPage(1);
              setFilters((current) => ({
                ...current,
                query: draftQuery.trim(),
              }));
            }}
          >
            <span className="admin-sales-search-icon" aria-hidden="true" />
            <input
              type="search"
              value={draftQuery}
              placeholder="검색"
              aria-label="어드민 계정 검색"
              onChange={(event) => setDraftQuery(event.target.value)}
            />
          </form>
          {canManage ? (
            <button type="button" onClick={() => onDialogChange("invite")}>
              초대하기
            </button>
          ) : null}
        </div>
      </div>

      {errorMessage ? (
        <div className="admin-sales-feedback admin-sales-feedback--error" role="alert">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => void loadAccounts()}>
            다시 시도
          </button>
        </div>
      ) : null}

      <div className="admin-account-directory-table-scroll" aria-busy={isLoading}>
        <table className="admin-account-directory-table">
          <colgroup>
            <col className="admin-account-col-name" />
            <col className="admin-account-col-email" />
            <col className="admin-account-col-id" />
            <col className="admin-account-col-role" />
            <col className="admin-account-col-status" />
            <col className="admin-account-col-login" />
            <col className="admin-account-col-joined" />
            <col className="admin-account-col-action" />
          </colgroup>
          <thead>
            <tr>
              <th>사용자 이름</th>
              <th>이메일</th>
              <th>ID</th>
              <th>역할</th>
              <th>계정 상태</th>
              <th>최근 로그인</th>
              <th>가입일</th>
              <th className="admin-account-action-heading">액션</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((account) => (
              <tr key={account.id}>
                <td title={account.fullName ?? undefined}>{account.fullName ?? "-"}</td>
                <td title={account.email ?? undefined}>{account.email ?? "-"}</td>
                <td title={account.accountId}>{account.accountId}</td>
                <td>{adminAccountDirectoryRoleLabel(account.role)}</td>
                <td>
                  <span
                    className={`admin-account-status admin-account-status--${account.status}`}
                  >
                    {adminAccountDirectoryStatusLabel(account.status)}
                  </span>
                </td>
                <td>{formatAdminAccountDirectoryDate(account.lastLoginAt, true)}</td>
                <td>{formatAdminAccountDirectoryDate(account.joinedAt)}</td>
                <td className="admin-account-action-cell">
                  {canManage ? (
                    <div className="admin-account-row-action">
                      <button
                        type="button"
                        aria-label={`${account.fullName ?? account.email ?? "계정"} 관리`}
                        aria-haspopup="menu"
                        aria-controls={`admin-account-actions-${account.id}`}
                        aria-expanded={openActionId === account.id}
                        onClick={(event) =>
                          toggleActionMenu(account.id, event.currentTarget)
                        }
                      >
                        <span aria-hidden="true">⋮</span>
                      </button>
                      {openActionId === account.id ? (
                        <div
                          id={`admin-account-actions-${account.id}`}
                          className="admin-account-row-action-menu"
                          role="menu"
                          style={actionMenuPosition}
                        >
                          <button
                            type="button"
                            role="menuitem"
                            disabled={actionUserId === account.id}
                            onClick={() => void handlePasswordReset(account.id)}
                          >
                            비밀번호 재설정 이메일 전송
                          </button>
                          <span aria-hidden="true" />
                          {account.status === "locked" ? (
                            <button
                              type="button"
                              role="menuitem"
                              disabled={actionUserId === account.id}
                              onClick={() => void handleUnlock(account.id)}
                            >
                              계정 잠금 해제
                            </button>
                          ) : (
                            <button
                              type="button"
                              role="menuitem"
                              disabled={actionUserId === account.id}
                              onClick={() => void handleLock(account.id)}
                            >
                              계정 잠금
                            </button>
                          )}
                          <span aria-hidden="true" />
                          <button
                            type="button"
                            role="menuitem"
                            disabled={actionUserId === account.id}
                            onClick={() => void handleWithdraw(account.id)}
                          >
                            계정 탈퇴
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && (data?.items.length ?? 0) === 0 ? (
              <tr>
                <td className="admin-sales-empty" colSpan={8}>
                  검색 조건에 맞는 어드민 계정이 없습니다.
                </td>
              </tr>
            ) : null}
            {isLoading && !data ? (
              <tr>
                <td className="admin-sales-empty" colSpan={8}>
                  어드민 계정을 불러오는 중입니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <nav className="admin-sales-pagination" aria-label="어드민 계정 목록 페이지">
          <button
            type="button"
            aria-label="이전 페이지"
            disabled={pagination.page <= 1 || isLoading}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            ‹
          </button>
          {pageNumbers.map((pageNumber) => (
            <button
              type="button"
              key={pageNumber}
              className={
                pageNumber === pagination.page ? "admin-sales-page-active" : undefined
              }
              aria-current={pageNumber === pagination.page ? "page" : undefined}
              disabled={isLoading}
              onClick={() => setCurrentPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            aria-label="다음 페이지"
            disabled={pagination.page >= pagination.totalPages || isLoading}
            onClick={() =>
              setCurrentPage((page) => Math.min(pagination.totalPages, page + 1))
            }
          >
            ›
          </button>
        </nav>
      ) : null}

      {dialog && canManage ? (
        <div className="admin-account-dialog-layer">
          <button
            type="button"
            className="admin-account-dialog-backdrop"
            aria-label="계정 관리 창 닫기"
            onClick={closeDialog}
          />
          <section
            className="admin-account-dialog admin-account-dialog--invite"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-account-dialog-title"
          >
            <header>
              <h2 id="admin-account-dialog-title">계정 생성</h2>
            </header>
            <form className="admin-account-invite-form" onSubmit={submitInvite}>
              <div className="admin-account-dialog-body">
                <label className="admin-account-invite-email">
                  <span>
                    이메일 <b aria-hidden="true">*</b>
                  </span>
                  <input
                    autoFocus
                    required
                    type="email"
                    autoComplete="email"
                    placeholder="your@gmail.com"
                    value={inviteEmail}
                    onChange={(event) => {
                      setInviteEmail(event.target.value);
                      setDialogError("");
                    }}
                  />
                </label>
                <label className="admin-account-invite-role">
                  <span>역할</span>
                  <span className="admin-account-role-select">
                    <select
                      value={inviteRole}
                      onChange={(event) =>
                        setInviteRole(event.target.value as AdminAccountRole)
                      }
                    >
                      <option value="super_admin">최고 관리자</option>
                      <option value="sales">영업 담당자</option>
                      <option value="admin">운영 관리자</option>
                    </select>
                  </span>
                </label>
                {dialogError ? <p role="alert">{dialogError}</p> : null}
              </div>
              <footer className="admin-account-dialog-footer">
                <button type="button" disabled={isDialogSubmitting} onClick={closeDialog}>
                  취소
                </button>
                <button type="submit" disabled={isDialogSubmitting}>
                  {isDialogSubmitting ? "발송 중" : "초대 메일 발송"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function ExternalConnectorsTab({
  accessToken,
  onCreate,
  onDelete,
}: {
  accessToken: string;
  onCreate: (body: { affiliation: string; name: string }) => Promise<boolean>;
  onDelete: (connectorId: string) => Promise<boolean>;
}) {
  const [data, setData] = useState<ExternalConnectorDirectoryPayload | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadConnectors = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setErrorMessage("");
    try {
      setData(await fetchAdminExternalConnectors(accessToken, currentPage));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "외부 연결자 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, currentPage]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadConnectors(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadConnectors]);

  function closeDialog() {
    if (isSubmitting) return;
    setIsDialogOpen(false);
    setDialogError("");
  }

  async function submitConnector(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    const normalizedAffiliation = affiliation.trim();
    if (!normalizedName || !normalizedAffiliation) {
      setDialogError("이름과 소속을 입력해 주세요.");
      return;
    }

    setDialogError("");
    setIsSubmitting(true);
    const succeeded = await onCreate({
      affiliation: normalizedAffiliation,
      name: normalizedName,
    });
    if (succeeded) {
      setName("");
      setAffiliation("");
      setIsDialogOpen(false);
      if (currentPage === 1) await loadConnectors();
      else setCurrentPage(1);
    }
    setIsSubmitting(false);
  }

  async function handleDelete(connectorId: string, connectorName: string) {
    if (!window.confirm(`${connectorName} 외부 연결자를 삭제하시겠습니까?`)) return;
    setDeletingId(connectorId);
    const succeeded = await onDelete(connectorId);
    if (succeeded) {
      if ((data?.items.length ?? 0) === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1);
      } else {
        await loadConnectors();
      }
    }
    setDeletingId(null);
  }

  const pagination = data?.pagination;
  const pageNumbers = dentalSalesPageNumbers(
    pagination?.page ?? currentPage,
    pagination?.totalPages ?? 1,
  );

  return (
    <section className="admin-external-connectors">
      {data?.canManage ? (
        <button
          className="admin-external-connectors-register"
          type="button"
          onClick={() => setIsDialogOpen(true)}
        >
          외부 연결자 등록
        </button>
      ) : null}

      <div className="admin-external-connectors-content">
        {errorMessage ? (
          <div className="admin-sales-feedback admin-sales-feedback--error" role="alert">
            <span>{errorMessage}</span>
            <button type="button" onClick={() => void loadConnectors()}>
              다시 시도
            </button>
          </div>
        ) : null}

        <div className="admin-external-connectors-table-scroll" aria-busy={isLoading}>
          <table className="admin-external-connectors-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>소속</th>
                <th>등록 시점</th>
                <th className="admin-external-connectors-delete-heading">삭제</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((connector) => (
                <tr key={connector.id}>
                  <td>{connector.name}</td>
                  <td>{connector.affiliation ?? "-"}</td>
                  <td>{formatExternalConnectorDate(connector.createdAt)}</td>
                  <td className="admin-external-connectors-delete-cell">
                    {data.canManage ? (
                      <button
                        type="button"
                        disabled={deletingId === connector.id}
                        onClick={() => void handleDelete(connector.id, connector.name)}
                      >
                        {deletingId === connector.id ? "삭제 중" : "삭제"}
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && (data?.items.length ?? 0) === 0 ? (
                <tr>
                  <td className="admin-sales-empty" colSpan={4}>
                    등록된 외부 연결자가 없습니다.
                  </td>
                </tr>
              ) : null}
              {isLoading && !data ? (
                <tr>
                  <td className="admin-sales-empty" colSpan={4}>
                    외부 연결자를 불러오는 중입니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {pagination ? (
          <nav className="admin-sales-pagination" aria-label="외부 연결자 목록 페이지">
            <button
              type="button"
              aria-label="이전 페이지"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              ‹
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                className={
                  pageNumber === pagination.page ? "admin-sales-page-active" : undefined
                }
                aria-current={pageNumber === pagination.page ? "page" : undefined}
                disabled={isLoading}
                onClick={() => setCurrentPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              aria-label="다음 페이지"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() =>
                setCurrentPage((page) => Math.min(pagination.totalPages, page + 1))
              }
            >
              ›
            </button>
          </nav>
        ) : null}
      </div>

      {isDialogOpen && data?.canManage ? (
        <div className="admin-account-dialog-layer admin-external-connector-dialog-layer">
          <button
            type="button"
            className="admin-account-dialog-backdrop"
            aria-label="외부 연결자 등록 창 닫기"
            tabIndex={-1}
            onClick={closeDialog}
          />
          <section
            className="admin-account-dialog admin-external-connector-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="external-connector-dialog-title"
          >
            <header>
              <h2 id="external-connector-dialog-title">외부 연결자 등록</h2>
              <span className="admin-external-connector-dialog-header-spacer" />
            </header>
            <form onSubmit={submitConnector}>
              <div className="admin-external-connector-dialog-fields">
                <label>
                  <span>
                    이름 <strong aria-hidden="true">*</strong>
                  </span>
                  <input
                    autoFocus
                    required
                    maxLength={100}
                    placeholder="이름을 입력해 주세요"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setDialogError("");
                    }}
                  />
                </label>
                <label>
                  <span>
                    소속 <strong aria-hidden="true">*</strong>
                  </span>
                  <input
                    required
                    maxLength={100}
                    placeholder="소속을 입력해 주세요"
                    value={affiliation}
                    onChange={(event) => {
                      setAffiliation(event.target.value);
                      setDialogError("");
                    }}
                  />
                </label>
              </div>
              {dialogError ? <p role="alert">{dialogError}</p> : null}
              <div className="admin-account-dialog-actions">
                <button type="button" disabled={isSubmitting} onClick={closeDialog}>
                  취소
                </button>
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "등록 중" : "등록하기"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function SecretFeedbackTab({ accessToken }: { accessToken: string }) {
  const [data, setData] = useState<SecretFeedbackPayload | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<SecretFeedbackItem | null>(
    null,
  );

  const loadFeedback = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setErrorMessage("");
    try {
      setData(await fetchAdminSecretFeedback(accessToken, currentPage));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "시크릿 피드백을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, currentPage]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadFeedback(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadFeedback]);

  useEffect(() => {
    if (!selectedFeedback) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedFeedback(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedFeedback]);

  const metrics = [
    { label: "전체 피드백 수", value: data?.metrics.total ?? null },
    { label: "매우만족/만족 수", value: data?.metrics.positive ?? null },
    { label: "보통 수", value: data?.metrics.neutral ?? null },
    { label: "매우 아쉬움/아쉬움 수", value: data?.metrics.negative ?? null },
  ];
  const pagination = data?.pagination;
  const pageNumbers = dentalSalesPageNumbers(
    pagination?.page ?? currentPage,
    pagination?.totalPages ?? 1,
  );

  return (
    <section className="admin-secret-feedback">
      <div className="admin-secret-feedback-metrics">
        {metrics.map((metric) => (
          <article key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value?.toLocaleString("ko-KR") ?? "—"}</strong>
          </article>
        ))}
      </div>

      {errorMessage ? (
        <div className="admin-sales-feedback admin-sales-feedback--error" role="alert">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => void loadFeedback()}>
            다시 시도
          </button>
        </div>
      ) : null}

      <div className="admin-secret-feedback-table-scroll" aria-busy={isLoading}>
        <table className="admin-secret-feedback-table">
          <thead>
            <tr>
              <th>접수일시</th>
              <th>병원명</th>
              <th>만족도</th>
              <th>상세보기</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((feedback) => (
              <tr key={feedback.id}>
                <td>{formatSecretFeedbackDate(feedback.submittedAt)}</td>
                <td title={feedback.clinicName}>{feedback.clinicName}</td>
                <td>
                  <strong className={`is-${feedback.rating}`}>
                    {secretFeedbackRatingLabel(feedback.rating, true)}
                  </strong>
                </td>
                <td>
                  <button type="button" onClick={() => setSelectedFeedback(feedback)}>
                    상세보기
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && (data?.items.length ?? 0) === 0 ? (
              <tr>
                <td className="admin-sales-empty" colSpan={4}>
                  접수된 시크릿 피드백이 없습니다.
                </td>
              </tr>
            ) : null}
            {isLoading && !data ? (
              <tr>
                <td className="admin-sales-empty" colSpan={4}>
                  시크릿 피드백을 불러오는 중입니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <nav className="admin-sales-pagination" aria-label="시크릿 피드백 목록 페이지">
          <button
            type="button"
            aria-label="이전 페이지"
            disabled={pagination.page <= 1 || isLoading}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            ‹
          </button>
          {pageNumbers.map((pageNumber) => (
            <button
              type="button"
              key={pageNumber}
              className={
                pageNumber === pagination.page ? "admin-sales-page-active" : undefined
              }
              aria-current={pageNumber === pagination.page ? "page" : undefined}
              disabled={isLoading}
              onClick={() => setCurrentPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            aria-label="다음 페이지"
            disabled={pagination.page >= pagination.totalPages || isLoading}
            onClick={() =>
              setCurrentPage((page) => Math.min(pagination.totalPages, page + 1))
            }
          >
            ›
          </button>
        </nav>
      ) : null}

      {selectedFeedback ? (
        <SecretFeedbackDetail
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
        />
      ) : null}
    </section>
  );
}

function SecretFeedbackDetail({
  feedback,
  onClose,
}: {
  feedback: SecretFeedbackItem;
  onClose: () => void;
}) {
  return (
    <div className="admin-secret-feedback-detail-layer">
      <button
        type="button"
        className="admin-secret-feedback-detail-backdrop"
        aria-label="시크릿 피드백 상세 닫기"
        tabIndex={-1}
        onClick={onClose}
      />
      <aside
        className="admin-secret-feedback-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="secret-feedback-detail-title"
      >
        <div className="admin-secret-feedback-detail-scroll">
          <header>
            <h2 id="secret-feedback-detail-title">
              오늘 <em>{feedback.clinicName}</em>에서의
              <br />
              진료경험은 어떠셨나요?
            </h2>
            <button type="button" aria-label="닫기" autoFocus onClick={onClose}>
              <Image
                src="/secret-feedback/Type=Close.png"
                alt=""
                width={24}
                height={24}
              />
            </button>
          </header>

          <section className="admin-secret-feedback-notice">
            <Image
              src="/secret-feedback/Type=Safe.png"
              alt=""
              width={20}
              height={20}
            />
            <div>
              <h3>시크릿 피드백</h3>
              <p>
                이 피드백은 오직 치카픽 서비스를 개선하기 위한 내부 자료로만
                활용됩니다. 불편하셨던 점, 아쉬웠던 점, 기대에 미치지 못했던 부분이
                있다면 솔직하게 알려주세요. 솔직한 의견이 더 나은 치카픽을 만드는 데
                가장 큰 도움이 됩니다.
              </p>
            </div>
          </section>

          <section className="admin-secret-feedback-detail-section">
            <h3>1. 전반적인 만족도를 알려주세요.</h3>
            <div className="admin-secret-feedback-rating-options">
              {secretFeedbackRatings.map((rating) => {
                const isSelected = rating.code === feedback.rating;
                return (
                  <div
                    key={rating.code}
                    className={isSelected ? "is-selected" : undefined}
                    aria-current={isSelected ? "true" : undefined}
                  >
                    <Image
                      src={rating.assetPath}
                      alt=""
                      width={33}
                      height={40}
                    />
                    <span>{rating.label}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="admin-secret-feedback-detail-section">
            <h3>2. 어떤 점이 가장 인상 깊었나요?</h3>
            <p>해당하는 항목을 모두 선택해주세요.</p>
            <div className="admin-secret-feedback-tags">
              {secretFeedbackImpressionTags.map((tag) => (
                <span
                  key={tag.code}
                  className={
                    feedback.impressionTags.includes(tag.code) ? "is-selected" : undefined
                  }
                >
                  {tag.label}
                </span>
              ))}
            </div>
          </section>

          <section className="admin-secret-feedback-detail-section">
            <div className="admin-secret-feedback-note-heading">
              <h3>3. 치카픽에 전하고 싶은 말씀</h3>
              <span>(선택)</span>
            </div>
            <p className="admin-secret-feedback-note">
              {feedback.privateNote || "작성된 내용이 없습니다."}
            </p>
          </section>
        </div>
      </aside>
    </div>
  );
}

function PartnerAccountSearchView({ accessToken }: { accessToken: string }) {
  const [email, setEmail] = useState("");
  const [searchedEmail, setSearchedEmail] = useState("");
  const [result, setResult] = useState<AdminPartnerAccountLookupPayload | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const runLookup = async ({
    lookupEmail,
    unmask,
  }: {
    lookupEmail: string;
    unmask: boolean;
  }) => {
    if (!accessToken || isLoading) return;
    const normalizedEmail = lookupEmail.trim();
    setIsLoading(true);
    setError("");
    try {
      const payload = await lookupAdminPartnerAccount(accessToken, {
        email: normalizedEmail,
        unmask,
      });
      setResult(payload);
      setSearchedEmail(normalizedEmail);
      setEmail(payload.account.email || normalizedEmail);
    } catch (lookupError) {
      setResult(null);
      if (isAdminApiNotFound(lookupError)) {
        setEmail("");
        setSearchedEmail("");
      } else {
        setError(
          lookupError instanceof Error
            ? lookupError.message
            : "파트너스 계정 조회에 실패했습니다.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const submitLookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const lookupEmail =
      result && email === result.account.email ? searchedEmail : email;
    void runLookup({ lookupEmail, unmask: false });
  };

  return (
    <section className="admin-partner-account-search-view">
      <form className="admin-partner-account-search-block" onSubmit={submitLookup}>
        <label htmlFor="partner-account-search-email">이메일</label>
        <input
          id="partner-account-search-email"
          required
          type="email"
          autoComplete="off"
          maxLength={320}
          placeholder="가입한 이메일을 입력해 주세요"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError("");
          }}
        />
        <button type="submit" disabled={isLoading || !email.trim()}>
          {isLoading && !result ? "조회 중" : "조회"}
        </button>
      </form>

      {error ? (
        <p className="admin-partner-account-search-error" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <section className="admin-partner-account-search-result" aria-live="polite">
          <header>
            <h2>검색 결과</h2>
            <button
              type="button"
              disabled={isLoading}
              onClick={() =>
                void runLookup({
                  lookupEmail: searchedEmail,
                  unmask: result.masked,
                })
              }
            >
              {isLoading
                ? "처리 중"
                : result.masked
                  ? "마스킹 해제"
                  : "마스킹 적용"}
            </button>
          </header>
          <PartnerAccountSearchResult account={result.account} />
        </section>
      ) : (
        <section className="admin-partner-account-search-empty" aria-live="polite">
          <span aria-hidden="true">
            <Image src="/Type=Question.svg" alt="" width={24} height={24} />
          </span>
          <p>조회된 계정이 없습니다.</p>
        </section>
      )}
    </section>
  );
}

function PartnerAccountSearchResult({
  account,
}: {
  account: AdminPartnerAccountLookupPayload["account"];
}) {
  const fields = [
    { label: "이메일", value: account.email || "-" },
    { label: "이름", value: account.fullName || "-" },
    { label: "전화번호", value: account.mobileNo || "-" },
    { label: "가입국가", value: partnerAccountCountryLabel(account.countryCode) },
    { label: "계정 상태", value: partnerAccountStatusLabel(account.status), status: true },
    { label: "생성 시간", value: formatPartnerAccountDate(account.createdAt) },
    { label: "마지막 접속 시간", value: formatPartnerAccountDate(account.lastActiveAt) },
    { label: "탈퇴 일시", value: formatPartnerAccountDate(account.withdrawnAt) },
    { label: "가족계정 등록 여부", value: account.family.registered ? "등록" : "미등록" },
    { label: "소속 병원", value: account.clinicName || "-" },
    { label: "분류", value: partnerAccountClassificationLabel(account.classification) },
  ];

  return (
    <dl>
      {fields.map((field) => (
        <div key={field.label}>
          <dt>{field.label}</dt>
          <dd>
            {field.status ? (
              <span className="admin-partner-account-search-status">{field.value}</span>
            ) : (
              field.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PartnerAccountsTab({ accessToken }: { accessToken: string }) {
  const [draftQuery, setDraftQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<AdminPartnerAccountsPayload | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [detail, setDetail] = useState<AdminPartnerAccountDetail | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState("");

  const loadDirectory = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");
    try {
      const payload = await searchAdminPartnerAccounts(accessToken, {
        query: appliedQuery,
        page: currentPage,
        pageSize: 10,
      });
      setData(payload);
      if (currentPage > payload.pagination.totalPages) {
        setCurrentPage(payload.pagination.totalPages);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "파트너스 계정 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, appliedQuery, currentPage]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadDirectory(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDirectory]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = draftQuery.trim();
    if (query === appliedQuery && currentPage === 1) {
      void loadDirectory();
      return;
    }
    setCurrentPage(1);
    setAppliedQuery(query);
  };

  const openDetail = async (userId: string) => {
    if (!accessToken || detailLoadingId) return;
    setDetail(null);
    setDetailError("");
    setDetailLoadingId(userId);
    try {
      const payload = await fetchAdminPartnerAccountDetail(accessToken, userId);
      setDetail(payload.account);
    } catch (loadError) {
      setDetailError(
        loadError instanceof Error
          ? loadError.message
          : "파트너스 계정 상세 정보를 불러오지 못했습니다.",
      );
    } finally {
      setDetailLoadingId(null);
    }
  };

  const pagination = data?.pagination;
  const pageNumbers = pagination
    ? dentalSalesPageNumbers(pagination.page, pagination.totalPages)
    : [];

  return (
    <section className="admin-partner-accounts">
      <form
        className="admin-partner-accounts-search"
        role="search"
        onSubmit={submitSearch}
      >
        <Image src="/Type=Search.svg" alt="" width={22} height={22} />
        <input
          type="search"
          aria-label="파트너스 계정 검색"
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
          placeholder="환자 이름 또는 전화번호 검색"
          autoComplete="off"
          maxLength={100}
        />
      </form>

      {error ? (
        <p className="admin-partner-accounts-error" role="alert">
          {error}
          <button type="button" onClick={() => void loadDirectory()}>
            다시 시도
          </button>
        </p>
      ) : null}

      <div className="admin-partner-accounts-table-scroll" aria-busy={isLoading}>
        <table className="admin-partner-accounts-table">
          <thead>
            <tr>
              <th>이메일</th>
              <th>이름</th>
              <th>소속 치과</th>
              <th>파트너 구분</th>
              <th>마지막 접속 시간</th>
              <th>상세 보기</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((account) => (
              <tr key={account.id}>
                <td>{account.email || "-"}</td>
                <td>{account.fullName || "-"}</td>
                <td>{account.clinicName || "-"}</td>
                <td>{partnerAccountClassificationLabel(account.classification)}</td>
                <td>{formatPartnerAccountDate(account.lastActiveAt)}</td>
                <td>
                  <button
                    type="button"
                    disabled={detailLoadingId !== null}
                    onClick={() => void openDetail(account.id)}
                  >
                    {detailLoadingId === account.id ? "조회 중" : "상세 보기"}
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && !error && (data?.items.length ?? 0) === 0 ? (
              <tr>
                <td className="admin-sales-empty" colSpan={6}>
                  검색 조건에 맞는 파트너스 계정이 없습니다.
                </td>
              </tr>
            ) : null}
            {isLoading && !data ? (
              <tr>
                <td className="admin-sales-empty" colSpan={6}>
                  파트너스 계정을 불러오는 중입니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <nav className="admin-sales-pagination" aria-label="파트너스 계정 목록 페이지">
          <button
            type="button"
            aria-label="이전 페이지"
            disabled={pagination.page <= 1 || isLoading}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            ‹
          </button>
          {pageNumbers.map((pageNumber) => (
            <button
              type="button"
              key={pageNumber}
              className={
                pageNumber === pagination.page ? "admin-sales-page-active" : undefined
              }
              aria-current={pageNumber === pagination.page ? "page" : undefined}
              disabled={isLoading}
              onClick={() => setCurrentPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            aria-label="다음 페이지"
            disabled={pagination.page >= pagination.totalPages || isLoading}
            onClick={() =>
              setCurrentPage((page) => Math.min(pagination.totalPages, page + 1))
            }
          >
            ›
          </button>
        </nav>
      ) : null}

      {detailError ? (
        <p className="admin-partner-accounts-error" role="alert">
          {detailError}
        </p>
      ) : null}

      {detail ? (
        <div className="admin-partner-account-detail-layer">
          <button
            type="button"
            className="admin-partner-account-detail-backdrop"
            aria-label="파트너스 계정 상세 닫기"
            onClick={() => setDetail(null)}
          />
          <aside
            className="admin-partner-account-detail"
            role="dialog"
            aria-modal="true"
            aria-labelledby="partner-account-detail-title"
          >
            <header>
              <div>
                <span>파트너스 계정</span>
                <h2 id="partner-account-detail-title">
                  {detail.fullName || detail.email || "계정 상세"}
                </h2>
              </div>
              <button type="button" aria-label="닫기" onClick={() => setDetail(null)}>
                ×
              </button>
            </header>
            <dl>
              <div><dt>이메일</dt><dd>{detail.email || "-"}</dd></div>
              <div><dt>이름</dt><dd>{detail.fullName || "-"}</dd></div>
              <div><dt>소속 치과</dt><dd>{detail.clinicName || "-"}</dd></div>
              <div><dt>파트너 구분</dt><dd>{partnerAccountClassificationLabel(detail.classification)}</dd></div>
              <div><dt>소속 상태</dt><dd>{partnerAccountMembershipStatusLabel(detail.membershipStatus)}</dd></div>
              <div><dt>로그인 수단</dt><dd>{partnerAccountLoginProviderLabel(detail.loginProvider)}</dd></div>
              <div><dt>계정 상태</dt><dd>{partnerAccountStatusLabel(detail.accountStatus)}</dd></div>
              <div><dt>마지막 접속 시간</dt><dd>{formatPartnerAccountDate(detail.lastActiveAt)}</dd></div>
              <div><dt>계정 생성 시간</dt><dd>{formatPartnerAccountDate(detail.joinedAt)}</dd></div>
              <div><dt>치과 소속 신청 시간</dt><dd>{formatPartnerAccountDate(detail.membershipJoinedAt)}</dd></div>
              <div><dt>면허 인증</dt><dd>{detail.licenseVerified ? "인증 완료" : "미인증"}</dd></div>
              <div><dt>휴대전화 인증</dt><dd>{detail.phoneVerified ? "인증 완료" : "미인증"}</dd></div>
              <div><dt>탈퇴 일시</dt><dd>{formatPartnerAccountDate(detail.withdrawnAt)}</dd></div>
            </dl>
          </aside>
        </div>
      ) : null}
    </section>
  );
}

function ChikapickAccountsTab({ accessToken }: { accessToken: string }) {
  const [email, setEmail] = useState("");
  const [searchedEmail, setSearchedEmail] = useState("");
  const [result, setResult] = useState<ChikapickAccountLookupPayload | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const runLookup = async ({
    clearResultOnError,
    lookupEmail,
    unmask,
  }: {
    clearResultOnError: boolean;
    lookupEmail: string;
    unmask: boolean;
  }) => {
    if (!accessToken || isLoading) return;
    setIsLoading(true);
    setError("");
    try {
      const payload = await lookupAdminChikapickAccount(accessToken, {
        email: lookupEmail.trim(),
        unmask,
      });
      setResult(payload);
      setSearchedEmail(lookupEmail.trim());
    } catch (lookupError) {
      if (clearResultOnError) setResult(null);
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "계정 조회에 실패했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const submitLookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runLookup({
      clearResultOnError: true,
      lookupEmail: email,
      unmask: false,
    });
  };

  return (
    <section className="admin-chikapick-account-lookup">
      <form className="admin-chikapick-account-search" onSubmit={submitLookup}>
        <label htmlFor="chikapick-account-email">이메일</label>
        <input
          id="chikapick-account-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="가입한 이메일을 입력해 주세요"
          autoComplete="off"
          maxLength={320}
          required
        />
        <button type="submit" disabled={isLoading || !email.trim()}>
          {isLoading && !result ? "조회 중" : "조회"}
        </button>
      </form>

      {error ? (
        <p className="admin-chikapick-account-error" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <section className="admin-chikapick-account-result" aria-live="polite">
          <header>
            <h2>검색 결과</h2>
            <button
              type="button"
              disabled={isLoading}
              onClick={() =>
                void runLookup({
                  clearResultOnError: false,
                  lookupEmail: searchedEmail,
                  unmask: result.masked,
                })
              }
            >
              {isLoading
                ? "처리 중"
                : result.masked
                  ? "마스킹 해제"
                  : "마스킹 적용"}
            </button>
          </header>
          <ChikapickAccountResultCard account={result.account} />
        </section>
      ) : null}
    </section>
  );
}

function ChikapickAccountResultCard({
  account,
}: {
  account: ChikapickAccountLookupPayload["account"];
}) {
  const family = account.family;
  const rows = [
    { label: "이메일", value: account.email || "-" },
    {
      label: "로그인 수단",
      value: chikapickLoginProviderLabel(account.loginProvider),
    },
    { label: "이름", value: account.fullName || "-" },
    { label: "전화번호", value: account.mobileNo || "-" },
    { label: "가입국가", value: chikapickCountryLabel(account.countryCode) },
    { label: "생성 시간", value: formatChikapickAccountDate(account.createdAt) },
    {
      label: "마지막 접속 시간",
      value: formatChikapickAccountDate(account.lastSignInAt),
    },
    { label: "탈퇴 일시", value: formatChikapickAccountDate(account.withdrawnAt) },
  ];

  return (
    <dl className="admin-chikapick-account-card">
      {rows.slice(0, 5).map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
      <div>
        <dt>계정 상태</dt>
        <dd>
          <span
            className={`admin-chikapick-account-status admin-chikapick-account-status--${chikapickAccountStatusTone(account.status)}`}
          >
            {chikapickAccountStatusLabel(account.status)}
          </span>
        </dd>
      </div>
      {rows.slice(5).map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
      <div className="admin-chikapick-account-family">
        <dt>가족계정 등록 여부</dt>
        <dd>
          {family.registered ? (
            <>
              <strong>등록됨 ({family.memberCount}인)</strong>
              {family.memberNames.length ? (
                <span>{family.memberNames.join(" , ")}</span>
              ) : null}
            </>
          ) : (
            "미등록"
          )}
        </dd>
      </div>
    </dl>
  );
}

function SalesPerformanceTab({
  accessToken,
  isSuperAdmin,
}: {
  accessToken: string;
  isSuperAdmin: boolean;
}) {
  const [draftFilters, setDraftFilters] = useState<SalesPerformanceFilters>(() =>
    defaultSalesPerformanceFilters(),
  );
  const [appliedFilters, setAppliedFilters] = useState<SalesPerformanceFilters>(
    () => defaultSalesPerformanceFilters(),
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<SalesPerformancePayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const monthOptions = useMemo(() => salesPerformanceMonthOptions(), []);

  const loadPerformance = useCallback(async () => {
    if (!isSuperAdmin || !accessToken) return;
    setIsLoading(true);
    setErrorMessage("");
    try {
      setData(
        await fetchAdminSalesPerformance(
          accessToken,
          appliedFilters,
          currentPage,
        ),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "영업 성과를 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, appliedFilters, currentPage, isSuperAdmin]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadPerformance(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadPerformance]);

  if (!isSuperAdmin) {
    return (
      <section className="admin-performance-permission" role="alert">
        <h2>권한 없음</h2>
        <p>영업 성과 관리는 Super Admin만 접근할 수 있습니다.</p>
      </section>
    );
  }

  const pageNumbers = dentalSalesPageNumbers(
    currentPage,
    data?.pagination.totalPages ?? 1,
  );

  function updateFilter<Key extends keyof SalesPerformanceFilters>(
    key: Key,
    value: SalesPerformanceFilters[Key],
  ) {
    setDraftFilters((filters) => ({ ...filters, [key]: value }));
  }

  function resetFilters() {
    const reset = defaultSalesPerformanceFilters();
    setDraftFilters(reset);
    setAppliedFilters(reset);
    setCurrentPage(1);
  }

  return (
    <section className="admin-performance" aria-busy={isLoading}>
      <form
        className="admin-sales-filters admin-performance-filters"
        onSubmit={(event) => {
          event.preventDefault();
          setAppliedFilters({ ...draftFilters });
          setCurrentPage(1);
        }}
      >
        <SalesFilterSelect
          label="연/월"
          value={draftFilters.month}
          options={monthOptions}
          onChange={(value) => updateFilter("month", value)}
        />
        <SalesFilterSelect
          label="담당자"
          value={draftFilters.salespersonId}
          options={[
            { value: "", label: "전체" },
            ...(data?.filterOptions.salespeople.map((person) => ({
              value: person.id,
              label: person.name,
            })) ?? []),
          ]}
          onChange={(value) => updateFilter("salespersonId", value)}
        />
        <SalesFilterSelect
          label="외부 연결자"
          value={draftFilters.externalConnectorId}
          options={[
            { value: "", label: "전체" },
            ...(data?.filterOptions.externalConnectors.map((person) => ({
              value: person.id,
              label: person.name,
            })) ?? []),
          ]}
          onChange={(value) => updateFilter("externalConnectorId", value)}
        />
        <label className="admin-sales-filter-field">
          <span>상태</span>
          <span className="admin-sales-select-wrap admin-performance-fixed-filter">
            <select value="SIGNED" disabled aria-label="상태">
              <option value="SIGNED">가입완료</option>
            </select>
          </span>
        </label>
        <SalesFilterSelect
          label="상세 상태"
          value={draftFilters.detailStatus}
          options={[
            { value: "ACTIVE", label: "사용중" },
            { value: "INFORMATION_MISSING", label: "정보 미입력" },
          ]}
          onChange={(value) =>
            updateFilter(
              "detailStatus",
              value as SalesPerformanceFilters["detailStatus"],
            )
          }
        />
        <button className="admin-sales-reset" type="button" onClick={resetFilters}>
          초기화
        </button>
        <button className="admin-sales-submit" type="submit" disabled={isLoading}>
          검색
        </button>
      </form>

      <div className="admin-performance-metrics" aria-label="영업 성과 요약">
        <PerformanceMetricCard
          label="담당자만 등록 수"
          value={data?.metrics.salespersonOnly ?? null}
        />
        <PerformanceMetricCard
          label="외부 연결자만 등록 수"
          value={data?.metrics.externalConnectorOnly ?? null}
        />
        <PerformanceMetricCard
          label="둘 다 지정된 수"
          value={data?.metrics.bothAssigned ?? null}
        />
      </div>

      {errorMessage ? (
        <div className="admin-sales-feedback admin-sales-feedback--error" role="alert">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => void loadPerformance()}>
            다시 시도
          </button>
        </div>
      ) : null}

      <div className="admin-performance-table-card">
        <header>
          총 {data ? `${data.pagination.totalItems.toLocaleString("ko-KR")}건` : "—"}
        </header>
        <div className="admin-sales-table-scroll admin-performance-table-scroll">
          <table className="admin-sales-table admin-performance-table">
            <colgroup>
              <col style={{ width: "16%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "17%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>담당자</th>
                <th>외부 연결자</th>
                <th>병원명</th>
                <th>상태</th>
                <th>상세 상태</th>
                <th>최종 상태 변경일</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && !errorMessage
                ? data?.items.map((row) => (
                    <tr key={row.id}>
                      <td>{row.salesperson?.name ?? "-"}</td>
                      <td>{row.externalConnector?.name ?? "-"}</td>
                      <td className="admin-sales-clinic-name">{row.clinicName}</td>
                      <td>가입완료</td>
                      <td>{salesPerformanceDetailLabel(row.detailStatus)}</td>
                      <td className="admin-performance-date">
                        {formatSalesPerformanceDate(row.lastStatusChangedAt)}
                      </td>
                    </tr>
                  ))
                : null}
              {isLoading ? (
                <tr>
                  <td className="admin-sales-empty" colSpan={6}>
                    영업 성과를 불러오는 중입니다.
                  </td>
                </tr>
              ) : null}
              {!isLoading && !errorMessage && (data?.items.length ?? 0) === 0 ? (
                <tr>
                  <td className="admin-sales-empty" colSpan={6}>
                    조건에 맞는 영업 성과가 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <nav className="admin-sales-pagination" aria-label="영업 성과 목록 페이지">
        <button
          type="button"
          aria-label="이전 페이지"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
        >
          ‹
        </button>
        {pageNumbers.map((page) => (
          <button
            type="button"
            key={page}
            className={currentPage === page ? "admin-sales-page-active" : undefined}
            aria-current={currentPage === page ? "page" : undefined}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          aria-label="다음 페이지"
          disabled={
            currentPage >= (data?.pagination.totalPages ?? 1) || isLoading
          }
          onClick={() =>
            setCurrentPage((page) =>
              Math.min(data?.pagination.totalPages ?? 1, page + 1),
            )
          }
        >
          ›
        </button>
      </nav>
    </section>
  );
}

function PerformanceMetricCard({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value?.toLocaleString("ko-KR") ?? "—"}</strong>
    </article>
  );
}

function DentalSalesInfoTooltip() {
  return (
    <div className="admin-sales-info">
      <button
        type="button"
        className="admin-sales-info-trigger"
        aria-label="치과 영업 상태 안내"
        aria-describedby="dental-sales-status-tooltip"
      >
        <Image src="/Type=Info.svg" alt="" width={16} height={16} />
      </button>
      <div
        id="dental-sales-status-tooltip"
        className="admin-sales-info-tooltip"
        role="tooltip"
      >
        <span>[상태]</span>
        <ul>
          <li>
            미방문 : 아직 방문 영업이 이루어지지 않은 병원입니다. 최초 방문 대상을
            선정할 때 활용하세요.
          </li>
          <li>
            방문 : 1회 이상 방문·상담 이력이 있지만, 아직 가입이 완료되지 않은
            병원입니다. 최근 방문 기록의 상세 상태를 함께 확인하세요.
          </li>
          <li>
            가입완료 : 파트너스 가입 및 병원 정보 설정을 모두 완료하여, 사용자 앱에
            제휴 치과로 노출되는 병원입니다. 영업 성과 집계에 포함됩니다.
          </li>
        </ul>
        <span>[상세 상태]</span>
        <ul>
          <li>
            관심/검토 : 병원이 서비스에 긍정적인 반응을 보이며 내부 검토 중인
            상태입니다. 후속 방문·자료 전달 일정이 필요합니다.
          </li>
          <li>
            코드 전달 : 초대코드 또는 가입 링크를 안내한 상태입니다. 코드 사용 여부와
            실제 가입 완료 여부를 추적하세요.
          </li>
          <li>
            거절 : 병원이 명확히 사용 계획이 없다고 답변한 상태입니다. 불필요한 추가
            방문을 줄이고, 사유를 데이터로 남겨주세요.
          </li>
          <li>
            보류 : 병원 사정으로 일정 기간 이후 재논의를 요청한 상태입니다. 재방문
            예정일을 함께 기록해두면 좋습니다.
          </li>
        </ul>
      </div>
    </div>
  );
}

function PartnerClinicsTab({
  accessToken,
  onSelectClinic,
  selectedClinicId,
}: {
  accessToken: string;
  onSelectClinic: (clinicId: string | null) => void;
  selectedClinicId: string | null;
}) {
  const [draftQuery, setDraftQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [listData, setListData] = useState<AdminPartnerClinicsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [detail, setDetail] = useState<AdminPartnerClinicDetailPayload | null>(null);
  const [detailClinicId, setDetailClinicId] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const loadClinics = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setErrorMessage("");
    try {
      const payload = await fetchAdminPartnerClinics(
        accessToken,
        appliedQuery,
        currentPage,
      );
      setListData(payload);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "파트너 치과 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, appliedQuery, currentPage]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadClinics(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadClinics]);

  const loadDetail = useCallback(async () => {
    if (!accessToken || !selectedClinicId) return;
    setIsDetailLoading(true);
    setDetailError("");
    try {
      setDetail(await fetchAdminPartnerClinicDetail(accessToken, selectedClinicId));
      setDetailClinicId(selectedClinicId);
    } catch (error) {
      setDetailError(
        error instanceof Error
          ? error.message
          : "파트너 치과 상세 정보를 불러오지 못했습니다.",
      );
    } finally {
      setIsDetailLoading(false);
    }
  }, [accessToken, selectedClinicId]);

  useEffect(() => {
    if (!selectedClinicId) return;
    const timeoutId = window.setTimeout(() => void loadDetail(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDetail, selectedClinicId]);

  useEffect(() => {
    if (!selectedClinicId) return;
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadDetail();
    }, 60_000);
    return () => window.clearInterval(intervalId);
  }, [loadDetail, selectedClinicId]);

  const pagination = listData?.pagination;
  const pageNumbers = dentalSalesPageNumbers(
    pagination?.page ?? currentPage,
    pagination?.totalPages ?? 1,
  );

  if (selectedClinicId) {
    return (
      <PartnerClinicDetailPage
        accessToken={accessToken}
        clinicId={selectedClinicId}
        detail={detailClinicId === selectedClinicId ? detail : null}
        detailError={detailError}
        isDetailLoading={isDetailLoading}
        onBack={() => onSelectClinic(null)}
        onRetry={() => void loadDetail()}
        onSaved={() => void loadDetail()}
      />
    );
  }

  return (
    <>
      <form
        className="admin-partner-clinics-filter"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          setCurrentPage(1);
          setAppliedQuery(draftQuery.trim());
        }}
      >
        <label className="admin-partner-clinics-search">
          <span className="admin-visually-hidden">파트너 치과 검색</span>
          <span className="admin-sales-search-icon" aria-hidden="true" />
          <input
            type="search"
            value={draftQuery}
            placeholder="치과명, 주소, 전화번호, 대표자 검색"
            onChange={(event) => setDraftQuery(event.target.value)}
          />
        </label>
        <button type="submit">검색</button>
      </form>

      {errorMessage ? (
        <div className="admin-sales-feedback admin-sales-feedback--error" role="alert">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => void loadClinics()}>
            다시 시도
          </button>
        </div>
      ) : null}

      {detailError ? (
        <div className="admin-sales-feedback admin-sales-feedback--error" role="alert">
          <span>{detailError}</span>
          <button type="button" onClick={() => setDetailError("")}>
            닫기
          </button>
        </div>
      ) : null}

      <div className="admin-partner-clinics-table-scroll" aria-busy={isLoading}>
        <table className="admin-partner-clinics-table">
          <colgroup>
            <col className="admin-partner-clinics-col-hospital" />
            <col className="admin-partner-clinics-col-phone" />
            <col className="admin-partner-clinics-col-owner" />
            <col className="admin-partner-clinics-col-count" />
            <col className="admin-partner-clinics-col-count" />
            <col className="admin-partner-clinics-col-activity" />
            <col className="admin-partner-clinics-col-date" />
            <col className="admin-partner-clinics-col-action" />
          </colgroup>
          <thead>
            <tr>
              <th>병원</th>
              <th>연락처</th>
              <th>대표자명</th>
              <th>의사 수</th>
              <th>직원 수</th>
              <th>최근 활동 여부</th>
              <th>등록일</th>
              <th aria-label="상세보기" />
            </tr>
          </thead>
          <tbody>
            {listData?.items.map((clinic) => (
              <tr key={clinic.id}>
                <td>
                  <strong>{clinic.name}</strong>
                  <span title={clinic.address ?? undefined}>
                    {clinic.address ?? "주소 없음"}
                  </span>
                </td>
                <td>{clinic.phone ?? "-"}</td>
                <td>{clinic.representativeName ?? "-"}</td>
                <td>{clinic.doctorCount}</td>
                <td>{clinic.staffCount}</td>
                <td>{partnerClinicActivityLabel(clinic.lastActiveAt)}</td>
                <td>{partnerClinicRegistrationLabel(clinic.createdAt)}</td>
                <td className="admin-partner-clinics-action-cell">
                  <button
                    className="admin-sales-detail-button"
                    type="button"
                    onClick={() => onSelectClinic(clinic.id)}
                  >
                    상세보기
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && (listData?.items.length ?? 0) === 0 ? (
              <tr>
                <td className="admin-sales-empty" colSpan={8}>
                  검색 조건에 맞는 파트너 치과가 없습니다.
                </td>
              </tr>
            ) : null}
            {isLoading && !listData ? (
              <tr>
                <td className="admin-sales-empty" colSpan={8}>
                  파트너 치과를 불러오는 중입니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pagination ? (
        <nav className="admin-sales-pagination" aria-label="파트너 치과 목록 페이지">
          <button
            type="button"
            aria-label="이전 페이지"
            disabled={pagination.page <= 1 || isLoading}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            ‹
          </button>
          {pageNumbers.map((pageNumber) => (
            <button
              type="button"
              key={pageNumber}
              className={
                pageNumber === pagination.page ? "admin-sales-page-active" : undefined
              }
              aria-current={pageNumber === pagination.page ? "page" : undefined}
              disabled={isLoading}
              onClick={() => setCurrentPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            aria-label="다음 페이지"
            disabled={pagination.page >= pagination.totalPages || isLoading}
            onClick={() =>
              setCurrentPage((page) => Math.min(pagination.totalPages, page + 1))
            }
          >
            ›
          </button>
        </nav>
      ) : null}

    </>
  );
}

function PartnerClinicDetailPage({
  accessToken,
  clinicId,
  detail,
  detailError,
  isDetailLoading,
  onBack,
  onRetry,
  onSaved,
}: {
  accessToken: string;
  clinicId: string;
  detail: AdminPartnerClinicDetailPayload | null;
  detailError: string;
  isDetailLoading: boolean;
  onBack: () => void;
  onRetry: () => void;
  onSaved: () => void;
}) {
  const [isHospitalReviewOpen, setIsHospitalReviewOpen] = useState(false);
  const [isOperationDialogOpen, setIsOperationDialogOpen] = useState(false);
  const [isOperationSaving, setIsOperationSaving] = useState(false);
  const [isOperatorSaving, setIsOperatorSaving] = useState(false);
  const [operationError, setOperationError] = useState("");
  const [operationForm, setOperationForm] = useState({
    type: "operation_memo" as "operation_memo" | "support_history",
    content: "",
    occurredAt: localDateTimeValue(new Date()),
    resolvedAt: "",
    resolvedByAdminUserId: "",
  });
  const reviewButtonRef = useRef<HTMLButtonElement>(null);
  const reviewCloseButtonRef = useRef<HTMLButtonElement>(null);
  const operationButtonRef = useRef<HTMLButtonElement>(null);
  const operationCloseButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isHospitalReviewOpen) return;
    const previousOverflow = document.body.style.overflow;
    const reviewButton = reviewButtonRef.current;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(
      () => reviewCloseButtonRef.current?.focus(),
      0,
    );
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      reviewButton?.focus();
    };
  }, [isHospitalReviewOpen]);

  useEffect(() => {
    if (!isOperationDialogOpen) return;
    const previousOverflow = document.body.style.overflow;
    const operationButton = operationButtonRef.current;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(
      () => operationCloseButtonRef.current?.focus(),
      0,
    );
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      operationButton?.focus();
    };
  }, [isOperationDialogOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (isHospitalReviewOpen) setIsHospitalReviewOpen(false);
      else if (isOperationDialogOpen) setIsOperationDialogOpen(false);
      else onBack();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isHospitalReviewOpen, isOperationDialogOpen, onBack]);

  async function saveOperator(assignedOperatorUserId: string) {
    setIsOperatorSaving(true);
    setOperationError("");
    try {
      await assignAdminPartnerClinicOperator(
        accessToken,
        clinicId,
        assignedOperatorUserId || null,
      );
      onSaved();
    } catch (error) {
      setOperationError(
        error instanceof Error ? error.message : "담당 운영자를 변경하지 못했습니다.",
      );
    } finally {
      setIsOperatorSaving(false);
    }
  }

  async function saveOperationEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!operationForm.content.trim()) return;
    setIsOperationSaving(true);
    setOperationError("");
    try {
      await createAdminPartnerClinicOperationEvent(accessToken, clinicId, {
        type: operationForm.type,
        content: operationForm.content.trim(),
        occurredAt: new Date(operationForm.occurredAt).toISOString(),
        resolvedAt:
          operationForm.type === "support_history" && operationForm.resolvedAt
            ? new Date(operationForm.resolvedAt).toISOString()
            : null,
        resolvedByAdminUserId:
          operationForm.type === "support_history"
            ? operationForm.resolvedByAdminUserId || null
            : null,
      });
      setOperationForm({
        type: "operation_memo",
        content: "",
        occurredAt: localDateTimeValue(new Date()),
        resolvedAt: "",
        resolvedByAdminUserId: "",
      });
      setIsOperationDialogOpen(false);
      onSaved();
    } catch (error) {
      setOperationError(
        error instanceof Error ? error.message : "운영 이력을 저장하지 못했습니다.",
      );
    } finally {
      setIsOperationSaving(false);
    }
  }

  function keepModalFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusableElements = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])',
      ),
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);
    if (!firstElement || !lastElement) return;
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  if (isDetailLoading && !detail) {
    return (
      <section className="admin-sales-detail-state" aria-live="polite">
        <p>파트너 치과 상세 정보를 불러오는 중입니다.</p>
      </section>
    );
  }

  if (detailError && !detail) {
    return (
      <section className="admin-sales-detail-state" role="alert">
        <p>{detailError}</p>
        <div>
          <button type="button" onClick={onBack}>목록으로</button>
          <button type="button" onClick={onRetry}>다시 시도</button>
        </div>
      </section>
    );
  }

  if (!detail) return null;

  const { clinic, hospitalInformation, metrics } = detail;
  const consultationDuration = partnerClinicDurationLabel(
    metrics.consultations.averageResponseMinutes,
  );
  const resultDuration = partnerClinicDurationLabel(
    metrics.resultRecords.averageResponseMinutes,
  );
  const reservationDuration = partnerClinicDurationLabel(
    metrics.reservations.averageConfirmationMinutes,
  );
  const reservationModificationDuration = partnerClinicDurationLabel(
    metrics.reservations.averageModificationMinutes,
  );
  const completion = hospitalInformation.completion;
  const reservationTotal = Math.max(metrics.reservations.requests, 1);
  const trendMaximum = Math.max(
    1,
    ...metrics.instantBookings.monthlyTrend.map((item) => item.count),
  );

  return (
    <article className="admin-partner-detail-page">
      <section className="admin-partner-detail-summary-card">
        <header>
          <Image
            className="admin-partner-detail-hospital-icon"
            src="/Type=Hospital.svg"
            alt=""
            width={24}
            height={24}
          />
          <h1>{clinic.name}</h1>
        </header>
        <div className="admin-partner-detail-summary-grid">
          <dl>
            <PartnerClinicSummaryRow label="대표 주소" value={clinic.address ?? "-"} />
            <PartnerClinicSummaryRow label="연락처" value={clinic.phone ?? "-"} />
            <PartnerClinicSummaryRow
              label="대표자명"
              value={clinic.representativeName ?? "-"}
            />
          </dl>
          <dl>
            <PartnerClinicSummaryRow
              label="소속 계정 수"
              value={`${formatPartnerMetric(clinic.memberCount)} 명`}
              strong
            />
            <PartnerClinicSummaryRow
              label="소속 직원 수"
              value={`${formatPartnerMetric(clinic.staffCount)} 명`}
              strong
            />
            <div>
              <dt>담당 운영자</dt>
              <dd className="is-strong admin-partner-operator-control">
                {detail.canManageOperations ? (
                  <select
                    aria-label="담당 운영자"
                    disabled={isOperatorSaving}
                    value={detail.operations.assignedOperator?.id ?? ""}
                    onChange={(event) => void saveOperator(event.target.value)}
                  >
                    <option value="">미지정</option>
                    {detail.operations.operatorOptions.map((operator) => (
                      <option key={operator.id} value={operator.id}>
                        {operator.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  detail.operations.assignedOperator?.name ?? "미지정"
                )}
              </dd>
            </div>
          </dl>
          <dl>
            <PartnerClinicSummaryRow
              label="최근 활동일"
              value={partnerClinicDateLabel(clinic.lastActiveAt)}
            />
            <PartnerClinicSummaryRow
              label="등록 일시"
              value={partnerClinicRegistrationLabel(clinic.createdAt)}
            />
          </dl>
        </div>
      </section>

      <section className="admin-partner-detail-metric-grid" aria-label="파트너 치과 주요 지표">
        <PartnerClinicMetricCard
          label="누적 전문의 소견 요청 수"
          value={metrics.consultations.requests}
          unit="건"
        />
        <PartnerClinicMetricCard
          label="누적 전문의 소견 답변 수"
          value={metrics.consultations.responses}
          unit={`건 (답변율 ${partnerClinicResponseRate(
            metrics.consultations.requests,
            metrics.consultations.responses,
          )})`}
        />
        <PartnerClinicMetricCard
          label="전문의 소견 평균 답변 속도"
          value={consultationDuration.value}
          unit={consultationDuration.unit}
        />
        <PartnerClinicMetricCard
          label="누적 병원 결과 기록 답변 수"
          value={metrics.resultRecords.responses}
          unit="건"
        />
        <PartnerClinicMetricCard
          label="병원 결과 기록 평균 답변 속도"
          value={resultDuration.value}
          unit={resultDuration.unit}
        />
        <PartnerClinicMetricCard
          label="누적 예약 요청 수"
          value={metrics.reservations.requests}
          unit="건"
        />
        <PartnerClinicMetricCard
          label="예약 확정 평균 처리 속도"
          value={reservationDuration.value}
          unit={reservationDuration.unit}
        />
        <PartnerClinicMetricCard
          label="즉시 예약 등록 월간 사용 횟수"
          value={metrics.instantBookings.monthlySlotRegistrations}
          unit="회"
        />
        <PartnerClinicMetricCard
          label="즉시 예약으로 예약된 건수"
          value={metrics.instantBookings.totalBookings}
          unit="건"
        />
      </section>

      <div className="admin-partner-detail-two-column admin-partner-detail-two-column--compact">
        <section className="admin-partner-detail-section-card">
          <PartnerClinicSectionHeading title="전문의 소견 현황" badge="실시간 업데이트" />
          <div className="admin-partner-detail-status-grid">
            <PartnerClinicStatusValue
              label="누적 요청 / 답변"
              value={`${formatPartnerMetric(metrics.consultations.requests)} / ${formatPartnerMetric(metrics.consultations.responses)} 건`}
            />
            <PartnerClinicStatusValue
              label="미답변"
              value={`${formatPartnerMetric(metrics.consultations.unanswered)} 건`}
            />
            <PartnerClinicStatusValue
              label="평균 속도"
              value={`${consultationDuration.value}${consultationDuration.unit ? ` ${consultationDuration.unit}` : ""}`}
            />
            <PartnerClinicStatusValue
              label="최근 30일"
              value={`${formatPartnerMetric(metrics.consultations.recent30Days)} 건`}
            />
          </div>
        </section>

        <section className="admin-partner-detail-section-card">
          <PartnerClinicSectionHeading title="병원 결과 기록 현황" badge="기록 동기화" />
          <div className="admin-partner-detail-status-grid">
            <PartnerClinicStatusValue
              label="누적 요청 / 답변"
              value={`${formatPartnerMetric(metrics.resultRecords.requests)} / ${formatPartnerMetric(metrics.resultRecords.responses)} 건`}
            />
            <PartnerClinicStatusValue
              label="미답변"
              value={`${formatPartnerMetric(metrics.resultRecords.unanswered)} 건`}
            />
            <PartnerClinicStatusValue
              label="평균 속도"
              value={`${resultDuration.value}${resultDuration.unit ? ` ${resultDuration.unit}` : ""}`}
            />
            <PartnerClinicStatusValue
              label="최근 30일"
              value={`${formatPartnerMetric(metrics.resultRecords.recent30Days)} 건`}
            />
          </div>
        </section>
      </div>

      <div className="admin-partner-detail-two-column">
        <section className="admin-partner-detail-section-card admin-partner-detail-reservations">
          <PartnerClinicSectionHeading title="예약 관리 현황" badge="실시간 예약 연동" />
          <div className="admin-partner-detail-reservation-grid">
            <PartnerClinicStatusValue
              label="누적 요청"
              value={`${formatPartnerMetric(metrics.reservations.requests)}건`}
            />
            <PartnerClinicStatusValue
              label="예약 확정"
              value={`${formatPartnerMetric(metrics.reservations.confirmed)}건`}
              tone="blue"
            />
            <PartnerClinicStatusValue
              label="예약 취소"
              value={`${formatPartnerMetric(metrics.reservations.cancelled)}건`}
              tone="red"
            />
            <PartnerClinicStatusValue
              label="진행 중"
              value={`${formatPartnerMetric(metrics.reservations.inProgress)}건`}
              tone="orange"
            />
            <PartnerClinicStatusValue
              label="확정 처리 속도"
              value={`${reservationDuration.value}${reservationDuration.unit}`}
            />
            <PartnerClinicStatusValue
              label="수정 처리 속도"
              value={`${reservationModificationDuration.value}${reservationModificationDuration.unit}`}
            />
            <PartnerClinicStatusValue
              label="최근 30일 요청"
              value={`${formatPartnerMetric(metrics.reservations.recent30Days)}건`}
            />
          </div>
          <div className="admin-partner-detail-ratio">
            <strong>예약 상태 비율</strong>
            <span aria-hidden="true">
              <i
                className="is-confirmed"
                style={{
                  width: `${(metrics.reservations.confirmed / reservationTotal) * 100}%`,
                }}
              />
              <i
                className="is-cancelled"
                style={{
                  width: `${(metrics.reservations.cancelled / reservationTotal) * 100}%`,
                }}
              />
              <i
                className="is-progress"
                style={{
                  width: `${(metrics.reservations.inProgress / reservationTotal) * 100}%`,
                }}
              />
            </span>
            <div>
              <em className="is-confirmed">확정 {formatPartnerMetric(metrics.reservations.confirmed)}건</em>
              <em className="is-cancelled">취소 {formatPartnerMetric(metrics.reservations.cancelled)}건</em>
              <em className="is-progress">진행 중 {formatPartnerMetric(metrics.reservations.inProgress)}건</em>
            </div>
          </div>
        </section>

        <section className="admin-partner-detail-section-card admin-partner-detail-instant">
          <PartnerClinicSectionHeading
            title="즉시 예약 관리 현황"
            badge={
              metrics.instantBookings.hasAvailableFutureSlots
                ? "활성 상태"
                : "비활성 상태"
            }
            tone={metrics.instantBookings.hasAvailableFutureSlots ? "green" : undefined}
          />
          <div className="admin-partner-detail-instant-grid">
            <PartnerClinicStatusValue
              label="이번 달 등록 횟수"
              value={`${formatPartnerMetric(metrics.instantBookings.monthlySlotRegistrations)}회`}
            />
            <PartnerClinicStatusValue
              label="누적 즉시 예약 건수"
              value={`${formatPartnerMetric(metrics.instantBookings.totalBookings)}건`}
            />
            <PartnerClinicStatusValue
              label="최근 등록일"
              value={partnerClinicDateLabel(metrics.instantBookings.latestRegistrationAt)}
            />
            <PartnerClinicStatusValue
              label="3개월 등록 추이"
              value={metrics.instantBookings.monthlyTrend
                .map((item) => `${Number(item.month.slice(5))}월 ${formatPartnerMetric(item.count)}`)
                .join("  ") || "-"}
            />
          </div>
          <div className="admin-partner-detail-trend">
            <strong>최근 3개월 이용 트렌드</strong>
            <div>
              {metrics.instantBookings.monthlyTrend.map((item, index) => (
                <span key={item.month}>
                  <i
                    className={
                      index === metrics.instantBookings.monthlyTrend.length - 1
                        ? "is-current"
                        : undefined
                    }
                    style={{ height: `${16 + (item.count / trendMaximum) * 28}px` }}
                  />
                  <small>{Number(item.month.slice(5))}월</small>
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="admin-partner-detail-two-column">
        <section className="admin-partner-detail-section-card admin-partner-detail-completion">
          <header>
            <h2>필수 정보 입력 상태</h2>
            <p>
              치과에서 입력한 필수 정보를 검토하고 사용자 앱 노출 상태를 확인할 수
              있습니다.
            </p>
          </header>
          <dl>
            <div>
              <dt>최근 정보 수정일</dt>
              <dd>{partnerClinicDateLabel(hospitalInformation.updated_at)}</dd>
            </div>
          </dl>
          <div className="admin-partner-detail-completion-progress">
            <span>정보 관리 완료율</span>
            <strong>{completion.percentage}%</strong>
            <div aria-hidden="true">
              <i style={{ width: `${completion.percentage}%` }} />
            </div>
          </div>
          <button
            ref={reviewButtonRef}
            type="button"
            onClick={() => setIsHospitalReviewOpen(true)}
          >
            등록 정보 검토하기
          </button>
          <div className="admin-partner-detail-visibility">
            <span>
              <strong>앱 노출 승인</strong>
              <small>현재 사용자 앱의 치과 정보 노출 상태입니다</small>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={clinic.isAppVisible}
              aria-label="앱 노출 승인 상태"
              className={clinic.isAppVisible ? "is-active" : undefined}
              disabled
            >
              <i />
            </button>
          </div>
        </section>

        <section className="admin-partner-detail-section-card admin-partner-detail-feedback">
          <PartnerClinicSectionHeading
            title={`사용자 피드백 (누적 ${formatPartnerMetric(metrics.feedback.total)}건)`}
            badge={`최근 30일 ${formatPartnerMetric(metrics.feedback.recent30Days)}건`}
          />
          <div className="admin-partner-detail-feedback-table">
            <div className="is-header">
              <span>작성일</span>
              <span>만족도</span>
            </div>
            {metrics.feedback.items.length ? (
              metrics.feedback.items.map((item) => (
                <div key={item.id}>
                  <span>{partnerClinicDateLabel(item.submittedAt).slice(2)}</span>
                  <strong className={`is-${item.rating}`}>
                    {partnerClinicRatingLabel(item.rating)}
                  </strong>
                </div>
              ))
            ) : (
              <p>아직 제출된 사용자 피드백이 없습니다.</p>
            )}
          </div>
        </section>
      </div>

      <section className="admin-partner-detail-section-card admin-partner-detail-notes">
        <div className="admin-partner-operation-heading">
          <PartnerClinicSectionHeading title="운영 메모 및 지원 이력" />
          <button
            ref={operationButtonRef}
            type="button"
            onClick={() => setIsOperationDialogOpen(true)}
          >
            메모 추가
          </button>
        </div>
        {operationError ? <p role="alert">{operationError}</p> : null}
        {detail.operations.events.length ? (
          <ol className="admin-partner-operation-events">
            {detail.operations.events.map((event) => (
              <li key={event.id}>
                <strong>
                  {event.type === "operation_memo" ? "[운영 메모]" : "[지원 요청 이력]"}
                </strong>
                <p>{event.content}</p>
                <small>
                  {partnerClinicRegistrationLabel(event.occurredAt)} · {event.createdBy.name}
                  {event.resolvedAt && event.resolvedBy
                    ? ` · 최종 처리 ${partnerClinicRegistrationLabel(event.resolvedAt)} / ${event.resolvedBy.name}`
                    : ""}
                </small>
              </li>
            ))}
          </ol>
        ) : (
          <div>
            <strong>등록된 운영 메모가 없습니다.</strong>
            <p>메모 추가 버튼으로 운영 메모와 지원 이력을 등록할 수 있습니다.</p>
          </div>
        )}
      </section>

      {isOperationDialogOpen ? (
        <div className="admin-account-dialog-layer">
          <button
            type="button"
            className="admin-account-dialog-backdrop"
            aria-label="운영 이력 등록 닫기"
            onClick={() => setIsOperationDialogOpen(false)}
          />
          <div
            className="admin-account-dialog admin-partner-operation-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-partner-operation-dialog-title"
            onKeyDown={keepModalFocus}
          >
            <header>
              <h2 id="admin-partner-operation-dialog-title">운영 이력 등록</h2>
              <button
                ref={operationCloseButtonRef}
                type="button"
                aria-label="닫기"
                onClick={() => setIsOperationDialogOpen(false)}
              >
                ×
              </button>
            </header>
            <form onSubmit={saveOperationEvent}>
              <label>
                <span>유형</span>
                <select
                  value={operationForm.type}
                  onChange={(event) =>
                    setOperationForm((form) => ({
                      ...form,
                      type: event.target.value as typeof form.type,
                      resolvedAt: "",
                      resolvedByAdminUserId: "",
                    }))
                  }
                >
                  <option value="operation_memo">운영 메모</option>
                  <option value="support_history">지원 요청 이력</option>
                </select>
              </label>
              <label>
                <span>발생 일시</span>
                <input
                  type="datetime-local"
                  required
                  value={operationForm.occurredAt}
                  onChange={(event) =>
                    setOperationForm((form) => ({
                      ...form,
                      occurredAt: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>내용</span>
                <textarea
                  required
                  maxLength={2000}
                  value={operationForm.content}
                  onChange={(event) =>
                    setOperationForm((form) => ({
                      ...form,
                      content: event.target.value,
                    }))
                  }
                />
              </label>
              {operationForm.type === "support_history" ? (
                <>
                  <label>
                    <span>최종 처리 일시 (선택)</span>
                    <input
                      type="datetime-local"
                      value={operationForm.resolvedAt}
                      onChange={(event) =>
                        setOperationForm((form) => ({
                          ...form,
                          resolvedAt: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>처리 담당자</span>
                    <select
                      disabled={!operationForm.resolvedAt}
                      required={!!operationForm.resolvedAt}
                      value={operationForm.resolvedByAdminUserId}
                      onChange={(event) =>
                        setOperationForm((form) => ({
                          ...form,
                          resolvedByAdminUserId: event.target.value,
                        }))
                      }
                    >
                      <option value="">선택</option>
                      {detail.operations.operatorOptions.map((operator) => (
                        <option key={operator.id} value={operator.id}>
                          {operator.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}
              {operationError ? <p role="alert">{operationError}</p> : null}
              <footer>
                <button type="button" onClick={() => setIsOperationDialogOpen(false)}>
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isOperationSaving || !operationForm.content.trim()}
                >
                  {isOperationSaving ? "저장 중" : "저장"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}

      {isHospitalReviewOpen ? (
        <HospitalInformationReviewModal
          closeButtonRef={reviewCloseButtonRef}
          information={hospitalInformation}
          onClose={() => setIsHospitalReviewOpen(false)}
          onKeyDown={keepModalFocus}
        />
      ) : null}
    </article>
  );
}

function PartnerClinicSummaryRow({
  label,
  strong = false,
  value,
}: {
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={strong ? "is-strong" : undefined} title={value}>{value}</dd>
    </div>
  );
}

function PartnerClinicMetricCard({
  label,
  unit,
  value,
}: {
  label: string;
  unit: string;
  value: number | string;
}) {
  return (
    <article>
      <p>{label}</p>
      <div>
        <strong>{typeof value === "number" ? formatPartnerMetric(value) : value}</strong>
        {unit ? <span>{unit}</span> : null}
      </div>
    </article>
  );
}

function PartnerClinicSectionHeading({
  badge,
  title,
  tone = "blue",
}: {
  badge?: string;
  title: string;
  tone?: "blue" | "green";
}) {
  return (
    <header className="admin-partner-detail-section-heading">
      <h2>{title}</h2>
      {badge ? <span className={`is-${tone}`}>{badge}</span> : null}
    </header>
  );
}

function PartnerClinicStatusValue({
  label,
  tone,
  value,
}: {
  label: string;
  tone?: "blue" | "red" | "orange";
  value: string;
}) {
  return (
    <div>
      <span>{label}</span>
      <strong className={tone ? `is-${tone}` : undefined}>{value}</strong>
    </div>
  );
}

function formatPartnerMetric(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function DentalSalesTab({
  accessToken,
  onSelectProfile,
  selectedProfileId,
}: {
  accessToken: string;
  onSelectProfile: (profileId: string | null) => void;
  selectedProfileId: string | null;
}) {
  const [draftFilters, setDraftFilters] = useState<DentalSalesFilters>({
    ...emptyDentalSalesFilters,
  });
  const [appliedFilters, setAppliedFilters] = useState<DentalSalesFilters>({
    ...emptyDentalSalesFilters,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [listData, setListData] = useState<DentalSalesListPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState(false);
  const [detail, setDetail] = useState<DentalSalesDetailPayload | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [isSavingBusinessFile, setIsSavingBusinessFile] = useState(false);
  const [isSavingVisit, setIsSavingVisit] = useState(false);
  const [isAssignmentEditing, setIsAssignmentEditing] = useState(false);
  const [isHospitalReviewOpen, setIsHospitalReviewOpen] = useState(false);
  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false);
  const [businessFileName, setBusinessFileName] = useState("");
  const [businessFileError, setBusinessFileError] = useState("");
  const [visitAttachments, setVisitAttachments] = useState<File[]>([]);
  const [visitAttachmentError, setVisitAttachmentError] = useState("");
  const [visitPage, setVisitPage] = useState(1);
  const [visitForm, setVisitForm] = useState<DentalSalesVisitForm>(() => ({
    title: "",
    visitedAt: localDateTimeValue(new Date()),
    salespersonUserId: "",
    detailStatus: "INTEREST",
    note: "",
  }));

  const loadList = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setErrorMessage("");
    try {
      setListData(await fetchAdminDentalSales(accessToken, appliedFilters, currentPage));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "치과 영업 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, appliedFilters, currentPage]);

  const loadDetail = useCallback(async (page = visitPage) => {
    if (!accessToken || !selectedProfileId) return;
    setIsDetailLoading(true);
    setDetailError("");
    try {
      const payload = await fetchAdminDentalSalesDetail(
        accessToken,
        selectedProfileId,
        page,
      );
      setDetail(payload);
      setVisitForm((form) => ({
        ...form,
        salespersonUserId:
          form.salespersonUserId || payload.profile.assignedSalesperson?.id || "",
        detailStatus: isDentalSalesVisitDetailStatus(payload.profile.detailStatus)
          ? payload.profile.detailStatus
          : form.detailStatus,
      }));
    } catch (error) {
      setDetailError(
        error instanceof Error ? error.message : "영업 상세 정보를 불러오지 못했습니다.",
      );
    } finally {
      setIsDetailLoading(false);
    }
  }, [accessToken, selectedProfileId, visitPage]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadList(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadList]);

  useEffect(() => {
    if (!selectedProfileId) return;
    const timeoutId = window.setTimeout(() => void loadDetail(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDetail, selectedProfileId]);

  useEffect(() => {
    if (!selectedProfileId) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isHospitalReviewOpen) {
          setIsHospitalReviewOpen(false);
          return;
        }
        if (isVisitFormOpen) {
          setIsVisitFormOpen(false);
          setVisitAttachments([]);
          setVisitAttachmentError("");
          return;
        }
        if (isAssignmentEditing) {
          setIsAssignmentEditing(false);
          return;
        }
        setIsAssignmentEditing(false);
        setBusinessFileName("");
        setBusinessFileError("");
        onSelectProfile(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    isAssignmentEditing,
    isHospitalReviewOpen,
    isVisitFormOpen,
    onSelectProfile,
    selectedProfileId,
  ]);

  const pageNumbers = dentalSalesPageNumbers(
    listData?.pagination.page ?? 1,
    listData?.pagination.totalPages ?? 1,
  );

  function updateFilter<Key extends keyof DentalSalesFilters>(
    key: Key,
    value: DentalSalesFilters[Key],
  ) {
    setDraftFilters((filters) => ({ ...filters, [key]: value }));
  }

  function resetFilters() {
    setDraftFilters({ ...emptyDentalSalesFilters });
    setAppliedFilters({ ...emptyDentalSalesFilters });
    setCurrentPage(1);
  }

  async function copyInviteCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setCopyFailed(false);
      window.setTimeout(() => setCopiedCode(null), 1600);
    } catch {
      setCopiedCode(null);
      setCopyFailed(true);
      window.setTimeout(() => setCopyFailed(false), 1600);
    }
  }

  async function saveAssignment(
    salespersonUserId: string,
    externalConnectorId: string,
  ) {
    if (!selectedProfileId) return;
    setIsSavingAssignment(true);
    setActionMessage("");
    try {
      const result = await assignAdminDentalSalesperson(
        accessToken,
        selectedProfileId,
        salespersonUserId || null,
        externalConnectorId || null,
      );
      setActionMessage(result.message);
      setVisitForm((form) => ({ ...form, salespersonUserId }));
      await Promise.all([loadDetail(), loadList()]);
      setIsAssignmentEditing(false);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "담당자를 변경하지 못했습니다.");
    } finally {
      setIsSavingAssignment(false);
    }
  }

  async function saveVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProfileId || !visitForm.salespersonUserId || !visitForm.title.trim()) return;
    setIsSavingVisit(true);
    setActionMessage("");
    try {
      const result = await createAdminDentalSalesVisit(accessToken, selectedProfileId, {
        visitedAt: new Date(visitForm.visitedAt).toISOString(),
        salespersonUserId: visitForm.salespersonUserId,
        detailStatus: visitForm.detailStatus,
        note: dentalSalesVisitNote(visitForm.title, visitForm.note),
        attachments: visitAttachments,
      });
      setActionMessage(result.message);
      setVisitForm((form) => ({
        ...form,
        title: "",
        visitedAt: localDateTimeValue(new Date()),
        note: "",
      }));
      setVisitAttachments([]);
      setVisitAttachmentError("");
      setIsVisitFormOpen(false);
      setVisitPage(1);
      await Promise.all([loadDetail(1), loadList()]);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "방문 기록을 저장하지 못했습니다.");
    } finally {
      setIsSavingVisit(false);
    }
  }

  async function selectBusinessFile(file: File | undefined) {
    setBusinessFileError("");
    setBusinessFileName("");
    if (!file || !selectedProfileId) return;
    const validationError = dentalSalesBusinessFileError(file);
    if (validationError) {
      setBusinessFileError(validationError);
      return;
    }
    setBusinessFileName(file.name);
    setIsSavingBusinessFile(true);
    try {
      const result = await uploadAdminDentalSalesBusinessLicense(
        accessToken,
        selectedProfileId,
        file,
      );
      setActionMessage(result.message);
      await loadDetail();
      setBusinessFileName("");
    } catch (error) {
      setBusinessFileError(
        error instanceof Error ? error.message : "사업자 등록증을 저장하지 못했습니다.",
      );
    } finally {
      setIsSavingBusinessFile(false);
    }
  }

  function selectVisitAttachments(files: File[]) {
    setVisitAttachmentError("");
    setVisitAttachments([]);
    if (!files.length) return;
    if (files.length > 5) {
      setVisitAttachmentError("첨부파일은 최대 5개까지 등록할 수 있습니다.");
      return;
    }
    for (const file of files) {
      const validationError = dentalSalesBusinessFileError(file);
      if (validationError) {
        setVisitAttachmentError(`${file.name}: ${validationError}`);
        return;
      }
    }
    setVisitAttachments(files);
  }

  function openVisitModal() {
    const profileDetailStatus = detail?.profile.detailStatus ?? null;
    setVisitForm((form) => ({
      ...form,
      title: "",
      note: "",
      visitedAt: localDateTimeValue(new Date()),
      salespersonUserId:
        form.salespersonUserId || detail?.profile.assignedSalesperson?.id || "",
      detailStatus: isDentalSalesVisitDetailStatus(profileDetailStatus)
        ? profileDetailStatus
        : form.detailStatus,
    }));
    setVisitAttachments([]);
    setVisitAttachmentError("");
    setIsVisitFormOpen(true);
  }

  function closeVisitModal() {
    setVisitAttachments([]);
    setVisitAttachmentError("");
    setIsVisitFormOpen(false);
  }

  function closeDetail() {
    setIsAssignmentEditing(false);
    setIsHospitalReviewOpen(false);
    setIsVisitFormOpen(false);
    setBusinessFileName("");
    setBusinessFileError("");
    setVisitAttachments([]);
    setVisitAttachmentError("");
    onSelectProfile(null);
  }

  function openDetail(profileId: string) {
    setDetail(null);
    setVisitPage(1);
    setActionMessage("");
    setIsAssignmentEditing(false);
    setIsHospitalReviewOpen(false);
    setIsVisitFormOpen(false);
    setBusinessFileName("");
    setBusinessFileError("");
    setVisitAttachments([]);
    setVisitAttachmentError("");
    setVisitForm({
      title: "",
      visitedAt: localDateTimeValue(new Date()),
      salespersonUserId: "",
      detailStatus: "INTEREST",
      note: "",
    });
    onSelectProfile(profileId);
  }

  if (selectedProfileId) {
    return (
      <DentalSalesDetailPage
        actionMessage={actionMessage}
        businessFileError={businessFileError}
        businessFileName={businessFileName}
        detail={detail}
        detailError={detailError}
        isAssignmentEditing={isAssignmentEditing}
        isDetailLoading={isDetailLoading}
        isHospitalReviewOpen={isHospitalReviewOpen}
        isSavingAssignment={isSavingAssignment}
        isSavingBusinessFile={isSavingBusinessFile}
        isSavingVisit={isSavingVisit}
        isVisitFormOpen={isVisitFormOpen}
        onAssignmentCancel={() => setIsAssignmentEditing(false)}
        onAssignmentEdit={() => setIsAssignmentEditing(true)}
        onAssignmentSave={(salespersonId, externalConnectorId) =>
          void saveAssignment(salespersonId, externalConnectorId)
        }
        onBack={closeDetail}
        onBusinessFileSelect={selectBusinessFile}
        onDetailRetry={() => void loadDetail()}
        onHospitalReviewClose={() => setIsHospitalReviewOpen(false)}
        onHospitalReviewOpen={() => setIsHospitalReviewOpen(true)}
        onVisitAttachmentSelect={selectVisitAttachments}
        onVisitModalClose={closeVisitModal}
        onVisitModalOpen={openVisitModal}
        onVisitSubmit={saveVisit}
        onVisitFormChange={(patch) =>
          setVisitForm((form) => ({ ...form, ...patch }))
        }
        onVisitPageChange={setVisitPage}
        visitForm={visitForm}
        visitAttachmentError={visitAttachmentError}
        visitAttachmentNames={visitAttachments.map((file) => file.name)}
        visitPage={visitPage}
      />
    );
  }

  return (
    <>
      <form
        className="admin-sales-filters"
        onSubmit={(event) => {
          event.preventDefault();
          setAppliedFilters({ ...draftFilters });
          setCurrentPage(1);
        }}
      >
        <SalesFilterSelect
          label="시/도 선택"
          value={draftFilters.city}
          options={[
            { value: "", label: "전체" },
            ...(listData?.filterOptions.regions.map((region) => ({
              value: region.name,
              label: region.name,
            })) ?? []),
          ]}
          onChange={(value) => {
            updateFilter("city", value);
            updateFilter("district", "");
          }}
        />
        <SalesFilterSelect
          label="구 선택"
          value={draftFilters.district}
          options={[
            { value: "", label: "전체" },
            ...(listData?.filterOptions.districts.map((district) => ({
              value: district,
              label: district,
            })) ?? []),
          ]}
          onChange={(value) => updateFilter("district", value)}
        />
        <label className="admin-sales-filter-field">
          <span>치과명 검색</span>
          <span className="admin-sales-search-field">
            <span className="admin-sales-search-icon" aria-hidden="true" />
            <input
              type="search"
              value={draftFilters.clinicName}
              placeholder="치과명 검색"
              onChange={(event) => updateFilter("clinicName", event.target.value)}
            />
          </span>
        </label>
        <SalesFilterSelect
          label="담당 영업자"
          value={draftFilters.salespersonId}
          options={[
            { value: "", label: "전체" },
            ...(listData?.filterOptions.salespeople.map((person) => ({
              value: person.id,
              label: person.name,
            })) ?? []),
          ]}
          onChange={(value) => updateFilter("salespersonId", value)}
        />
        <SalesFilterSelect
          label="상태"
          value={draftFilters.status}
          options={dentalSalesStatusOptions}
          onChange={(value) =>
            updateFilter("status", value as DentalSalesFilters["status"])
          }
        />
        <SalesFilterSelect
          label="상세 상태"
          value={draftFilters.detailStatus}
          options={dentalSalesDetailOptions}
          onChange={(value) =>
            updateFilter("detailStatus", value as DentalSalesFilters["detailStatus"])
          }
        />
        <button className="admin-sales-reset" type="button" onClick={resetFilters}>
          초기화
        </button>
        <button className="admin-sales-submit" type="submit">
          검색
        </button>
      </form>

      {errorMessage ? (
        <div className="admin-sales-feedback admin-sales-feedback--error" role="alert">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => void loadList()}>다시 시도</button>
        </div>
      ) : null}

      <div className="admin-sales-table-scroll" aria-busy={isLoading}>
        <table className="admin-sales-table">
          <colgroup>
            <col style={{ width: 80 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 160 }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 80 }} />
          </colgroup>
          <thead>
            <tr>
              <th>시</th>
              <th>구</th>
              <th>동</th>
              <th>치과명</th>
              <th>대표 전화번호</th>
              <th>담당 영업자</th>
              <th>초대코드</th>
              <th>상태</th>
              <th className="admin-sales-centered">상세 상태</th>
              <th>영업 현황</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && !errorMessage
              ? listData?.items.map((row) => (
              <tr key={row.id}>
                <td>{row.city}</td>
                <td>{row.district}</td>
                <td>{row.neighborhood}</td>
                <td className="admin-sales-clinic-name">{row.clinicName}</td>
                <td className="admin-sales-mono">{row.phone}</td>
                <td>{row.salesperson?.name ?? "미지정"}</td>
                <td>
                  <span className="admin-sales-invite-code">
                    <span>{row.salesCode}</span>
                    <button
                      type="button"
                      aria-label={`${row.salesCode} 초대코드 복사`}
                      onClick={() => void copyInviteCode(row.salesCode)}
                    >
                      <span className="admin-sales-copy-icon" aria-hidden="true" />
                    </button>
                  </span>
                </td>
                <td>
                  <span
                    className={`admin-sales-status admin-sales-status--${
                      row.status === "NOT_VISITED"
                        ? "unvisited"
                        : row.status === "VISITING"
                          ? "visited"
                          : "joined"
                    }`}
                  >
                    {dentalSalesStatusLabel(row.status)}
                  </span>
                </td>
                <td
                  className={`admin-sales-detail-status admin-sales-centered${
                    !row.detailStatus ? " admin-sales-detail-status--empty" : ""
                  }`}
                >
                  {dentalSalesDetailLabel(row.detailStatus)}
                </td>
                <td className="admin-sales-centered">
                  <button
                    className="admin-sales-detail-button"
                    type="button"
                    onClick={() => openDetail(row.id)}
                  >
                    상세보기
                  </button>
                </td>
              </tr>
              ))
              : null}
            {isLoading ? (
              <tr>
                <td className="admin-sales-empty" colSpan={10}>목록을 불러오는 중입니다.</td>
              </tr>
            ) : null}
            {!isLoading && !errorMessage && (listData?.items.length ?? 0) === 0 ? (
              <tr>
                <td className="admin-sales-empty" colSpan={10}>
                  조건에 맞는 치과가 없습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <nav className="admin-sales-pagination" aria-label="치과 영업 목록 페이지">
        <button
          type="button"
          aria-label="이전 페이지"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
        >
          ‹
        </button>
        {pageNumbers.map((page) => (
          <button
            type="button"
            key={page}
            className={currentPage === page ? "admin-sales-page-active" : undefined}
            aria-current={currentPage === page ? "page" : undefined}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          aria-label="다음 페이지"
          disabled={currentPage >= (listData?.pagination.totalPages ?? 1) || isLoading}
          onClick={() =>
            setCurrentPage((page) =>
              Math.min(listData?.pagination.totalPages ?? 1, page + 1),
            )
          }
        >
          ›
        </button>
      </nav>
      <span className="admin-visually-hidden" aria-live="polite">
        {copiedCode
          ? `${copiedCode} 초대코드를 복사했습니다.`
          : copyFailed
            ? "초대코드를 복사하지 못했습니다."
            : ""}
      </span>
      {copiedCode || copyFailed ? (
        <div className={`admin-sales-toast${copyFailed ? " admin-sales-toast--error" : ""}`}>
          {copiedCode ? "초대코드가 복사되었습니다." : "초대코드를 복사하지 못했습니다."}
        </div>
      ) : null}

    </>
  );
}

type DentalSalesVisitForm = {
  title: string;
  visitedAt: string;
  salespersonUserId: string;
  detailStatus: DentalSalesVisitDetailStatus;
  note: string;
};

function DentalSalesDetailPage({
  actionMessage,
  businessFileError,
  businessFileName,
  detail,
  detailError,
  isAssignmentEditing,
  isDetailLoading,
  isHospitalReviewOpen,
  isSavingAssignment,
  isSavingBusinessFile,
  isSavingVisit,
  isVisitFormOpen,
  onAssignmentCancel,
  onAssignmentEdit,
  onAssignmentSave,
  onBack,
  onBusinessFileSelect,
  onDetailRetry,
  onHospitalReviewClose,
  onHospitalReviewOpen,
  onVisitAttachmentSelect,
  onVisitFormChange,
  onVisitModalClose,
  onVisitModalOpen,
  onVisitPageChange,
  onVisitSubmit,
  visitAttachmentError,
  visitAttachmentNames,
  visitForm,
  visitPage,
}: {
  actionMessage: string;
  businessFileError: string;
  businessFileName: string;
  detail: DentalSalesDetailPayload | null;
  detailError: string;
  isAssignmentEditing: boolean;
  isDetailLoading: boolean;
  isHospitalReviewOpen: boolean;
  isSavingAssignment: boolean;
  isSavingBusinessFile: boolean;
  isSavingVisit: boolean;
  isVisitFormOpen: boolean;
  onAssignmentCancel: () => void;
  onAssignmentEdit: () => void;
  onAssignmentSave: (
    salespersonId: string,
    externalConnectorId: string,
  ) => void;
  onBack: () => void;
  onBusinessFileSelect: (file: File | undefined) => void;
  onDetailRetry: () => void;
  onHospitalReviewClose: () => void;
  onHospitalReviewOpen: () => void;
  onVisitAttachmentSelect: (files: File[]) => void;
  onVisitFormChange: (patch: Partial<DentalSalesVisitForm>) => void;
  onVisitModalClose: () => void;
  onVisitModalOpen: () => void;
  onVisitPageChange: (page: number) => void;
  onVisitSubmit: (event: FormEvent<HTMLFormElement>) => void;
  visitAttachmentError: string;
  visitAttachmentNames: string[];
  visitForm: DentalSalesVisitForm;
  visitPage: number;
}) {
  const registerButtonRef = useRef<HTMLButtonElement>(null);
  const hospitalReviewButtonRef = useRef<HTMLButtonElement>(null);
  const hospitalReviewCloseButtonRef = useRef<HTMLButtonElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [assignmentDraftSalespersonId, setAssignmentDraftSalespersonId] = useState("");
  const [assignmentDraftExternalConnectorId, setAssignmentDraftExternalConnectorId] =
    useState("");

  useEffect(() => {
    if (!isVisitFormOpen) return;
    const previousOverflow = document.body.style.overflow;
    const triggerButton = registerButtonRef.current;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => titleInputRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      triggerButton?.focus();
    };
  }, [isVisitFormOpen]);

  useEffect(() => {
    if (!isHospitalReviewOpen) return;
    const previousOverflow = document.body.style.overflow;
    const triggerButton = hospitalReviewButtonRef.current;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(
      () => hospitalReviewCloseButtonRef.current?.focus(),
      0,
    );
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      triggerButton?.focus();
    };
  }, [isHospitalReviewOpen]);

  function keepModalFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusableElements = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'input:not([disabled]), textarea:not([disabled]), button:not([disabled])',
      ),
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);
    if (!firstElement || !lastElement) return;
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  if (isDetailLoading && !detail) {
    return (
      <section className="admin-sales-detail-state" aria-live="polite">
        <p>치과 영업 상세 정보를 불러오는 중입니다.</p>
      </section>
    );
  }

  if (detailError && !detail) {
    return (
      <section className="admin-sales-detail-state" role="alert">
        <p>{detailError}</p>
        <div>
          <button type="button" onClick={onBack}>목록으로</button>
          <button type="button" onClick={onDetailRetry}>다시 시도</button>
        </div>
      </section>
    );
  }

  if (!detail) return null;

  const { profile } = detail;
  const latestVisit = detail.visits[0] ?? null;
  const assignedSalesperson = profile.assignedSalesperson;
  const completionView = dentalSalesCompletionViewState({
    detailStatus: profile.detailStatus,
    isAppVisible: profile.isAppVisible,
    percentage: profile.informationCompletion?.percentage,
  });
  const { completionPercentage, isAppVisible, isComplete } = completionView;
  const businessLicenseName = businessFileName || profile.businessLicense?.fileName || "";

  return (
    <article className="admin-sales-detail-page">
      <header className="admin-sales-detail-page-header">
        <button className="admin-sales-detail-back" type="button" onClick={onBack}>
          ‹ 목록으로
        </button>
        <h1>{profile.clinicName}</h1>
        <p>병원별 영업 현황과 제휴 진행 이력을 관리합니다.</p>
      </header>

      <dl className="admin-sales-detail-summary">
        <SummaryItem label="병원명" value={profile.clinicName} />
        <SummaryItem
          label="지역"
          value={dentalSalesRegionLabel(profile.city, profile.district)}
        />
        <div>
          <dt>상태</dt>
          <dd>
            <span
              className={`admin-sales-status admin-sales-status--${
                profile.status === "NOT_VISITED"
                  ? "unvisited"
                  : profile.status === "VISITING"
                    ? "visited"
                    : "joined"
              }`}
            >
              {dentalSalesStatusLabel(profile.status)}
            </span>
          </dd>
        </div>
        <SummaryItem label="상세 상태" value={dentalSalesDetailLabel(profile.detailStatus)} />
        <SummaryItem label="담당 영업자" value={assignedSalesperson?.name ?? "미지정"} />
        <SummaryItem label="초대코드" value={profile.salesCode} mono />
        <SummaryItem label="최근 방문일" value={formatAdminDate(latestVisit?.visitedAt ?? null)} />
        <SummaryItem label="대표 계정 생성일" value={formatAdminDate(profile.claimedAt)} />
      </dl>

      <div className="admin-sales-detail-columns">
        <section className="admin-sales-timeline-card">
          <div className="admin-sales-detail-card-heading">
            <h2>영업 기록</h2>
            <button
              ref={registerButtonRef}
              className="admin-sales-register-button"
              type="button"
              aria-haspopup="dialog"
              onClick={onVisitModalOpen}
            >
              <span aria-hidden="true">＋</span>
              등록
            </button>
          </div>

          {actionMessage ? (
            <p className="admin-sales-detail-action-message" role="status">
              {actionMessage}
            </p>
          ) : null}

          {detail.visits.length ? (
            <ol className="admin-sales-detail-timeline">
              {detail.visits.map((visit) => {
                const presentation = dentalSalesVisitPresentation({
                  detailStatus: visit.detailStatus,
                  note: visit.note,
                  salesCode: profile.salesCode,
                });
                return (
                  <li key={visit.id}>
                    <div className="admin-sales-timeline-marker" aria-hidden="true" />
                    <article>
                      <header>
                        <div>
                          <strong>{presentation.title}</strong>
                          <time>{formatAdminDetailDateTime(visit.visitedAt)}</time>
                        </div>
                        <span>{visit.salesperson.name} 작성</span>
                      </header>
                      <p>{presentation.memo || "기록된 메모가 없습니다."}</p>
                      {visit.attachments.length ? (
                        <ul className="admin-sales-visit-files">
                          {visit.attachments.map((attachment) => (
                            <li key={attachment.id}>
                              {attachment.url ? (
                                <a
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {attachment.fileName}
                                </a>
                              ) : (
                                <span title="다운로드 링크가 만료되었습니다. 새로고침해 주세요.">
                                  {attachment.fileName}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="admin-sales-detail-empty">아직 등록된 영업 기록이 없습니다.</p>
          )}

          {detail.visitPagination.totalPages > 1 ? (
            <nav className="admin-sales-pagination" aria-label="영업 기록 페이지">
              <button
                type="button"
                disabled={visitPage <= 1}
                onClick={() => onVisitPageChange(Math.max(1, visitPage - 1))}
              >‹</button>
              <span>{visitPage} / {detail.visitPagination.totalPages}</span>
              <button
                type="button"
                disabled={visitPage >= detail.visitPagination.totalPages}
                onClick={() =>
                  onVisitPageChange(
                    Math.min(detail.visitPagination.totalPages, visitPage + 1),
                  )
                }
              >›</button>
            </nav>
          ) : null}
        </section>

        <aside className="admin-sales-detail-sidebar" aria-label="치과 상세 정보">
          <DetailCard title="병원 기본 정보">
            <dl className="admin-sales-detail-info-list">
              <DetailInfoRow label="병원명" value={profile.clinicName} />
              <DetailInfoRow label="대표자 성명" value={profile.representativeName || "—"} />
              <DetailInfoRow label="주소" value={profile.address} stacked />
              <DetailInfoRow label="대표 전화번호" value={profile.phone || "—"} />
              <DetailInfoRow
                label="사업자 등록번호"
                value={profile.businessRegistrationNumber || "—"}
              />
              <DetailInfoRow
                label="의료기관 종류"
                value={profile.medicalInstitutionType || "—"}
              />
            </dl>
          </DetailCard>

          <DetailCard
            title="담당자 정보"
            action={
              detail.canEditAssignment && !isAssignmentEditing ? (
                <button
                  className="admin-sales-assignee-edit"
                  type="button"
                  aria-expanded="false"
                  onClick={() => {
                    setAssignmentDraftSalespersonId(assignedSalesperson?.id ?? "");
                    setAssignmentDraftExternalConnectorId(
                      profile.externalConnector?.id ?? "",
                    );
                    onAssignmentEdit();
                  }}
                >
                  <Image src="/Type=edit.svg" alt="" width={18} height={18} />
                  수정
                </button>
              ) : null
            }
          >
            {isAssignmentEditing && detail.canEditAssignment ? (
              <form
                className="admin-sales-assignee-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  onAssignmentSave(
                    assignmentDraftSalespersonId,
                    assignmentDraftExternalConnectorId,
                  );
                }}
              >
                <label className="admin-sales-assignee-field">
                  <span>담당자 선택</span>
                  <span className="admin-sales-assignee-select-wrap">
                    <select
                      value={assignmentDraftSalespersonId}
                      disabled={isSavingAssignment}
                      onChange={(event) =>
                        setAssignmentDraftSalespersonId(event.target.value)
                      }
                    >
                      <option value="">선택 안함</option>
                      {detail.salespeople.map((person) => (
                        <option key={person.id} value={person.id}>{person.name}</option>
                      ))}
                    </select>
                  </span>
                </label>

                <div className="admin-sales-assignee-divider" />

                <label className="admin-sales-assignee-field">
                  <span>외부 연결자 선택</span>
                  <span className="admin-sales-assignee-select-wrap">
                    <select
                      aria-label="외부 연결자 선택"
                      value={assignmentDraftExternalConnectorId}
                      disabled={isSavingAssignment}
                      onChange={(event) =>
                        setAssignmentDraftExternalConnectorId(event.target.value)
                      }
                    >
                      <option value="">선택 안함</option>
                      {(detail.externalConnectors ?? []).map((person) => (
                        <option key={person.id} value={person.id}>{person.name}</option>
                      ))}
                    </select>
                  </span>
                </label>

                <div className="admin-sales-assignee-actions">
                  <button
                    type="button"
                    disabled={isSavingAssignment}
                    onClick={() => {
                      setAssignmentDraftSalespersonId(assignedSalesperson?.id ?? "");
                      setAssignmentDraftExternalConnectorId(
                        profile.externalConnector?.id ?? "",
                      );
                      onAssignmentCancel();
                    }}
                  >
                    취소
                  </button>
                  <button type="submit" disabled={isSavingAssignment}>
                    {isSavingAssignment ? "저장 중" : "저장"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="admin-sales-assignee-profile">
                  <span aria-hidden="true">
                    {assignedSalesperson?.name.slice(0, 1) ?? "?"}
                  </span>
                  <div>
                    <strong>
                      {assignedSalesperson
                        ? `${assignedSalesperson.name}${
                            assignedSalesperson.teamName
                              ? ` (${assignedSalesperson.teamName})`
                              : ""
                          }`
                        : "담당자 미지정"}
                    </strong>
                    <p>주 담당 영업 대표자</p>
                  </div>
                </div>
                <dl className="admin-sales-detail-info-list admin-sales-detail-info-list--compact">
                  <DetailInfoRow
                    label="외부 연결자"
                    value={profile.externalConnector?.name || "선택 안함"}
                  />
                </dl>
              </>
            )}
          </DetailCard>

          <DetailCard title="사업자 등록증 첨부">
            <div className="admin-sales-business-upload">
              <p>파일 형식: JPG, PNG, PDF (최대 10MB)</p>
              <input
                id="admin-sales-business-file"
                className="admin-visually-hidden"
                type="file"
                disabled={isSavingBusinessFile}
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                onChange={(event) => {
                  onBusinessFileSelect(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
              <label htmlFor="admin-sales-business-file">
                <Image src="/Type=Upload.svg" alt="" width={18} height={18} />
                {isSavingBusinessFile ? "저장 중" : "파일 업로드"}
              </label>
              {businessLicenseName ? (
                profile.businessLicense?.url && !businessFileName ? (
                  <a
                    className="admin-sales-business-file-name"
                    href={profile.businessLicense.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {businessLicenseName}
                  </a>
                ) : (
                  <span className="admin-sales-business-file-name">{businessLicenseName}</span>
                )
              ) : null}
              {businessFileError ? (
                <span className="admin-sales-business-file-error" role="alert">
                  {businessFileError}
                </span>
              ) : null}
            </div>
          </DetailCard>

          <DetailCard
            className={isComplete ? "admin-sales-detail-card--information-complete" : undefined}
            description={
              isComplete
                ? "치과에서 필수 정보를 모두 입력했습니다. 등록된 정보를 검토한 후, 필요한 내용을 수정하고 앱 노출 여부를 확정해 주세요."
                : undefined
            }
            title="필수 정보 입력 상태"
          >
            <dl className="admin-sales-detail-info-list admin-sales-completion-list">
              <DetailInfoRow
                label="최근 정보 수정일"
                value={formatAdminDate(profile.informationCompletion?.updatedAt ?? null)}
              />
              <div className="admin-sales-completion-row">
                <div>
                  <dt>정보 관리 완료율</dt>
                  <dd>{completionPercentage === null ? "—" : `${completionPercentage}%`}</dd>
                </div>
                <span aria-hidden="true">
                  <i style={{ width: `${completionPercentage ?? 0}%` }} />
                </span>
              </div>
            </dl>
            <div className="admin-sales-completion-review">
              <button
                ref={hospitalReviewButtonRef}
                className="admin-sales-review-button"
                type="button"
                disabled={!isComplete || !detail.hospitalInformation}
                title={
                  isComplete && detail.hospitalInformation
                    ? undefined
                    : "필수 정보 입력 완료 후 검토할 수 있습니다."
                }
                onClick={onHospitalReviewOpen}
              >
                등록 정보 검토하기
              </button>
            </div>
            <div className="admin-sales-app-visibility">
              <div>
                <strong>앱 노출 승인</strong>
                <p>승인 후 사용자 앱에 치과 정보가 노출됩니다</p>
              </div>
              <span
                className={isAppVisible ? "is-active" : undefined}
                role="switch"
                aria-checked={isAppVisible}
                aria-disabled="true"
              >
                <i />
              </span>
            </div>
          </DetailCard>
        </aside>
      </div>

      {isHospitalReviewOpen && detail.hospitalInformation ? (
        <HospitalInformationReviewModal
          closeButtonRef={hospitalReviewCloseButtonRef}
          information={detail.hospitalInformation}
          onClose={onHospitalReviewClose}
          onKeyDown={keepModalFocus}
        />
      ) : null}

      {isVisitFormOpen ? (
        <div className="admin-sales-visit-modal-layer">
          <button
            className="admin-sales-visit-modal-backdrop"
            type="button"
            aria-label="영업 기록 등록 창 닫기"
            onClick={onVisitModalClose}
          />
          <div
            className="admin-sales-visit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-sales-visit-modal-title"
            onKeyDown={keepModalFocus}
          >
            <form className="admin-sales-visit-modal-form" onSubmit={onVisitSubmit}>
              <h2 id="admin-sales-visit-modal-title">영업 기록 등록하기</h2>

              <label className="admin-sales-visit-modal-field">
                <span>
                  제목 <i aria-hidden="true">*</i>
                </span>
                <input
                  ref={titleInputRef}
                  type="text"
                  required
                  maxLength={100}
                  value={visitForm.title}
                  placeholder="방문 내용을 요약하는 제목을 입력해 주세요."
                  onChange={(event) => onVisitFormChange({ title: event.target.value })}
                />
              </label>

              <label className="admin-sales-visit-modal-field">
                <span>메모</span>
                <textarea
                  maxLength={1800}
                  value={visitForm.note}
                  placeholder="영업 과정과 결과, 다음 일정 및 특이사항을 상세히 기록해 주세요."
                  onChange={(event) => onVisitFormChange({ note: event.target.value })}
                />
              </label>

              <div className="admin-sales-visit-modal-field">
                <span>첨부파일 및 사진</span>
                <input
                  id="admin-sales-visit-attachments"
                  className="admin-sales-visit-modal-file-input"
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={(event) => {
                    onVisitAttachmentSelect(Array.from(event.target.files ?? []));
                    event.currentTarget.value = "";
                  }}
                />
                <label
                  className="admin-sales-visit-modal-dropzone"
                  htmlFor="admin-sales-visit-attachments"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    onVisitAttachmentSelect(Array.from(event.dataTransfer.files));
                  }}
                >
                  <Image src="/Type=Upload.svg" alt="" width={24} height={24} />
                  <strong>클릭하거나 파일을 드래그하여 업로드하세요.</strong>
                  <small>PDF, JPG, PNG 파일 최대 10MB까지 가능</small>
                </label>
                {visitAttachmentNames.length ? (
                  <p className="admin-sales-visit-attachment-names">
                    선택됨: {visitAttachmentNames.join(", ")}
                  </p>
                ) : null}
                {visitAttachmentError ? (
                  <p className="admin-sales-visit-attachment-error" role="alert">
                    {visitAttachmentError}
                  </p>
                ) : null}
              </div>

              {!visitForm.salespersonUserId ? (
                <p className="admin-sales-visit-modal-assignee" role="alert">
                  방문 기록을 저장하려면 먼저 담당 영업자를 지정해 주세요.
                </p>
              ) : null}

              <footer className="admin-sales-visit-modal-actions">
                <button type="button" onClick={onVisitModalClose}>닫기</button>
                <button
                  type="submit"
                  disabled={
                    isSavingVisit ||
                    !visitForm.salespersonUserId ||
                    !visitForm.title.trim()
                  }
                >
                  {isSavingVisit ? "저장 중" : "방문 기록 저장"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function HospitalInformationReviewModal({
  closeButtonRef,
  information,
  onClose,
  onKeyDown,
}: {
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
  information: DentalSalesHospitalInformation;
  onClose: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}) {
  const reviewState = dentalSalesHospitalInformationReviewState(information);
  const { completion } = information;

  return (
    <div className="admin-sales-hospital-review-layer">
      <button
        className="admin-sales-hospital-review-backdrop"
        type="button"
        aria-label="병원 정보 관리 창 닫기"
        onClick={onClose}
      />
      <div
        className="admin-sales-hospital-review-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-sales-hospital-review-title"
        onKeyDown={onKeyDown}
      >
        <div className="admin-sales-hospital-review-content">
          <header className="admin-sales-hospital-review-header">
            <h2 id="admin-sales-hospital-review-title">병원 정보 관리</h2>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="병원 정보 관리 닫기"
              onClick={onClose}
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <section
            className="admin-sales-hospital-review-progress"
            aria-label="병원 프로필 완료 현황"
          >
            <div className="admin-sales-hospital-review-progress-heading">
              <h3>병원 프로필</h3>
              <p>사용자에게 노출될 병원 정보를 등록해 주세요.</p>
            </div>
            <div className="admin-sales-hospital-review-progress-body">
              <div>
                <span aria-hidden="true">
                  <i style={{ width: `${completion.percentage}%` }} />
                </span>
                <strong>{completion.percentage}%</strong>
              </div>
              <p>
                {completion.total_count}개 항목 중 {completion.completed_count}개 완료 · 모든
                필수 정보가 입력되면 치카픽 담당자에게 검수 요청이 전송되며, 승인 후 앱에
                노출됩니다.
              </p>
            </div>
          </section>

          <div className="admin-sales-hospital-review-grid">
            {dentalSalesHospitalInformationCards.map((card) => {
              const status = reviewState.cardStatuses[card.key];
              return (
                <article
                  className={`admin-sales-hospital-review-card${
                    card.wide ? " admin-sales-hospital-review-card--wide" : ""
                  }`}
                  key={card.key}
                >
                  <header>
                    <h3>{card.title}</h3>
                    <span className={status === "complete" ? "is-complete" : "is-needed"}>
                      {status === "complete" ? "완료" : "설정 필요"}
                    </span>
                  </header>
                  <p>{card.description}</p>
                  {card.key === "staff" ? (
                    <strong className="admin-sales-hospital-review-card-metric">
                      {reviewState.staffMetric}
                    </strong>
                  ) : null}
                  <footer>
                    <button type="button" disabled title="파트너스에서 관리할 수 있습니다.">
                      {card.primaryAction}
                    </button>
                    <button type="button" disabled title="파트너스에서 관리할 수 있습니다.">
                      {card.secondaryAction}
                    </button>
                  </footer>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  mono = false,
  value,
}: {
  label: string;
  mono?: boolean;
  value: string;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={mono ? "admin-sales-mono" : undefined}>{value}</dd>
    </div>
  );
}

function DetailCard({
  action,
  children,
  className,
  description,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  description?: string;
  title: string;
}) {
  return (
    <section className={`admin-sales-detail-card${className ? ` ${className}` : ""}`}>
      <header>
        <div className="admin-sales-detail-card-title">
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function DetailInfoRow({
  label,
  stacked = false,
  value,
}: {
  label: string;
  stacked?: boolean;
  value: string;
}) {
  return (
    <div className={stacked ? "admin-sales-detail-info-stacked" : undefined}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function SalesFilterSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<string | { value: string; label: string }>;
  value: string;
}) {
  return (
    <label className="admin-sales-filter-field">
      <span>{label}</span>
      <span className="admin-sales-select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option
              key={typeof option === "string" ? option : option.value}
              value={typeof option === "string" ? option : option.value}
            >
              {typeof option === "string" ? option : option.label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

function localDateTimeValue(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatAdminDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function formatAdminDetailDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${formatAdminDate(value)} ${hours}:${minutes}`;
}

function OperationalPagination({
  onPageChange,
  pagination,
}: {
  onPageChange: (page: number) => void;
  pagination: AdminDirectoryPagination;
}) {
  const pageNumbers = dentalSalesPageNumbers(
    pagination.page,
    pagination.totalPages,
  );
  return (
    <nav className="admin-sales-pagination" aria-label="목록 페이지">
      <button
        type="button"
        disabled={pagination.page <= 1}
        onClick={() => onPageChange(pagination.page - 1)}
        aria-label="이전 페이지"
      >
        ‹
      </button>
      {pageNumbers.map((page) => (
        <button
          type="button"
          key={page}
          className={page === pagination.page ? "admin-sales-page-active" : undefined}
          aria-current={page === pagination.page ? "page" : undefined}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        disabled={pagination.page >= pagination.totalPages}
        onClick={() => onPageChange(pagination.page + 1)}
        aria-label="다음 페이지"
      >
        ›
      </button>
    </nav>
  );
}

function AdminReservationsTab({ accessToken }: { accessToken: string }) {
  const [draftFilters, setDraftFilters] =
    useState<AdminReservationDirectoryFilters>(
      defaultAdminReservationDirectoryFilters,
    );
  const [filters, setFilters] = useState<AdminReservationDirectoryFilters>(
    defaultAdminReservationDirectoryFilters,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<AdminReservationDirectoryPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReservations = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");
    try {
      setData(
        await fetchAdminReservationDirectory(accessToken, filters, currentPage),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "예약 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, currentPage, filters]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadReservations(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadReservations]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCurrentPage(1);
    setFilters({ ...draftFilters, query: draftFilters.query.trim() });
  }

  return (
    <section className="admin-operational-page">
      <form className="admin-operational-filters" onSubmit={applyFilters}>
        <label className="admin-operational-search">
          <span>병원명 또는 환자명</span>
          <input
            type="search"
            value={draftFilters.query}
            placeholder="검색어를 입력해 주세요."
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                query: event.target.value,
              }))
            }
          />
        </label>
        <label>
          <span>예약 유형</span>
          <select
            value={draftFilters.bookingSource}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                bookingSource: event.target.value,
              }))
            }
          >
            <option value="all">전체</option>
            <option value="standard">일반 예약</option>
            <option value="instant">즉시 예약</option>
          </select>
        </label>
        <label>
          <span>상태</span>
          <select
            value={draftFilters.status}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
          >
            <option value="all">전체</option>
            <option value="pending">접수</option>
            <option value="time_proposed">시간 제안</option>
            <option value="alternative_proposed">대안 제안</option>
            <option value="proposed">제안</option>
            <option value="reschedule_proposed">일정 재제안</option>
            <option value="confirmed">확정</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소</option>
          </select>
        </label>
        <button type="submit">조회</button>
      </form>

      <section className="admin-operational-table-card">
        <div className="admin-operational-table-heading">
          <strong>전체 예약</strong>
          <span>
            {data?.pagination.totalItems.toLocaleString("ko-KR") ?? "0"}건
          </span>
        </div>
        {error ? <p className="admin-operational-error">{error}</p> : null}
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>치과</th>
                <th>환자</th>
                <th>유형</th>
                <th>상태</th>
                <th>예약 희망 일시</th>
                <th>접수 일시</th>
                <th>요청 정보</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.clinic.name ?? "—"}</td>
                  <td>{item.patientName ?? "—"}</td>
                  <td>{reservationSourceLabel(item.bookingSource)}</td>
                  <td><StatusChip status={item.status} /></td>
                  <td>{adminDirectoryDateTime(item.scheduledAt)}</td>
                  <td>{adminDirectoryDateTime(item.createdAt)}</td>
                  <td>
                    {item.additionalRequest ||
                    item.recentTreatmentNote ||
                    item.cancelReason ? (
                      <details className="admin-operational-details">
                        <summary>내용 보기</summary>
                        {item.additionalRequest ? (
                          <p><strong>추가 요청</strong>{item.additionalRequest}</p>
                        ) : null}
                        {item.recentTreatmentNote ? (
                          <p><strong>최근 치료</strong>{item.recentTreatmentNote}</p>
                        ) : null}
                        {item.cancelReason ? (
                          <p><strong>취소 사유</strong>{item.cancelReason}</p>
                        ) : null}
                      </details>
                    ) : "—"}
                  </td>
                </tr>
              ))}
              {!isLoading && (data?.items.length ?? 0) === 0 ? (
                <EmptyRow colSpan={7} label="조건에 맞는 예약이 없습니다." />
              ) : null}
            </tbody>
          </table>
        </div>
        {isLoading ? <p className="admin-operational-loading">예약을 불러오는 중입니다.</p> : null}
        {data ? (
          <OperationalPagination
            pagination={data.pagination}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </section>
    </section>
  );
}

function AdminConsultationsTab({ accessToken }: { accessToken: string }) {
  const [draftFilters, setDraftFilters] =
    useState<AdminConsultationDirectoryFilters>(
      defaultAdminConsultationDirectoryFilters,
    );
  const [filters, setFilters] = useState<AdminConsultationDirectoryFilters>(
    defaultAdminConsultationDirectoryFilters,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<AdminConsultationDirectoryPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConsultations = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");
    try {
      setData(
        await fetchAdminConsultationDirectory(accessToken, filters, currentPage),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "전문의 소견 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, currentPage, filters]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadConsultations(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadConsultations]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCurrentPage(1);
    setFilters({ ...draftFilters, query: draftFilters.query.trim() });
  }

  return (
    <section className="admin-operational-page">
      <form className="admin-operational-filters" onSubmit={applyFilters}>
        <label className="admin-operational-search">
          <span>병원명, 환자명 또는 제목</span>
          <input
            type="search"
            value={draftFilters.query}
            placeholder="검색어를 입력해 주세요."
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                query: event.target.value,
              }))
            }
          />
        </label>
        <label>
          <span>상태</span>
          <select
            value={draftFilters.status}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
          >
            <option value="all">전체</option>
            <option value="pending">답변 대기</option>
            <option value="completed">답변 완료</option>
          </select>
        </label>
        <button type="submit">조회</button>
      </form>

      <section className="admin-operational-table-card">
        <div className="admin-operational-table-heading">
          <strong>전문의 소견 요청</strong>
          <span>
            {data?.pagination.totalItems.toLocaleString("ko-KR") ?? "0"}건
          </span>
        </div>
        {error ? <p className="admin-operational-error">{error}</p> : null}
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>치과</th>
                <th>환자</th>
                <th>제목</th>
                <th>분류</th>
                <th>상태</th>
                <th>요청 일시</th>
                <th>답변</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.clinic.name ?? "—"}</td>
                  <td>{item.patientName ?? "—"}</td>
                  <td>{item.title}</td>
                  <td>{adminConsultationCategoryLabel(item.categoryCode)}</td>
                  <td><StatusChip status={item.status} /></td>
                  <td>{adminDirectoryDateTime(item.createdAt)}</td>
                  <td>
                    {item.responsePreview ? (
                      <details className="admin-operational-details">
                        <summary>{adminDirectoryDateTime(item.respondedAt)}</summary>
                        <p>{item.responsePreview}</p>
                      </details>
                    ) : "—"}
                  </td>
                </tr>
              ))}
              {!isLoading && (data?.items.length ?? 0) === 0 ? (
                <EmptyRow colSpan={7} label="조건에 맞는 전문의 소견 요청이 없습니다." />
              ) : null}
            </tbody>
          </table>
        </div>
        {isLoading ? (
          <p className="admin-operational-loading">전문의 소견을 불러오는 중입니다.</p>
        ) : null}
        {data ? (
          <OperationalPagination
            pagination={data.pagination}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </section>
    </section>
  );
}

function PartnerInviteDirectoryTab({
  accessToken,
  onRevoke,
}: {
  accessToken: string;
  onRevoke: (inviteId: string) => Promise<boolean>;
}) {
  const [draftFilters, setDraftFilters] = useState<AdminInviteDirectoryFilters>(
    defaultAdminInviteDirectoryFilters,
  );
  const [filters, setFilters] = useState<AdminInviteDirectoryFilters>(
    defaultAdminInviteDirectoryFilters,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<AdminInviteDirectoryPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadInvites = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");
    try {
      setData(await fetchAdminInviteDirectory(accessToken, filters, currentPage));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "파트너 초대코드를 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, currentPage, filters]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadInvites(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadInvites]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCurrentPage(1);
    setFilters({ ...draftFilters, query: draftFilters.query.trim() });
  }

  async function handleRevoke(inviteId: string) {
    if (!window.confirm("이 초대코드를 폐기할까요? 폐기 후에는 사용할 수 없습니다.")) {
      return;
    }
    setBusyInviteId(inviteId);
    const succeeded = await onRevoke(inviteId);
    setBusyInviteId(null);
    if (succeeded) await loadInvites();
  }

  return (
    <section className="admin-operational-page">
      <form className="admin-operational-filters" onSubmit={applyFilters}>
        <label className="admin-operational-search">
          <span>치과명</span>
          <input
            type="search"
            value={draftFilters.query}
            placeholder="치과명을 입력해 주세요."
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                query: event.target.value,
              }))
            }
          />
        </label>
        <label>
          <span>초대 역할</span>
          <select
            value={draftFilters.role}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, role: event.target.value }))
            }
          >
            <option value="all">전체</option>
            <option value="owner">대표자</option>
            <option value="doctor">치과의사</option>
            <option value="manager">매니저</option>
            <option value="staff">스태프</option>
          </select>
        </label>
        <label>
          <span>상태</span>
          <select
            value={draftFilters.status}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
          >
            <option value="all">전체</option>
            <option value="pending_owner_claim">대표자 인증 대기</option>
            <option value="active">사용 가능</option>
            <option value="redeemed">사용 완료</option>
            <option value="revoked">폐기</option>
          </select>
        </label>
        <button type="submit">조회</button>
      </form>

      <section className="admin-operational-table-card">
        <div className="admin-operational-table-heading">
          <strong>파트너 초대코드</strong>
          <span>
            {data?.pagination.totalItems.toLocaleString("ko-KR") ?? "0"}건
          </span>
        </div>
        <p className="admin-operational-guidance">
          보안을 위해 초대코드 원문은 표시하지 않습니다.
        </p>
        {error ? <p className="admin-operational-error">{error}</p> : null}
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>치과</th>
                <th>역할</th>
                <th>발급자</th>
                <th>상태</th>
                <th>발급 일시</th>
                <th>만료 일시</th>
                <th>사용 일시</th>
                <th>처리</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.clinic.name ?? "—"}</td>
                  <td>{adminMembershipRoleLabel(item.role)}</td>
                  <td>{adminDirectoryPersonLabel(item.issuer)}</td>
                  <td><span className="admin-operational-status">{adminInviteStatusLabel(item.status)}</span></td>
                  <td>{adminDirectoryDateTime(item.issuedAt ?? item.createdAt)}</td>
                  <td>{adminDirectoryDateTime(item.expiresAt)}</td>
                  <td>{adminDirectoryDateTime(item.redeemedAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="admin-small-button"
                      disabled={item.status !== "active" || busyInviteId === item.id}
                      onClick={() => void handleRevoke(item.id)}
                    >
                      {busyInviteId === item.id ? "처리 중" : "폐기"}
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && (data?.items.length ?? 0) === 0 ? (
                <EmptyRow colSpan={8} label="조건에 맞는 초대코드가 없습니다." />
              ) : null}
            </tbody>
          </table>
        </div>
        {isLoading ? <p className="admin-operational-loading">초대코드를 불러오는 중입니다.</p> : null}
        {data ? (
          <OperationalPagination
            pagination={data.pagination}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </section>
    </section>
  );
}

function ClinicMembershipRequestsTab({
  accessToken,
  onDecision,
}: {
  accessToken: string;
  onDecision: (
    clinicId: string,
    userId: string,
    status: "active" | "revoked",
  ) => Promise<boolean>;
}) {
  const [draftFilters, setDraftFilters] =
    useState<AdminClinicMembershipRequestFilters>(
      defaultAdminClinicMembershipRequestFilters,
    );
  const [filters, setFilters] = useState<AdminClinicMembershipRequestFilters>(
    defaultAdminClinicMembershipRequestFilters,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] =
    useState<AdminClinicMembershipRequestPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyRequestKey, setBusyRequestKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");
    try {
      setData(
        await fetchAdminClinicMembershipRequests(
          accessToken,
          filters,
          currentPage,
        ),
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "소속 신청 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, currentPage, filters]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadRequests(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadRequests]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCurrentPage(1);
    setFilters({ ...draftFilters, query: draftFilters.query.trim() });
  }

  async function handleDecision(
    clinicId: string,
    userId: string,
    status: "active" | "revoked",
  ) {
    const label = status === "active" ? "승인" : "반려";
    if (!window.confirm(`이 소속 신청을 ${label}할까요?`)) return;
    const key = `${clinicId}:${userId}`;
    setBusyRequestKey(key);
    const succeeded = await onDecision(clinicId, userId, status);
    setBusyRequestKey(null);
    if (succeeded) await loadRequests();
  }

  return (
    <section className="admin-operational-page">
      <form className="admin-operational-filters" onSubmit={applyFilters}>
        <label className="admin-operational-search">
          <span>치과명, 이름 또는 이메일</span>
          <input
            type="search"
            value={draftFilters.query}
            placeholder="검색어를 입력해 주세요."
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                query: event.target.value,
              }))
            }
          />
        </label>
        <label>
          <span>신청 역할</span>
          <select
            value={draftFilters.role}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, role: event.target.value }))
            }
          >
            <option value="all">전체</option>
            <option value="owner">대표자</option>
            <option value="doctor">치과의사</option>
            <option value="manager">매니저</option>
            <option value="staff">스태프</option>
          </select>
        </label>
        <button type="submit">조회</button>
      </form>

      <section className="admin-operational-table-card">
        <div className="admin-operational-table-heading">
          <strong>승인 대기 신청</strong>
          <span>
            {data?.pagination.totalItems.toLocaleString("ko-KR") ?? "0"}건
          </span>
        </div>
        {error ? <p className="admin-operational-error">{error}</p> : null}
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>치과</th>
                <th>신청자</th>
                <th>이메일</th>
                <th>역할</th>
                <th>신청 일시</th>
                <th>처리</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((item) => {
                const clinicId = item.clinic.id;
                const userId = item.user.id;
                const key = `${clinicId}:${userId}`;
                const isBusy = busyRequestKey === key;
                return (
                  <tr key={key}>
                    <td>{item.clinic.name ?? "—"}</td>
                    <td>{item.user.fullName ?? "—"}</td>
                    <td>{item.user.email ?? "—"}</td>
                    <td>{adminMembershipRoleLabel(item.role)}</td>
                    <td>{adminDirectoryDateTime(item.requestedAt)}</td>
                    <td>
                      <div className="admin-operational-actions">
                        <button
                          type="button"
                          className="admin-small-button"
                          disabled={!clinicId || !userId || isBusy}
                          onClick={() =>
                            clinicId && userId
                              ? void handleDecision(clinicId, userId, "active")
                              : undefined
                          }
                        >
                          승인
                        </button>
                        <button
                          type="button"
                          className="admin-small-button admin-small-button--danger"
                          disabled={!clinicId || !userId || isBusy}
                          onClick={() =>
                            clinicId && userId
                              ? void handleDecision(clinicId, userId, "revoked")
                              : undefined
                          }
                        >
                          반려
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && (data?.items.length ?? 0) === 0 ? (
                <EmptyRow colSpan={6} label="승인 대기 중인 소속 신청이 없습니다." />
              ) : null}
            </tbody>
          </table>
        </div>
        {isLoading ? <p className="admin-operational-loading">소속 신청을 불러오는 중입니다.</p> : null}
        {data ? (
          <OperationalPagination
            pagination={data.pagination}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </section>
    </section>
  );
}

function TermsManagementTab({
  accessToken,
  onPublish,
}: {
  accessToken: string;
  onPublish: (
    documentId: string,
    body: { contentUrl: string; changeSummary: string },
  ) => Promise<boolean>;
}) {
  const [data, setData] = useState<AdminTermsManagementPayload | null>(null);
  const [selectedDocument, setSelectedDocument] =
    useState<AdminManagedTermDocument | null>(null);
  const [contentUrl, setContentUrl] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");

  const loadTerms = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");
    try {
      setData(await fetchAdminTerms(accessToken));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "약관 문서를 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadTerms(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadTerms]);

  function openPublish(document: AdminManagedTermDocument) {
    setSelectedDocument(document);
    setContentUrl(document.activeVersion?.contentUrl ?? "");
    setChangeSummary("");
  }

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDocument || !contentUrl.trim()) return;
    if (
      !window.confirm(
        "새 버전을 즉시 활성화할까요? 기존 버전은 이력으로 보존됩니다.",
      )
    ) {
      return;
    }
    setIsPublishing(true);
    const succeeded = await onPublish(selectedDocument.id, {
      contentUrl: contentUrl.trim(),
      changeSummary: changeSummary.trim(),
    });
    setIsPublishing(false);
    if (succeeded) {
      setSelectedDocument(null);
      await loadTerms();
    }
  }

  return (
    <section className="admin-terms-management">
      <div className="admin-terms-guidance">
        <strong>버전 게시 원칙</strong>
        <p>
          게시된 약관 버전은 수정하거나 삭제하지 않습니다. 새 버전을 게시하면
          해당 문서의 기존 활성 버전은 자동으로 비활성화되고 이력에 남습니다.
        </p>
      </div>
      {error ? <p className="admin-operational-error">{error}</p> : null}
      {isLoading ? <p className="admin-operational-loading">약관을 불러오는 중입니다.</p> : null}
      <div className="admin-terms-grid">
        {data?.items.map((document) => (
          <article className="admin-term-card" key={document.id}>
            <div className="admin-term-card-heading">
              <div>
                <span>{document.code}</span>
                <h2>{document.title}</h2>
              </div>
              <span className="admin-operational-status">
                {document.isRequired ? "필수" : "선택"}
              </span>
            </div>
            <dl className="admin-term-summary">
              <div><dt>적용 서비스</dt><dd>{adminTermAudienceLabel(document.appliesTo)}</dd></div>
              <div><dt>언어</dt><dd>{document.locale}</dd></div>
              <div><dt>활성 버전</dt><dd>{document.activeVersion ? `v${document.activeVersion.version}` : "—"}</dd></div>
              <div><dt>시행 일시</dt><dd>{adminDirectoryDateTime(document.activeVersion?.effectiveAt ?? null)}</dd></div>
            </dl>
            {document.activeVersion ? (
              <a
                className="admin-term-content-link"
                href={document.activeVersion.contentUrl}
                target="_blank"
                rel="noreferrer"
              >
                현재 약관 열기
              </a>
            ) : null}
            <details className="admin-term-history">
              <summary>버전 이력 {document.versions.length}개</summary>
              {document.versions.length ? (
                <ol>
                  {document.versions.map((version) => (
                    <li key={version.id}>
                      <div>
                        <strong>v{version.version}</strong>
                        {version.isActive ? <span>활성</span> : null}
                      </div>
                      <p>{version.changeSummary ?? "변경 요약 없음"}</p>
                      <small>{adminDirectoryDateTime(version.effectiveAt)}</small>
                    </li>
                  ))}
                </ol>
              ) : <p>게시 이력이 없습니다.</p>}
            </details>
            {data.canManage ? (
              <button
                type="button"
                className="admin-term-publish-trigger"
                onClick={() => openPublish(document)}
              >
                새 버전 게시
              </button>
            ) : null}
          </article>
        ))}
      </div>
      {!isLoading && (data?.items.length ?? 0) === 0 ? (
        <div className="admin-operational-empty">등록된 약관 문서가 없습니다.</div>
      ) : null}

      {selectedDocument ? (
        <div
          className="admin-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isPublishing) {
              setSelectedDocument(null);
            }
          }}
        >
          <section
            className="admin-dialog admin-term-publish-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="term-publish-title"
          >
            <div className="admin-dialog-heading">
              <div>
                <h2 id="term-publish-title">새 약관 버전 게시</h2>
                <p>{selectedDocument.title}</p>
              </div>
              <button
                type="button"
                aria-label="닫기"
                disabled={isPublishing}
                onClick={() => setSelectedDocument(null)}
              >
                ×
              </button>
            </div>
            <form className="admin-term-publish-form" onSubmit={handlePublish}>
              <label>
                <span>약관 콘텐츠 URL</span>
                <input
                  required
                  type="text"
                  value={contentUrl}
                  placeholder="https://... 또는 /terms/..."
                  onChange={(event) => setContentUrl(event.target.value)}
                />
              </label>
              <label>
                <span>변경 요약</span>
                <textarea
                  maxLength={500}
                  value={changeSummary}
                  placeholder="사용자에게 적용되는 주요 변경 사항을 입력해 주세요."
                  onChange={(event) => setChangeSummary(event.target.value)}
                />
                <small>{changeSummary.length}/500</small>
              </label>
              <div className="admin-dialog-actions">
                <button
                  type="button"
                  disabled={isPublishing}
                  onClick={() => setSelectedDocument(null)}
                >
                  취소
                </button>
                <button type="submit" disabled={isPublishing || !contentUrl.trim()}>
                  {isPublishing ? "게시 중" : "즉시 게시"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function AdminAuditLogTab({ accessToken }: { accessToken: string }) {
  const [draftFilters, setDraftFilters] =
    useState<AdminAuditLogFilters>(defaultAdminAuditLogFilters);
  const [filters, setFilters] =
    useState<AdminAuditLogFilters>(defaultAdminAuditLogFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<AdminAuditLogPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAuditLog = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError("");
    try {
      setData(await fetchAdminAuditLog(accessToken, filters, currentPage));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "감사 로그를 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, currentPage, filters]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadAuditLog(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadAuditLog]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCurrentPage(1);
    setFilters({ ...draftFilters, action: draftFilters.action.trim() });
  }

  return (
    <section className="admin-operational-page">
      <form className="admin-operational-filters" onSubmit={applyFilters}>
        <label className="admin-operational-search">
          <span>작업 코드</span>
          <input
            type="search"
            value={draftFilters.action}
            placeholder="예: terms.version.publish"
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                action: event.target.value,
              }))
            }
          />
        </label>
        <label>
          <span>결과</span>
          <select
            value={draftFilters.result}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                result: event.target.value,
              }))
            }
          >
            <option value="all">전체</option>
            <option value="success">성공</option>
            <option value="failure">실패</option>
          </select>
        </label>
        <button type="submit">조회</button>
      </form>

      <section className="admin-operational-table-card">
        <div className="admin-operational-table-heading">
          <strong>감사 이벤트</strong>
          <span>
            {data?.pagination.totalItems.toLocaleString("ko-KR") ?? "0"}건
          </span>
        </div>
        {error ? <p className="admin-operational-error">{error}</p> : null}
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>일시</th>
                <th>작업</th>
                <th>실행자</th>
                <th>대상</th>
                <th>결과</th>
                <th>세부 정보</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((item) => (
                <tr key={item.id}>
                  <td>{adminDirectoryDateTime(item.createdAt)}</td>
                  <td>
                    <strong>{adminAuditActionLabel(item.action)}</strong>
                    <small className="admin-operational-code">{item.action}</small>
                  </td>
                  <td>{adminDirectoryPersonLabel(item.actor)}</td>
                  <td>{adminDirectoryPersonLabel(item.target)}</td>
                  <td>
                    <span className={`admin-operational-result admin-operational-result--${item.result}`}>
                      {adminAuditResultLabel(item.result)}
                    </span>
                  </td>
                  <td>
                    {Object.keys(item.metadata).length ? (
                      <details className="admin-operational-details">
                        <summary>내용 보기</summary>
                        <pre>{JSON.stringify(item.metadata, null, 2)}</pre>
                      </details>
                    ) : "—"}
                  </td>
                </tr>
              ))}
              {!isLoading && (data?.items.length ?? 0) === 0 ? (
                <EmptyRow colSpan={6} label="조건에 맞는 감사 이벤트가 없습니다." />
              ) : null}
            </tbody>
          </table>
        </div>
        {isLoading ? <p className="admin-operational-loading">감사 로그를 불러오는 중입니다.</p> : null}
        {data ? (
          <OperationalPagination
            pagination={data.pagination}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </section>
    </section>
  );
}

function OverviewTab({
  data,
  isInitialLoading,
  isSuperAdmin,
  onNavigatePrimary,
}: {
  data: AdminConsolePayload;
  isInitialLoading: boolean;
  isSuperAdmin: boolean;
  onNavigatePrimary: (tab: PrimaryAdminTab) => void;
}) {
  const pendingHospitalReviews = data.manualHospitalSubmissions.filter(
    (item) => item.status === "pending_review",
  ).length;
  const pendingMemberships = data.clinicJoinRequests.filter(
    (item) => item.status === "pending",
  ).length;
  const pendingLicenseReviews = pendingLicenseVerificationRequests(
    data.licenseVerificationRequests,
  ).length;
  const activePartnerClinics = data.clinics.filter(
    (clinic) => clinic.isChikapickPartner,
  ).length;

  const shortcutGroups: Array<{
    title: string;
    description: string;
    items: Array<{
      tab: PrimaryAdminTab;
      label: string;
      description: string;
      icon: string;
    }>;
  }> = [
    {
      title: "치과 운영",
      description: "영업부터 가입 심사와 파트너 운영까지 한 곳에서 관리합니다.",
      items: [
        {
          tab: "dental-sales",
          label: "치과 영업 관리",
          description: "전국 치과 영업 현황과 담당자 배정을 관리합니다.",
          icon: "/Type=Graph.svg",
        },
        {
          tab: "partner-clinics",
          label: "파트너 치과 관리",
          description: "가입 완료 치과의 운영 지표와 활동을 확인합니다.",
          icon: "/Type=Hospital.svg",
        },
        {
          tab: "hospital-review",
          label: "병원 가입 심사",
          description: "직접 등록한 병원 정보와 증빙 서류를 검토합니다.",
          icon: "/Type=Accept.svg",
        },
        {
          tab: "license-review",
          label: "치과의사 면허 인증",
          description: "제출된 치과의사 면허증을 승인하거나 반려합니다.",
          icon: "/Type=Accept.svg",
        },
        {
          tab: "clinic-membership-requests",
          label: "소속 신청 관리",
          description: "파트너스 사용자의 치과 소속 신청을 처리합니다.",
          icon: "/Type=Staff.svg",
        },
        {
          tab: "reservations",
          label: "예약 운영 관리",
          description: "전체 예약의 접수 유형과 처리 상태를 조회합니다.",
          icon: "/Type=Diary.svg",
        },
        {
          tab: "consultations",
          label: "전문의 소견 운영",
          description: "전문의 소견 요청과 답변 상태를 조회합니다.",
          icon: "/Type=Response.svg",
        },
      ],
    },
    {
      title: "서비스 및 계정",
      description: "사용자 계정과 서비스 콘텐츠를 조회하고 관리합니다.",
      items: [
        {
          tab: "secret-feedback",
          label: "시크릿 피드백",
          description: "예약 후 제출된 익명 피드백을 확인합니다.",
          icon: "/Type=Opinion.svg",
        },
        {
          tab: "chikapick-accounts",
          label: "치카픽 계정 조회",
          description: "환자 계정과 가족 계정 정보를 조회합니다.",
          icon: "/Type=Family.svg",
        },
        {
          tab: "partner-accounts",
          label: "파트너스 계정 조회",
          description: "파트너스 가입 계정과 소속 정보를 조회합니다.",
          icon: "/Type=Family.svg",
        },
        {
          tab: "partner-invites",
          label: "파트너 초대코드 관리",
          description: "치과별 초대코드 상태와 사용 이력을 관리합니다.",
          icon: "/Type=Settings.svg",
        },
        {
          tab: "memberships",
          label: "멤버십 관리",
          description: "멤버십 제휴 업체와 노출 정보를 관리합니다.",
          icon: "/Type=Ticket.svg",
        },
        {
          tab: "terms-management",
          label: "약관 관리",
          description: "서비스별 약관 버전과 게시 이력을 관리합니다.",
          icon: "/Type=Diary.svg",
        },
      ],
    },
    {
      title: "관리자 운영",
      description: "운영 담당자와 영업 관련 관리자 정보를 관리합니다.",
      items: [
        {
          tab: "admin-accounts",
          label: "어드민 계정 관리",
          description: "어드민 계정의 초대, 권한, 잠금 상태를 관리합니다.",
          icon: "/Type=Mypage.svg",
        },
        {
          tab: "external-connectors",
          label: "외부 연결자 관리",
          description: "영업 배정에 사용할 외부 연결자를 관리합니다.",
          icon: "/Type=Share.svg",
        },
        {
          tab: "audit-log",
          label: "감사 로그",
          description: "어드민 변경 작업과 처리 결과를 조회합니다.",
          icon: "/Type=Log.svg",
        },
        ...(isSuperAdmin
          ? [
              {
                tab: "sales-performance" as const,
                label: "영업 성과 관리",
                description: "월별 계약 성과와 담당자별 실적을 확인합니다.",
                icon: "/Type=Price.svg",
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <div className="admin-overview">
      <section
        className="admin-overview-section"
        aria-labelledby="overview-summary-title"
        aria-busy={isInitialLoading}
      >
        <div className="admin-overview-section-heading">
          <div>
            <h2 id="overview-summary-title">처리 현황</h2>
            <p>현재 확인이 필요한 요청과 운영 중인 파트너 치과 현황입니다.</p>
          </div>
        </div>
        <div className="admin-overview-summary-grid">
          <OverviewSummaryCard
            label="병원 가입 심사 대기"
            value={isInitialLoading ? "—" : pendingHospitalReviews}
            tone="orange"
            onClick={() => onNavigatePrimary("hospital-review")}
          />
          <OverviewSummaryCard
            label="면허 인증 검토 대기"
            value={isInitialLoading ? "—" : pendingLicenseReviews}
            tone="red"
            onClick={() => onNavigatePrimary("license-review")}
          />
          <OverviewSummaryCard
            label="소속 승인 대기"
            value={isInitialLoading ? "—" : pendingMemberships}
            tone="blue"
            onClick={() => onNavigatePrimary("clinic-membership-requests")}
          />
          <OverviewSummaryCard
            label="활성 파트너 치과"
            value={isInitialLoading ? "—" : activePartnerClinics}
            tone="green"
            onClick={() => onNavigatePrimary("partner-clinics")}
          />
        </div>
      </section>

      {shortcutGroups.map((group) => (
        <section className="admin-overview-section" key={group.title}>
          <div className="admin-overview-section-heading">
            <div>
              <h2>{group.title}</h2>
              <p>{group.description}</p>
            </div>
          </div>
          <div className="admin-overview-shortcut-grid">
            {group.items.map((item) => (
              <button
                type="button"
                className="admin-overview-shortcut"
                key={item.tab}
                onClick={() => onNavigatePrimary(item.tab)}
              >
                <span className="admin-overview-shortcut-icon" aria-hidden="true">
                  <span style={maskIcon(item.icon)} />
                </span>
                <span className="admin-overview-shortcut-copy">
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </span>
                <span className="admin-overview-shortcut-arrow" aria-hidden="true">
                  →
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}

      <section className="admin-overview-section" aria-labelledby="overview-operations-title">
        <div className="admin-overview-section-heading">
          <div>
            <h2 id="overview-operations-title">백그라운드 운영 상태</h2>
            <p>자동 처리 큐와 최근 작업 상태를 확인합니다.</p>
          </div>
        </div>
        <div className="admin-overview-operation-grid">
          <div>
            <span>AI 설명 생성 대기</span>
            <strong>{data.operations.aiPendingCount.toLocaleString("ko-KR")}건</strong>
          </div>
          <div>
            <span>진료시간 보강 대기</span>
            <strong>
              {data.operations.hiraOperatingHoursPendingCount.toLocaleString("ko-KR")}건
            </strong>
          </div>
          <div className="admin-overview-operation-note">
            <span>최근 작업 메모</span>
            <strong>{data.operations.recentJobNote ?? "기록 없음"}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

function OverviewSummaryCard({
  label,
  onClick,
  tone,
  value,
}: {
  label: string;
  onClick: () => void;
  tone: "blue" | "orange" | "green" | "red";
  value: number | string;
}) {
  const displayValue =
    typeof value === "number" ? value.toLocaleString("ko-KR") : value;
  return (
    <button
      type="button"
      className={`admin-overview-summary admin-overview-summary--${tone}`}
      onClick={onClick}
      aria-label={`${label} ${displayValue}건 보기`}
    >
      <span>{label}</span>
      <strong>{displayValue}</strong>
      <small>
        바로가기 <span aria-hidden="true">→</span>
      </small>
    </button>
  );
}

function ManualHospitalReviewTab({
  accessToken,
  onApprove,
  onReject,
}: {
  accessToken: string;
  onApprove: (id: string) => Promise<boolean>;
  onReject: (id: string, note: string) => Promise<boolean>;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState<AdminManualHospitalSubmissionsPayload | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionSubmissionId, setActionSubmissionId] = useState<string | null>(null);
  const [rejectionTarget, setRejectionTarget] =
    useState<ManualHospitalSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  const loadSubmissions = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setErrorMessage("");
    try {
      setData(await fetchAdminManualHospitalSubmissions(accessToken, currentPage));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "병원 가입 심사 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, currentPage]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadSubmissions(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadSubmissions]);

  const pagination = data?.pagination;
  const pageNumbers = dentalSalesPageNumbers(
    pagination?.page ?? currentPage,
    pagination?.totalPages ?? 1,
  );

  async function handleApprove(item: ManualHospitalSubmission) {
    if (!window.confirm(`${item.hospitalName} 가입 요청을 승인하시겠습니까?`)) return;
    setActionSubmissionId(item.id);
    const succeeded = await onApprove(item.id);
    if (succeeded) await loadSubmissions();
    setActionSubmissionId(null);
  }

  function openRejection(item: ManualHospitalSubmission) {
    setRejectionTarget(item);
    setRejectionReason("");
    setRejectionError("");
  }

  function closeRejection() {
    if (actionSubmissionId) return;
    setRejectionTarget(null);
    setRejectionReason("");
    setRejectionError("");
  }

  async function submitRejection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rejectionTarget) return;
    const reason = normalizeManualHospitalRejectionReason(rejectionReason);
    if (!reason) {
      setRejectionError("반려 사유를 입력해 주세요.");
      return;
    }

    setActionSubmissionId(rejectionTarget.id);
    setRejectionError("");
    const succeeded = await onReject(rejectionTarget.id, reason);
    if (succeeded) {
      setRejectionTarget(null);
      setRejectionReason("");
      await loadSubmissions();
    }
    setActionSubmissionId(null);
  }

  return (
    <section className="admin-hospital-review">
      {errorMessage ? (
        <div className="admin-sales-feedback admin-sales-feedback--error" role="alert">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => void loadSubmissions()}>
            다시 시도
          </button>
        </div>
      ) : null}

      <div className="admin-hospital-review-table-card" aria-busy={isLoading}>
        <header>
          총 {pagination ? `${pagination.totalItems.toLocaleString("ko-KR")}건` : "—"}
        </header>
        <div className="admin-hospital-review-table-scroll">
          <table className="admin-hospital-review-table">
            <colgroup>
              <col className="admin-hospital-review-col-name" />
              <col className="admin-hospital-review-col-phone" />
              <col className="admin-hospital-review-col-address" />
              <col className="admin-hospital-review-col-file" />
              <col className="admin-hospital-review-col-account" />
              <col className="admin-hospital-review-col-date" />
              <col className="admin-hospital-review-col-status" />
            </colgroup>
            <thead>
              <tr>
                <th>병원명</th>
                <th>대표 전화번호</th>
                <th>병원주소</th>
                <th>첨부파일</th>
                <th>요청자 계정</th>
                <th>요청 일시</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((item) => {
                const isPending = item.status === "pending_review";
                const isActing = actionSubmissionId === item.id;
                return (
                  <tr key={item.id}>
                    <td title={item.hospitalName}>{item.hospitalName}</td>
                    <td>{item.representativePhone || "-"}</td>
                    <td title={item.address}>{item.address || "-"}</td>
                    <td title={item.businessLicenseFileName}>
                      {item.businessLicenseUrl ? (
                        <a
                          href={item.businessLicenseUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.businessLicenseFileName}
                        </a>
                      ) : (
                        <span>{item.businessLicenseFileName}</span>
                      )}
                    </td>
                    <td title={manualHospitalRequestAccount(item)}>
                      {manualHospitalRequestAccount(item)}
                    </td>
                    <td>{manualHospitalReviewDate(item.createdAt)}</td>
                    <td>
                      {isPending ? (
                        <>
                          <span className="admin-visually-hidden">심사 대기</span>
                          <div className="admin-hospital-review-actions">
                            <button
                              type="button"
                              disabled={isActing}
                              aria-label={`${item.hospitalName} 승인`}
                              onClick={() => void handleApprove(item)}
                            >
                              승인
                            </button>
                            <button
                              type="button"
                              disabled={isActing}
                              aria-label={`${item.hospitalName} 반려`}
                              onClick={() => openRejection(item)}
                            >
                              반려
                            </button>
                          </div>
                        </>
                      ) : (
                        <span
                          className={`admin-hospital-review-status admin-hospital-review-status--${item.status}`}
                        >
                          {manualHospitalReviewStatusLabel(item.status)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!isLoading && (data?.items.length ?? 0) === 0 ? (
                <tr>
                  <td className="admin-sales-empty" colSpan={7}>
                    검토할 병원 가입 신청이 없습니다.
                  </td>
                </tr>
              ) : null}
              {isLoading && !data ? (
                <tr>
                  <td className="admin-sales-empty" colSpan={7}>
                    병원 가입 심사 목록을 불러오는 중입니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {pagination ? (
          <nav className="admin-sales-pagination" aria-label="병원 가입 심사 목록 페이지">
            <button
              type="button"
              aria-label="이전 페이지"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              ‹
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                type="button"
                key={pageNumber}
                className={
                  pageNumber === pagination.page ? "admin-sales-page-active" : undefined
                }
                aria-current={pageNumber === pagination.page ? "page" : undefined}
                disabled={isLoading}
                onClick={() => setCurrentPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              aria-label="다음 페이지"
              disabled={pagination.page >= pagination.totalPages || isLoading}
              onClick={() =>
                setCurrentPage((page) => Math.min(pagination.totalPages, page + 1))
              }
            >
              ›
            </button>
          </nav>
        ) : null}
      </div>

      {rejectionTarget ? (
        <div className="admin-hospital-review-dialog-layer">
          <button
            type="button"
            className="admin-hospital-review-dialog-backdrop"
            aria-label="반려 사유 입력 닫기"
            onClick={closeRejection}
          />
          <section
            className="admin-hospital-review-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-hospital-review-dialog-title"
          >
            <h2 id="admin-hospital-review-dialog-title">병원 가입 요청 반려</h2>
            <p>{rejectionTarget.hospitalName} 신청자에게 전달할 사유를 입력해 주세요.</p>
            <form onSubmit={submitRejection}>
              <label>
                <span>반려 사유</span>
                <textarea
                  autoFocus
                  value={rejectionReason}
                  maxLength={1000}
                  placeholder="예: 사업자등록증의 내용을 식별할 수 없습니다."
                  onChange={(event) => {
                    setRejectionReason(event.target.value);
                    setRejectionError("");
                  }}
                />
              </label>
              {rejectionError ? <p role="alert">{rejectionError}</p> : null}
              <div>
                <button type="button" disabled={Boolean(actionSubmissionId)} onClick={closeRejection}>
                  취소
                </button>
                <button type="submit" disabled={Boolean(actionSubmissionId)}>
                  {actionSubmissionId ? "처리 중" : "반려"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function LicenseReviewTab({
  data,
  isLoading,
  onDecision,
}: {
  data: AdminConsolePayload;
  isLoading: boolean;
  onDecision: (userId: string, approved: boolean, note: string) => Promise<boolean>;
}) {
  const [processingDecision, setProcessingDecision] = useState<{
    approved: boolean;
    userId: string;
  } | null>(null);
  const [rejectionTarget, setRejectionTarget] = useState<{
    displayName: string;
    userId: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [isApprovalCompleteOpen, setIsApprovalCompleteOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement>(null);
  const approvalConfirmRef = useRef<HTMLButtonElement>(null);
  const rejectionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const summary = summarizeLicenseVerifications(data.licenseVerificationRequests);
  const pendingRequests = pendingLicenseVerificationRequests(
    data.licenseVerificationRequests,
  );
  const metrics = [
    { label: "소속 치과 의사 전체 가입자 수", value: summary.total },
    { label: "면허 인증 완료 수", value: summary.approved },
    { label: "승인 요청 수", value: summary.pending, isPending: true },
    { label: "미요청 수", value: summary.unrequested },
  ];

  useEffect(() => {
    if (!rejectionTarget && !isApprovalCompleteOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      if (isApprovalCompleteOpen) approvalConfirmRef.current?.focus();
      else rejectionTextareaRef.current?.focus();
    }, 0);
    const trigger = lastTriggerRef.current;
    const section = sectionRef.current;
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
      else section?.focus();
    };
  }, [isApprovalCompleteOpen, rejectionTarget]);

  async function approve(userId: string, trigger: HTMLButtonElement) {
    lastTriggerRef.current = trigger;
    setProcessingDecision({ approved: true, userId });
    try {
      const approved = await onDecision(userId, true, "");
      if (approved) setIsApprovalCompleteOpen(true);
    } finally {
      setProcessingDecision(null);
    }
  }

  function openRejection(
    userId: string,
    displayName: string,
    trigger: HTMLButtonElement,
  ) {
    lastTriggerRef.current = trigger;
    setRejectionReason("");
    setRejectionError("");
    setRejectionTarget({ displayName, userId });
  }

  function closeRejection() {
    if (processingDecision) return;
    setRejectionTarget(null);
    setRejectionReason("");
    setRejectionError("");
  }

  async function reject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rejectionTarget) return;
    const reason = normalizeLicenseRejectionReason(rejectionReason);
    if (!reason) {
      setRejectionError("반려 사유를 입력해 주세요.");
      rejectionTextareaRef.current?.focus();
      return;
    }
    setRejectionError("");
    setProcessingDecision({ approved: false, userId: rejectionTarget.userId });
    try {
      const rejected = await onDecision(rejectionTarget.userId, false, reason);
      if (rejected) {
        setRejectionTarget(null);
        setRejectionReason("");
      }
    } finally {
      setProcessingDecision(null);
    }
  }

  function keepDecisionModalFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      if (processingDecision) return;
      event.preventDefault();
      if (isApprovalCompleteOpen) setIsApprovalCompleteOpen(false);
      else closeRejection();
      return;
    }
    if (event.key !== "Tab") return;
    const focusableElements = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'textarea:not([disabled]), button:not([disabled])',
      ),
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);
    if (!firstElement || !lastElement) return;
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <section
      ref={sectionRef}
      className="admin-license-review"
      aria-busy={isLoading}
      tabIndex={-1}
    >
      <div className="admin-license-summary" aria-label="면허 인증 현황">
        {metrics.map((metric) => (
          <article
            className={metric.isPending ? "is-pending" : undefined}
            key={metric.label}
          >
            <p>
              {metric.label}
              {metric.isPending ? <span>NEW</span> : null}
            </p>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </div>

      <div className="admin-license-request-grid">
        {pendingRequests.map((item) => {
          const submission = item.latestSubmission;
          if (!submission) return null;
          const isProcessing = processingDecision?.userId === item.userId;
          const displayName = item.displayName ?? "이름 없음";
          return (
            <article className="admin-license-request-card" key={item.userId}>
              <header>
                <h2>{displayName}</h2>
                <p title={item.email ?? undefined}>{item.email ?? item.userId}</p>
              </header>
              <dl>
                <div>
                  <dt>소속 치과</dt>
                  <dd title={item.clinicName}>{item.clinicName}</dd>
                </div>
                <div>
                  <dt>직책</dt>
                  <dd>{licenseMembershipRoleLabel(item.membershipRole)}</dd>
                </div>
                <div>
                  <dt>요청 시간</dt>
                  <dd>{licenseRequestTimeLabel(submission.submittedAt)}</dd>
                </div>
                <div>
                  <dt>첨부 파일</dt>
                  <dd className="admin-license-file">
                    {submission.signedUrl ? (
                      <a
                        href={submission.signedUrl}
                        rel="noreferrer"
                        target="_blank"
                        title={submission.fileName}
                      >
                        {submission.fileName}
                      </a>
                    ) : (
                      <span title={submission.fileName}>{submission.fileName}</span>
                    )}
                  </dd>
                </div>
              </dl>
              <footer>
                <button
                  type="button"
                  disabled={isLoading || processingDecision !== null}
                  onClick={(event) =>
                    openRejection(item.userId, displayName, event.currentTarget)
                  }
                >
                  {isProcessing && !processingDecision.approved ? "처리 중" : "반려"}
                </button>
                <button
                  type="button"
                  disabled={isLoading || processingDecision !== null}
                  onClick={(event) => void approve(item.userId, event.currentTarget)}
                >
                  {isProcessing && processingDecision.approved ? "처리 중" : "승인"}
                </button>
              </footer>
            </article>
          );
        })}
        {!isLoading && pendingRequests.length === 0 ? (
          <p className="admin-license-empty">현재 승인 요청이 없습니다.</p>
        ) : null}
        {isLoading && data.licenseVerificationRequests.length === 0 ? (
          <p className="admin-license-empty">면허 인증 요청을 불러오는 중입니다.</p>
        ) : null}
      </div>

      {rejectionTarget ? (
        <div className="admin-license-decision-layer">
          <button
            className="admin-license-decision-backdrop"
            type="button"
            aria-label="면허 인증 반려 창 닫기"
            disabled={processingDecision !== null}
            onClick={closeRejection}
          />
          <div
            className="admin-license-decision-modal admin-license-decision-modal--reject"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-license-reject-title"
            onKeyDown={keepDecisionModalFocus}
          >
            <h2 id="admin-license-reject-title">반려</h2>
            <form onSubmit={reject}>
              <label>
                <span className="admin-visually-hidden">
                  {rejectionTarget.displayName} 치과의사 면허 인증 반려 사유
                </span>
                <textarea
                  ref={rejectionTextareaRef}
                  id="admin-license-reject-description"
                  value={rejectionReason}
                  aria-invalid={rejectionError ? "true" : undefined}
                  aria-describedby={
                    rejectionError ? "admin-license-reject-error" : undefined
                  }
                  disabled={processingDecision !== null}
                  maxLength={1000}
                  placeholder="반려 사유를 입력해 주세요. 입력한 사유는 신청자에게 전달됩니다."
                  onChange={(event) => {
                    setRejectionReason(event.target.value);
                    if (rejectionError) setRejectionError("");
                  }}
                />
              </label>
              {rejectionError ? (
                <p id="admin-license-reject-error" role="alert">
                  {rejectionError}
                </p>
              ) : null}
              <footer>
                <button
                  type="button"
                  disabled={processingDecision !== null}
                  onClick={closeRejection}
                >
                  취소
                </button>
                <button type="submit" disabled={processingDecision !== null}>
                  {processingDecision ? "처리 중" : "반려"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}

      {isApprovalCompleteOpen ? (
        <div className="admin-license-decision-layer">
          <button
            className="admin-license-decision-backdrop"
            type="button"
            aria-label="면허 인증 승인 완료 창 닫기"
            onClick={() => setIsApprovalCompleteOpen(false)}
          />
          <div
            className="admin-license-decision-modal admin-license-decision-modal--approved"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-license-approved-title"
            aria-describedby="admin-license-approved-description"
            onKeyDown={keepDecisionModalFocus}
          >
            <Image src="/Type=Checkmark.svg" alt="" width={64} height={64} />
            <h2 id="admin-license-approved-title">승인 완료</h2>
            <p id="admin-license-approved-description">
              치과의사 면허 인증이 승인되었습니다.
              <br />
              치과 면허증은 소속 치과 관리 정보에서 조회 가능합니다.
            </p>
            <button
              ref={approvalConfirmRef}
              type="button"
              onClick={() => setIsApprovalCompleteOpen(false)}
            >
              확인
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StatusChip({ status }: { status: string }) {
  return <span className={`admin-status admin-status--${status}`}>{statusLabel(status)}</span>;
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td className="admin-empty-cell" colSpan={colSpan}>
        {label}
      </td>
    </tr>
  );
}

function maskIcon(icon: string): React.CSSProperties {
  return {
    WebkitMaskImage: `url(${icon})`,
    maskImage: `url(${icon})`,
  };
}
