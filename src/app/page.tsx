"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";

import {
  approveManualHospitalSubmission,
  assignAdminDentalSalesperson,
  createAdminDentalSalesVisit,
  fetchAdminConsole,
  fetchAdminDentalSales,
  fetchAdminDentalSalesDetail,
  inviteAdminAccount,
  rejectManualHospitalSubmission,
  revokeInvite,
  sendAdminPasswordReset,
  unlockAdminAccount,
  updateClinicMembership,
  updateLicenseVerification,
  type AdminConsolePayload,
  type AdminMetric,
  type AdminAccountRole,
} from "@/lib/admin-api";
import { shouldAutoLoadAdminConsole } from "@/lib/admin-auth-session";
import {
  adminAccountStatusLabel,
  reservationSourceLabel,
  statusLabel,
} from "@/lib/admin-display";
import { shouldExpireAdminIdleSession } from "@/lib/admin-idle";
import {
  registerCurrentAdminBrowserSession,
  startAdminSessionHeartbeat,
} from "@/lib/browser-session";
import {
  dentalSalesDetailLabel,
  dentalSalesDetailOptions,
  dentalSalesPageNumbers,
  dentalSalesStatusLabel,
  dentalSalesStatusOptions,
  dentalSalesVisitDetailOptions,
  emptyDentalSalesFilters,
  type DentalSalesDetailPayload,
  type DentalSalesFilters,
  type DentalSalesListPayload,
  type DentalSalesVisitDetailStatus,
} from "@/lib/dental-sales";
import { signInWithAdminPassword } from "@/lib/password-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type AdminTab =
  | "overview"
  | "manual"
  | "memberships"
  | "licenses"
  | "clinics"
  | "users"
  | "invites"
  | "workflows"
  | "terms"
  | "operations";

const tabs: Array<{
  id: AdminTab;
  label: string;
  icon: string;
}> = [
  { id: "overview", label: "운영 현황", icon: "/Type=Dashboard.svg" },
  { id: "manual", label: "병원 가입 심사", icon: "/Type=Hospital.svg" },
  { id: "memberships", label: "소속 신청 승인", icon: "/Type=Staff.svg" },
  { id: "licenses", label: "면허 인증", icon: "/Type=Response.svg" },
  { id: "clinics", label: "병원 관리", icon: "/Type=Hospital.svg" },
  { id: "users", label: "사용자/권한", icon: "/Type=Staff.svg" },
  { id: "invites", label: "초대코드", icon: "/Type=Settings.svg" },
  { id: "workflows", label: "예약·소견", icon: "/Type=Response.svg" },
  { id: "terms", label: "약관", icon: "/Type=Settings.svg" },
  { id: "operations", label: "운영 도구", icon: "/Type=Dashboard.svg" },
];

const primaryTabs = [
  { id: "dashboard", label: "운영 현황", icon: "/Type=Dashboard.svg" },
  { id: "dental-sales", label: "치과 영업 관리", icon: "/Type=Graph.svg" },
  { id: "partner-clinics", label: "파트너 치과 관리", icon: "/Type=Hospital.svg" },
  { id: "hospital-review", label: "병원 가입 심사", icon: "/Type=Accept.svg", badge: 9 },
  { id: "license-review", label: "의사 면허 인증", icon: "/Type=Accept.svg", badge: 9 },
  { id: "secret-feedback", label: "시크릿 피드백", icon: "/Type=Opinion.svg" },
  { id: "chikapick-accounts", label: "치카픽 계정 조회", icon: "/Type=Family.svg" },
  { id: "partner-accounts", label: "파트너스 계정 조회", icon: "/Type=Family.svg" },
  { id: "sales-performance", label: "영업 성과 관리", icon: "/Type=Price.svg" },
  { id: "memberships", label: "멤버십 관리", icon: "/Type=Ticket.svg" },
  { id: "terms-management", label: "약관 관리", icon: "/Type=Diary.svg" },
  { id: "admin-accounts", label: "어드민 계정 관리", icon: "/Type=Mypage.svg" },
  { id: "external-connectors", label: "외부 연결자 관리", icon: "/Type=Share.svg" },
  { id: "audit-log", label: "감사 로그", icon: "/Type=Log.svg" },
] as const;

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
  invites: [],
  reservations: [],
  consultations: [],
  terms: [],
  operations: {
    aiPendingCount: 0,
    hiraOperatingHoursPendingCount: 0,
    recentJobNote: null,
  },
};

