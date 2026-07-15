"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";

import {
  approveManualHospitalSubmission,
  fetchAdminConsole,
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
  emptyDentalSalesFilters,
  filterDentalSalesRows,
  type DentalSalesFilters,
  type DentalSalesRow,
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

const dentalSalesRows: DentalSalesRow[] = [
  {
    city: "서울",
    district: "중랑구",
    neighborhood: "면목본동",
    clinicName: "튼튼치과",
    phone: "02-1234-5678",
    salesperson: "김현우",
    inviteCode: "SU9134",
    status: "미방문",
    detailStatus: "—",
  },
  {
    city: "서울",
    district: "강남구",
    neighborhood: "역삼1동",
    clinicName: "서울미소치과",
    phone: "02-9876-1111",
    salesperson: "김현우",
    inviteCode: "SU6201",
    status: "방문",
    detailStatus: "관심/검토",
  },
  {
    city: "서울",
    district: "송파구",
    neighborhood: "잠실본동",
    clinicName: "잠실행복치과",
    phone: "02-421-2233",
    salesperson: "김지태",
    inviteCode: "SU4284",
    status: "방문",
    detailStatus: "코드전달",
  },
  {
    city: "서울",
    district: "마포구",
    neighborhood: "서교동",
    clinicName: "홍대바른치과",
    phone: "02-334-0909",
    salesperson: "김지태",
    inviteCode: "SU5238",
    status: "가입완료",
    detailStatus: "정보 미입력",
  },
  {
    city: "서울",
    district: "강서구",
    neighborhood: "화곡1동",
    clinicName: "강서스마일치과",
    phone: "02-2601-4521",
    salesperson: "김지태",
    inviteCode: "SU8237",
    status: "미방문",
    detailStatus: "—",
  },
  {
    city: "서울",
    district: "노원구",
    neighborhood: "상계1동",
    clinicName: "노원연세치과",
    phone: "02-931-7720",
    salesperson: "김현우",
    inviteCode: "SU3225",
    status: "가입완료",
    detailStatus: "사용중",
  },
  {
    city: "서울",
    district: "관악구",
    neighborhood: "신림동",
    clinicName: "신림서울치과",
    phone: "02-877-1020",
    salesperson: "김지태",
    inviteCode: "SU8393",
    status: "방문",
    detailStatus: "거절",
  },
  {
    city: "서울",
    district: "영등포구",
    neighborhood: "여의동",
    clinicName: "여의도밝은치과",
    phone: "02-782-5501",
    salesperson: "김현우",
    inviteCode: "SU3230",
    status: "방문",
    detailStatus: "관심/검토",
  },
  {
    city: "서울",
    district: "은평구",
    neighborhood: "불광1동",
    clinicName: "은평플러스치과",
    phone: "02-353-8821",
    salesperson: "김지태",
    inviteCode: "SU3230",
    status: "미방문",
    detailStatus: "—",
  },
  {
    city: "서울",
    district: "광진구",
    neighborhood: "화양동",
    clinicName: "건대좋은치과",
    phone: "02-461-7744",
    salesperson: "김현우",
    inviteCode: "SU3230",
    status: "방문",
    detailStatus: "보류",
  },
];

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
            <h1>
              {activePrimaryTab === "dental-sales"
                ? "치과 영업 관리"
                : tabs.find((tab) => tab.id === activeTab)?.label}
            </h1>
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
            <DentalSalesTab />
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

function DentalSalesTab() {
  const [draftFilters, setDraftFilters] = useState<DentalSalesFilters>({
    ...emptyDentalSalesFilters,
  });
  const [appliedFilters, setAppliedFilters] = useState<DentalSalesFilters>({
    ...emptyDentalSalesFilters,
  });
  const [currentPage, setCurrentPage] = useState(2);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const filteredRows = useMemo(
    () => filterDentalSalesRows(dentalSalesRows, appliedFilters),
    [appliedFilters],
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
    setCurrentPage(2);
  }

  async function copyInviteCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 1600);
    } catch {
      setCopiedCode(null);
    }
  }

  return (
    <>
      <form
        className="admin-sales-filters"
        onSubmit={(event) => {
          event.preventDefault();
          setAppliedFilters({ ...draftFilters });
          setCurrentPage(2);
        }}
      >
        <SalesFilterSelect
          label="시/도 선택"
          value={draftFilters.city}
          options={["서울특별시"]}
          onChange={(value) => updateFilter("city", value)}
        />
        <SalesFilterSelect
          label="구 선택"
          value={draftFilters.district}
          options={[
            "전체",
            ...Array.from(new Set(dentalSalesRows.map((row) => row.district))),
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
          value={draftFilters.salesperson}
          options={["전체", "김현우", "김지태"]}
          onChange={(value) => updateFilter("salesperson", value)}
        />
        <SalesFilterSelect
          label="상태"
          value={draftFilters.status}
          options={["전체", "미방문", "방문", "가입완료"]}
          onChange={(value) => updateFilter("status", value)}
        />
        <SalesFilterSelect
          label="상세 상태"
          value={draftFilters.detailStatus}
          options={["전체", "관심/검토", "코드전달", "정보 미입력", "사용중", "거절", "보류"]}
          onChange={(value) => updateFilter("detailStatus", value)}
        />
        <button className="admin-sales-reset" type="button" onClick={resetFilters}>
          초기화
        </button>
        <button className="admin-sales-submit" type="submit">
          검색
        </button>
      </form>

      <div className="admin-sales-table-scroll">
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
            {filteredRows.map((row) => (
              <tr key={`${row.clinicName}-${row.inviteCode}`}>
                <td>{row.city}</td>
                <td>{row.district}</td>
                <td>{row.neighborhood}</td>
                <td className="admin-sales-clinic-name">{row.clinicName}</td>
                <td className="admin-sales-mono">{row.phone}</td>
                <td>{row.salesperson}</td>
                <td>
                  <span className="admin-sales-invite-code">
                    <span>{row.inviteCode}</span>
                    <button
                      type="button"
                      aria-label={`${row.inviteCode} 초대코드 복사`}
                      onClick={() => void copyInviteCode(row.inviteCode)}
                    >
                      <span className="admin-sales-copy-icon" aria-hidden="true" />
                    </button>
                  </span>
                </td>
                <td>
                  <span
                    className={`admin-sales-status admin-sales-status--${
                      row.status === "미방문"
                        ? "unvisited"
                        : row.status === "방문"
                          ? "visited"
                          : "joined"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td
                  className={`admin-sales-detail-status admin-sales-centered${
                    row.detailStatus === "—" ? " admin-sales-detail-status--empty" : ""
                  }`}
                >
                  {row.detailStatus}
                </td>
                <td className="admin-sales-centered">
                  <button className="admin-sales-detail-button" type="button">
                    상세보기
                  </button>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 ? (
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
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
        >
          ‹
        </button>
        {[1, 2, 3, 4, 5].map((page) => (
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
          onClick={() => setCurrentPage((page) => Math.min(5, page + 1))}
        >
          ›
        </button>
      </nav>
      <span className="admin-visually-hidden" aria-live="polite">
        {copiedCode ? `${copiedCode} 초대코드를 복사했습니다.` : ""}
      </span>
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
  options: string[];
  value: string;
}) {
  return (
    <label className="admin-sales-filter-field">
      <span>{label}</span>
      <span className="admin-sales-select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
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