export default function AdminHome() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [activePrimaryTab, setActivePrimaryTab] = useState<
    (typeof primaryTabs)[number]["id"] | null
  >("dashboard");
  const [consoleData, setConsoleData] = useState<AdminConsolePayload>(emptyConsole);
  const [isLoadingConsole, setIsLoadingConsole] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [message, setMessage] = useState("");
  const [actionNote, setActionNote] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminAccountRole>("admin");

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const lastAutoLoadedAccessTokenRef = useRef<string | null>(null);
  const lastActivityAtRef = useRef(0);

  const loadConsole = useCallback(
    async (currentSession: Session | null) => {
      if (!currentSession?.access_token) return;
      setIsLoadingConsole(true);
      setMessage("");
      try {
        await registerCurrentAdminBrowserSession(supabase);
        const payload = await fetchAdminConsole(currentSession.access_token);
        setConsoleData(payload);
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
        setMessage("세션이 만료되어 다시 로그인해 주세요.");
      },
    });
  }, [session, supabase]);

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
      setActionNote("");
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
            {primaryTabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                className={activePrimaryTab === tab.id ? "admin-nav-active" : undefined}
                aria-current={activePrimaryTab === tab.id ? "page" : undefined}
                onClick={() => setActivePrimaryTab(tab.id)}
              >
                <span className="admin-nav-icon" style={maskIcon(tab.icon)} />
                <span className="admin-nav-label">{tab.label}</span>
                {"badge" in tab ? <span className="admin-nav-badge">{tab.badge}</span> : null}
              </button>
            ))}
          </div>
          <div className="admin-navigation-legacy">
            <p>기존 관리 메뉴</p>
            {tabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                className={
                  activePrimaryTab === null && activeTab === tab.id
                    ? "admin-nav-active"
                    : undefined
                }
                aria-current={
                  activePrimaryTab === null && activeTab === tab.id ? "page" : undefined
                }
                onClick={() => {
                  setActivePrimaryTab(null);
                  setActiveTab(tab.id);
                }}
              >
                <span className="admin-nav-icon" style={maskIcon(tab.icon)} />
                <span className="admin-nav-label">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-tools">
            <button type="button" aria-label="검색">
              <Image src="/Type=Search.svg" alt="" width={24} height={24} />
            </button>
            <span className="admin-topbar-divider" aria-hidden="true" />
            <button type="button" aria-label="알림">
              <Image src="/Type=Notification.svg" alt="" width={24} height={24} />
            </button>
            <button type="button" aria-label="도움말">
              <Image src="/Type=Question.svg" alt="" width={24} height={24} />
            </button>
          </div>
        </header>

        <div
          className={`admin-workspace-heading${
            activePrimaryTab === "dental-sales" ? " admin-workspace-heading--sales" : ""
          }`}
        >
          <div>
            <div className="admin-workspace-title-row">
              <h1>
                {activePrimaryTab === "dental-sales"
                  ? "치과 영업 관리"
                  : tabs.find((tab) => tab.id === activeTab)?.label}
              </h1>
              {activePrimaryTab === "dental-sales" ? <DentalSalesInfoTooltip /> : null}
            </div>
            <p>
              {activePrimaryTab === "dental-sales"
                ? "전국 치과를 지역별로 조회하고 초대 코드를 확인 할 수 있으며 영업 현황을 관리합니다."
                : "실제 운영 데이터는 ChikaPick_API 관리자 엔드포인트에서 불러옵니다."}
            </p>
          </div>
          {activePrimaryTab !== "dental-sales" ? (
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

        {message && activePrimaryTab !== "dental-sales" ? (
          <p className="admin-message">{message}</p>
        ) : null}

        <div
          className={`admin-content${
            activePrimaryTab === "dental-sales" ? " admin-content--sales" : ""
          }`}
        >
          {activePrimaryTab === "dental-sales" ? (
            <DentalSalesTab accessToken={session?.access_token ?? ""} />
          ) : activeTab === "overview" ? (
            <OverviewTab data={consoleData} />
          ) : activeTab === "manual" ? (
            <ManualHospitalTab
              data={consoleData}
              note={actionNote}
              onNoteChange={setActionNote}
              onApprove={(id) =>
                runAction((token) => approveManualHospitalSubmission(token, id, actionNote))
              }
              onReject={(id) =>
                runAction((token) => rejectManualHospitalSubmission(token, id, actionNote))
              }
            />
          ) : activeTab === "memberships" ? (
            <MembershipTab
              data={consoleData}
              onApprove={(clinicId, userId) =>
                runAction((token) =>
                  updateClinicMembership(token, clinicId, userId, "active"),
                )
              }
              onReject={(clinicId, userId) =>
                runAction((token) =>
                  updateClinicMembership(token, clinicId, userId, "revoked"),
                )
              }
            />
          ) : activeTab === "licenses" ? (
            <LicenseTab
              data={consoleData}
              note={actionNote}
              onNoteChange={setActionNote}
              onDecision={(userId, approved) =>
                runAction((token) =>
                  updateLicenseVerification(token, userId, approved, actionNote),
                )
              }
            />
          ) : activeTab === "clinics" ? (
            <ClinicsTab data={consoleData} />
          ) : activeTab === "users" ? (
            <UsersTab
              data={consoleData}
              inviteEmail={inviteEmail}
              inviteName={inviteName}
              inviteRole={inviteRole}
              onInviteEmailChange={setInviteEmail}
              onInviteNameChange={setInviteName}
              onInviteRoleChange={setInviteRole}
              onInvite={() =>
                runAction((token) =>
                  inviteAdminAccount(token, {
                    email: inviteEmail,
                    fullName: inviteName,
                    role: inviteRole,
                    redirectTo: adminResetRedirectUrl(),
                  }),
                ).then((ok) => {
                  if (ok) {
                    setInviteEmail("");
                    setInviteName("");
                    setInviteRole("admin");
                  }
                })
              }
              onPasswordReset={(userId) =>
                runAction((token) =>
                  sendAdminPasswordReset(token, userId, adminResetRedirectUrl()),
                )
              }
              onUnlock={(userId) =>
                runAction((token) => unlockAdminAccount(token, userId))
              }
            />
          ) : activeTab === "invites" ? (
            <InvitesTab
              data={consoleData}
              onRevoke={(inviteId) => runAction((token) => revokeInvite(token, inviteId))}
            />
          ) : activeTab === "workflows" ? (
            <WorkflowsTab data={consoleData} />
          ) : activeTab === "terms" ? (
            <TermsTab data={consoleData} />
          ) : (
            <OperationsTab data={consoleData} />
          )}
        </div>
      </section>
    </main>
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

function DentalSalesTab({ accessToken }: { accessToken: string }) {
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
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DentalSalesDetailPayload | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [isSavingVisit, setIsSavingVisit] = useState(false);
  const [visitPage, setVisitPage] = useState(1);
  const [visitForm, setVisitForm] = useState<{
    visitedAt: string;
    salespersonUserId: string;
    detailStatus: DentalSalesVisitDetailStatus;
    note: string;
  }>(() => ({
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

  const loadDetail = useCallback(async () => {
    if (!accessToken || !selectedProfileId) return;
    setIsDetailLoading(true);
    setDetailError("");
    try {
      const payload = await fetchAdminDentalSalesDetail(
        accessToken,
        selectedProfileId,
        visitPage,
      );
      setDetail(payload);
      setVisitForm((form) => ({
        ...form,
        salespersonUserId:
          form.salespersonUserId || payload.profile.assignedSalesperson?.id || "",
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
      if (event.key === "Escape") setSelectedProfileId(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedProfileId]);

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

  async function saveAssignment(salespersonUserId: string) {
    if (!selectedProfileId) return;
    setIsSavingAssignment(true);
    setActionMessage("");
    try {
      const result = await assignAdminDentalSalesperson(
        accessToken,
        selectedProfileId,
        salespersonUserId || null,
      );
      setActionMessage(result.message);
      setVisitForm((form) => ({ ...form, salespersonUserId }));
      await Promise.all([loadDetail(), loadList()]);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "담당자를 변경하지 못했습니다.");
    } finally {
      setIsSavingAssignment(false);
    }
  }

  async function saveVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProfileId || !visitForm.salespersonUserId) return;
    setIsSavingVisit(true);
    setActionMessage("");
    try {
      const result = await createAdminDentalSalesVisit(accessToken, selectedProfileId, {
        visitedAt: new Date(visitForm.visitedAt).toISOString(),
        salespersonUserId: visitForm.salespersonUserId,
        detailStatus: visitForm.detailStatus,
        note: visitForm.note,
      });
      setActionMessage(result.message);
      setVisitForm((form) => ({
        ...form,
        visitedAt: localDateTimeValue(new Date()),
        note: "",
      }));
      setVisitPage(1);
      await Promise.all([loadDetail(), loadList()]);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "방문 기록을 저장하지 못했습니다.");
    } finally {
      setIsSavingVisit(false);
    }
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
                    onClick={() => {
                      setSelectedProfileId(row.id);
                      setDetail(null);
                      setVisitPage(1);
                      setActionMessage("");
                    }}
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

      {selectedProfileId ? (
        <div
          className="admin-sales-drawer-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSelectedProfileId(null);
          }}
        >
          <aside
            className="admin-sales-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="치과 영업 상세"
          >
            <header className="admin-sales-drawer-header">
              <div>
                <p>영업 상세</p>
                <h2>{detail?.profile.clinicName ?? "치과 정보"}</h2>
              </div>
              <button
                type="button"
                aria-label="상세 닫기"
                onClick={() => setSelectedProfileId(null)}
              >
                ×
              </button>
            </header>

            {isDetailLoading && !detail ? (
              <p className="admin-sales-drawer-state">상세 정보를 불러오는 중입니다.</p>
            ) : detailError && !detail ? (
              <div className="admin-sales-drawer-state" role="alert">
                <p>{detailError}</p>
                <button type="button" onClick={() => void loadDetail()}>다시 시도</button>
              </div>
            ) : detail ? (
              <div className="admin-sales-drawer-body">
                <section className="admin-sales-summary">
                  <div className="admin-sales-summary-heading">
                    <span
                      className={`admin-sales-status admin-sales-status--${
                        detail.profile.status === "NOT_VISITED"
                          ? "unvisited"
                          : detail.profile.status === "VISITING"
                            ? "visited"
                            : "joined"
                      }`}
                    >
                      {dentalSalesStatusLabel(detail.profile.status)}
                    </span>
                    <span>{dentalSalesDetailLabel(detail.profile.detailStatus)}</span>
                  </div>
                  <dl>
                    <div><dt>주소</dt><dd>{detail.profile.address}</dd></div>
                    <div><dt>대표 전화</dt><dd>{detail.profile.phone ?? "미등록"}</dd></div>
                    <div><dt>초대코드</dt><dd>{detail.profile.salesCode}</dd></div>
                    <div><dt>가입 시각</dt><dd>{formatAdminDateTime(detail.profile.signedAt)}</dd></div>
                  </dl>
                </section>

                <section className="admin-sales-drawer-section">
                  <h3>담당 영업자</h3>
                  <span className="admin-sales-select-wrap">
                    <select
                      aria-label="담당 영업자 변경"
                      value={detail.profile.assignedSalesperson?.id ?? ""}
                      disabled={isSavingAssignment}
                      onChange={(event) => void saveAssignment(event.target.value)}
                    >
                      <option value="">미지정</option>
                      {detail.salespeople.map((person) => (
                        <option key={person.id} value={person.id}>{person.name}</option>
                      ))}
                    </select>
                  </span>
                </section>

                <section className="admin-sales-drawer-section">
                  <h3>방문 기록 추가</h3>
                  <form className="admin-sales-visit-form" onSubmit={saveVisit}>
                    <label>
                      <span>방문 일시</span>
                      <input
                        type="datetime-local"
                        required
                        value={visitForm.visitedAt}
                        onChange={(event) =>
                          setVisitForm((form) => ({ ...form, visitedAt: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      <span>담당 영업자</span>
                      <select
                        required
                        value={visitForm.salespersonUserId}
                        onChange={(event) =>
                          setVisitForm((form) => ({
                            ...form,
                            salespersonUserId: event.target.value,
                          }))
                        }
                      >
                        <option value="">선택</option>
                        {detail.salespeople.map((person) => (
                          <option key={person.id} value={person.id}>{person.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>상세 상태</span>
                      <select
                        value={visitForm.detailStatus}
                        onChange={(event) =>
                          setVisitForm((form) => ({
                            ...form,
                            detailStatus: event.target.value as DentalSalesVisitDetailStatus,
                          }))
                        }
                      >
                        {dentalSalesVisitDetailOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="admin-sales-visit-note">
                      <span>메모 (선택)</span>
                      <textarea
                        maxLength={2000}
                        value={visitForm.note}
                        onChange={(event) =>
                          setVisitForm((form) => ({ ...form, note: event.target.value }))
                        }
                        placeholder="방문 내용이나 후속 조치를 기록해 주세요."
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={isSavingVisit || !visitForm.salespersonUserId}
                    >
                      {isSavingVisit ? "저장 중" : "방문 기록 저장"}
                    </button>
                  </form>
                </section>

                {actionMessage ? <p className="admin-sales-action-message">{actionMessage}</p> : null}

                <section className="admin-sales-drawer-section">
                  <h3>방문 이력</h3>
                  {detail.visits.length ? (
                    <ol className="admin-sales-visit-list">
                      {detail.visits.map((visit) => (
                        <li key={visit.id}>
                          <div>
                            <strong>{dentalSalesDetailLabel(visit.detailStatus)}</strong>
                            <time>{formatAdminDateTime(visit.visitedAt)}</time>
                          </div>
                          <p>{visit.salesperson.name}</p>
                          {visit.note ? <p>{visit.note}</p> : null}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="admin-sales-drawer-state">아직 방문 기록이 없습니다.</p>
                  )}
                  {detail.visitPagination.totalPages > 1 ? (
                    <nav className="admin-sales-pagination" aria-label="방문 이력 페이지">
                      <button
                        type="button"
                        disabled={visitPage <= 1}
                        onClick={() => setVisitPage((page) => Math.max(1, page - 1))}
                      >‹</button>
                      <span>{visitPage} / {detail.visitPagination.totalPages}</span>
                      <button
                        type="button"
                        disabled={visitPage >= detail.visitPagination.totalPages}
                        onClick={() =>
                          setVisitPage((page) =>
                            Math.min(detail.visitPagination.totalPages, page + 1),
                          )
                        }
                      >›</button>
                    </nav>
                  ) : null}
                </section>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
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

function formatAdminDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function OverviewTab({ data }: { data: AdminConsolePayload }) {
  return (
    <>
      <section className="admin-metric-grid">
        {data.metrics.map((metric) => (
          <MetricCard metric={metric} key={metric.label} />
        ))}
      </section>
      <section className="admin-two-column">
        <Panel title="오늘 처리해야 할 항목">
          <QueueList
            items={[
              ["병원 가입 심사", data.manualHospitalSubmissions.length],
              ["소속 승인 요청", data.clinicJoinRequests.length],
              [
                "면허 미승인",
                data.licenseVerificationRequests.filter((item) => !item.licenseVerified)
                  .length,
              ],
            ]}
          />
        </Panel>
        <Panel title="운영 상태">
          <QueueList
            items={[
              ["AI 설명 대기", data.operations.aiPendingCount],
              ["진료시간 보강 대기", data.operations.hiraOperatingHoursPendingCount],
              ["최근 작업 메모", data.operations.recentJobNote ?? "기록 없음"],
            ]}
          />
        </Panel>
      </section>
    </>
  );
}

function ManualHospitalTab({
  data,
  note,
  onApprove,
  onNoteChange,
  onReject,
}: {
  data: AdminConsolePayload;
  note: string;
  onApprove: (id: string) => void;
  onNoteChange: (value: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <Panel title="수동 병원 가입 심사">
      <textarea
        className="admin-note"
        placeholder="심사 메모를 입력하세요."
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
      />
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>병원</th>
              <th>사업자</th>
              <th>대표자</th>
              <th>연락처</th>
              <th>사업자등록증</th>
              <th>상태</th>
              <th>처리</th>
            </tr>
          </thead>
          <tbody>
            {data.manualHospitalSubmissions.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.hospitalName}</strong>
                  <span>{item.address}</span>
                </td>
                <td>{item.businessName}</td>
                <td>{item.ownerName}</td>
                <td>{item.representativePhone}</td>
                <td>
                  {item.businessLicenseUrl ? (
                    <a
                      className="admin-file-link"
                      href={item.businessLicenseUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.businessLicenseFileName} 열기
                    </a>
                  ) : (
                    item.businessLicenseFileName
                  )}
                </td>
                <td>
                  <StatusChip status={item.status} />
                </td>
                <td>
                  <ActionGroup>
                    <button type="button" onClick={() => onApprove(item.id)}>
                      승인
                    </button>
                    <button type="button" onClick={() => onReject(item.id)}>
                      반려
                    </button>
                  </ActionGroup>
                </td>
              </tr>
            ))}
            {data.manualHospitalSubmissions.length === 0 ? (
              <EmptyRow colSpan={7} label="심사 대기 중인 수동 병원 가입이 없습니다." />
            ) : null}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function MembershipTab({
  data,
  onApprove,
  onReject,
}: {
  data: AdminConsolePayload;
  onApprove: (clinicId: string, userId: string) => void;
  onReject: (clinicId: string, userId: string) => void;
}) {
  return (
    <Panel title="소속 신청 승인">
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>병원</th>
              <th>신청자</th>
              <th>역할</th>
              <th>상태</th>
              <th>신청일</th>
              <th>처리</th>
            </tr>
          </thead>
          <tbody>
            {data.clinicJoinRequests.map((item) => (
              <tr key={`${item.clinicId}-${item.userId}`}>
                <td>{item.clinicName}</td>
                <td>
                  <strong>{item.userName ?? "이름 없음"}</strong>
                  <span>{item.userEmail ?? item.userId}</span>
                </td>
                <td>{roleLabel(item.role)}</td>
                <td>
                  <StatusChip status={item.status} />
                </td>
                <td>{formatDate(item.requestedAt)}</td>
                <td>
                  <ActionGroup>
                    <button type="button" onClick={() => onApprove(item.clinicId, item.userId)}>
                      승인
                    </button>
                    <button type="button" onClick={() => onReject(item.clinicId, item.userId)}>
                      반려
                    </button>
                  </ActionGroup>
                </td>
              </tr>
            ))}
            {data.clinicJoinRequests.length === 0 ? (
              <EmptyRow colSpan={6} label="대기 중인 소속 신청이 없습니다." />
            ) : null}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function LicenseTab({
  data,
  note,
  onDecision,
  onNoteChange,
}: {
  data: AdminConsolePayload;
  note: string;
  onDecision: (userId: string, approved: boolean) => void;
  onNoteChange: (value: string) => void;
}) {
  return (
    <Panel title="치과의사 면허 인증">
      <textarea
        className="admin-note"
        placeholder="인증 처리 메모를 입력하세요."
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
      />
      <div className="admin-card-grid">
        {data.licenseVerificationRequests.map((item) => (
          <article className="admin-record-card" key={item.userId}>
            <div>
              <h3>{item.displayName ?? "이름 없음"}</h3>
              <p>{item.email ?? item.userId}</p>
            </div>
            <dl>
              <div>
                <dt>직책</dt>
                <dd>{item.jobTitle ?? "-"}</dd>
              </div>
              <div>
                <dt>상태</dt>
                <dd>{item.licenseVerified ? "승인완료" : "미승인"}</dd>
              </div>
              {item.latestSubmission ? (
                <>
                  <div>
                    <dt>제출 상태</dt>
                    <dd>{statusLabel(item.latestSubmission.status)}</dd>
                  </div>
                  <div>
                    <dt>제출일</dt>
                    <dd>{formatDate(item.latestSubmission.submittedAt)}</dd>
                  </div>
                  <div>
                    <dt>면허 파일</dt>
                    <dd>
                      {item.latestSubmission.signedUrl ? (
                        <a
                          className="admin-file-link"
                          href={item.latestSubmission.signedUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {item.latestSubmission.fileName} 열기
                        </a>
                      ) : (
                        <span className="admin-file-unavailable">
                          {item.latestSubmission.fileName} 링크 없음
                        </span>
                      )}
                    </dd>
                  </div>
                </>
              ) : (
                <div>
                  <dt>면허 파일</dt>
                  <dd>-</dd>
                </div>
              )}
            </dl>
            <ActionGroup>
              <button type="button" onClick={() => onDecision(item.userId, true)}>
                승인
              </button>
              <button type="button" onClick={() => onDecision(item.userId, false)}>
                반려
              </button>
            </ActionGroup>
          </article>
        ))}
        {data.licenseVerificationRequests.length === 0 ? (
          <EmptyState label="면허 인증 대상이 없습니다." />
        ) : null}
      </div>
    </Panel>
  );
}

function ClinicsTab({ data }: { data: AdminConsolePayload }) {
  return (
    <Panel title="파트너 병원 관리">
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>병원</th>
              <th>연락처</th>
              <th>파트너</th>
              <th>오너</th>
              <th>직원</th>
              <th>등록일</th>
            </tr>
          </thead>
          <tbody>
            {data.clinics.map((clinic) => (
              <tr key={clinic.id}>
                <td>
                  <strong>{clinic.name}</strong>
                  <span>{clinic.address ?? "주소 없음"}</span>
                </td>
                <td>{clinic.phone ?? "-"}</td>
                <td>{clinic.isChikapickPartner ? "예" : "아니오"}</td>
                <td>{clinic.ownerCount}</td>
                <td>{clinic.memberCount}</td>
                <td>{formatDate(clinic.createdAt)}</td>
              </tr>
            ))}
            {data.clinics.length === 0 ? (
              <EmptyRow colSpan={6} label="등록된 병원 데이터가 없습니다." />
            ) : null}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function UsersTab({
  data,
  inviteEmail,
  inviteName,
  inviteRole,
  onInvite,
  onInviteEmailChange,
  onInviteNameChange,
  onInviteRoleChange,
  onPasswordReset,
  onUnlock,
}: {
  data: AdminConsolePayload;
  inviteEmail: string;
  inviteName: string;
  inviteRole: AdminAccountRole;
  onInvite: () => void;
  onInviteEmailChange: (value: string) => void;
  onInviteNameChange: (value: string) => void;
  onInviteRoleChange: (value: AdminAccountRole) => void;
  onPasswordReset: (userId: string) => void;
  onUnlock: (userId: string) => void;
}) {
  return (
    <Panel title="사용자 및 권한 관리">
      <form
        className="admin-inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          onInvite();
        }}
      >
        <label>
          <span>이름</span>
          <input
            value={inviteName}
            onChange={(event) => onInviteNameChange(event.target.value)}
          />
        </label>
        <label>
          <span>이메일</span>
          <input
            inputMode="email"
            type="email"
            value={inviteEmail}
            onChange={(event) => onInviteEmailChange(event.target.value)}
          />
        </label>
        <label>
          <span>역할</span>
          <select
            value={inviteRole}
            onChange={(event) =>
              onInviteRoleChange(event.target.value as AdminAccountRole)
            }
          >
            <option value="admin">admin</option>
            <option value="super_admin">super admin</option>
          </select>
        </label>
        <button type="submit">초대 메일 발송</button>
      </form>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>사용자</th>
              <th>역할</th>
              <th>계정 상태</th>
              <th>소속</th>
              <th>관리자 처리</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((user) => {
              const lockedAt = user.adminSecurity?.lockedAt ?? null;
              const failedLoginCount = user.adminSecurity?.failedLoginCount ?? 0;
              const accountStatus = lockedAt ? "locked" : (user.accountStatus ?? "active");
              const isAdmin =
                user.roles.includes("admin") ||
                user.roles.includes("super_admin") ||
                user.isSuperAdmin === true;

              return (
                <tr key={user.id}>
                  <td>
                    <strong>{user.fullName ?? "이름 없음"}</strong>
                    <span>{user.email ?? user.id}</span>
                  </td>
                  <td>
                    {user.roles.join(", ") || "-"}
                    {user.isSuperAdmin ? (
                      <span className="admin-inline-chip">super admin</span>
                    ) : null}
                  </td>
                  <td>
                    <StatusChip status={accountStatus} />
                    <span>
                      {adminAccountStatusLabel({
                        accountStatus: user.accountStatus,
                        lockedAt,
                      })}
                      {failedLoginCount > 0 ? ` · 실패 ${failedLoginCount}회` : ""}
                      {lockedAt ? ` · ${formatDate(lockedAt)}` : ""}
                    </span>
                  </td>
                  <td>
                    {user.memberships.map((membership) => (
                      <span className="admin-inline-chip" key={membership.clinicId}>
                        {membership.clinicName ?? membership.clinicId} ·{" "}
                        {roleLabel(membership.role)}
                      </span>
                    ))}
                  </td>
                  <td>
                    {isAdmin ? (
                      <ActionGroup>
                        <button type="button" onClick={() => onPasswordReset(user.id)}>
                          비밀번호 메일
                        </button>
                        <button
                          type="button"
                          disabled={!lockedAt}
                          onClick={() => onUnlock(user.id)}
                        >
                          잠금 해제
                        </button>
                      </ActionGroup>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
            {data.users.length === 0 ? (
              <EmptyRow colSpan={5} label="사용자 데이터가 없습니다." />
            ) : null}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function InvitesTab({
  data,
  onRevoke,
}: {
  data: AdminConsolePayload;
  onRevoke: (inviteId: string) => void;
}) {
  return (
    <Panel title="초대코드 관리">
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>병원</th>
              <th>초대 역할</th>
              <th>상태</th>
              <th>발급일</th>
              <th>만료일</th>
              <th>처리</th>
            </tr>
          </thead>
          <tbody>
            {data.invites.map((invite) => (
              <tr key={invite.id}>
                <td>{invite.clinicName ?? "-"}</td>
                <td>{roleLabel(invite.invitedRole)}</td>
                <td>
                  <StatusChip status={invite.status} />
                </td>
                <td>{formatDate(invite.issuedAt)}</td>
                <td>{formatDate(invite.expiresAt)}</td>
                <td>
                  <button
                    className="admin-small-button"
                    type="button"
                    disabled={invite.status !== "active"}
                    onClick={() => onRevoke(invite.id)}
                  >
                    폐기
                  </button>
                </td>
              </tr>
            ))}
            {data.invites.length === 0 ? (
              <EmptyRow colSpan={6} label="초대코드 이력이 없습니다." />
            ) : null}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function WorkflowsTab({ data }: { data: AdminConsolePayload }) {
  return (
    <section className="admin-two-column">
      <Panel title="예약 운영 조회">
        <CompactRows
          rows={data.reservations.map((item) => [
            item.clinicName ?? "병원 없음",
            `${item.patientName ?? "환자"} · ${reservationSourceLabel(
              item.bookingSource,
            )} · ${statusLabel(item.status)}`,
            formatDate(item.scheduledAt ?? item.createdAt),
          ])}
          emptyLabel="예약 데이터가 없습니다."
        />
      </Panel>
      <Panel title="전문의 소견 운영 조회">
        <CompactRows
          rows={data.consultations.map((item) => [
            item.clinicName ?? "병원 없음",
            `${item.title} · ${statusLabel(item.status)}`,
            formatDate(item.createdAt),
          ])}
          emptyLabel="전문의 소견 데이터가 없습니다."
        />
      </Panel>
    </section>
  );
}

function TermsTab({ data }: { data: AdminConsolePayload }) {
  return (
    <Panel title="약관 문서 및 버전">
      <CompactRows
        rows={data.terms.map((term) => [
          term.title,
          `${term.code} · v${term.activeVersion ?? "-"}`,
          term.isRequired ? "필수" : "선택",
        ])}
        emptyLabel="약관 데이터가 없습니다."
      />
    </Panel>
  );
}

function OperationsTab({ data }: { data: AdminConsolePayload }) {
  return (
    <section className="admin-two-column">
      <Panel title="AI/큐 상태">
        <QueueList
          items={[
            ["전문의 소견 AI 설명 대기", data.operations.aiPendingCount],
            ["HIRA 진료시간 보강 대기", data.operations.hiraOperatingHoursPendingCount],
          ]}
        />
      </Panel>
      <Panel title="운영 메모">
        <p className="admin-plain-text">{data.operations.recentJobNote ?? "최근 운영 메모가 없습니다."}</p>
      </Panel>
    </section>
  );
}

function MetricCard({ metric }: { metric: AdminMetric }) {
  return (
    <article className={`admin-metric admin-metric--${metric.tone}`}>
      <span>{metric.label}</span>
      <strong>{metric.value.toLocaleString("ko-KR")}</strong>
    </article>
  );
}

function Panel({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function QueueList({
  items,
}: {
  items: Array<[string, number | string]>;
}) {
  return (
    <div className="admin-queue-list">
      {items.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{typeof value === "number" ? value.toLocaleString("ko-KR") : value}</strong>
        </div>
      ))}
    </div>
  );
}

function CompactRows({
  emptyLabel,
  rows,
}: {
  emptyLabel: string;
  rows: string[][];
}) {
  if (rows.length === 0) return <EmptyState label={emptyLabel} />;
  return (
    <div className="admin-compact-rows">
      {rows.map((row) => (
        <article key={row.join("-")}>
          <strong>{row[0]}</strong>
          <span>{row[1]}</span>
          <em>{row[2]}</em>
        </article>
      ))}
    </div>
  );
}

function ActionGroup({ children }: { children: React.ReactNode }) {
  return <div className="admin-action-group">{children}</div>;
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

function EmptyState({ label }: { label: string }) {
  return <p className="admin-empty-state">{label}</p>;
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    owner: "대표자",
    doctor: "치과의사",
    manager: "관리자",
    staff: "스태프",
  };
  return labels[role] ?? role;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function maskIcon(icon: string): React.CSSProperties {
  return {
    WebkitMaskImage: `url(${icon})`,
    maskImage: `url(${icon})`,
  };
}
