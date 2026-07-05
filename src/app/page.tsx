"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";

import {
  approveManualHospitalSubmission,
  fetchAdminConsole,
  rejectManualHospitalSubmission,
  revokeInvite,
  updateClinicMembership,
  updateLicenseVerification,
  type AdminConsolePayload,
  type AdminMetric,
} from "@/lib/admin-api";
import {
  registerCurrentAdminBrowserSession,
  startAdminSessionHeartbeat,
} from "@/lib/browser-session";
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
  const [consoleData, setConsoleData] = useState<AdminConsolePayload>(emptyConsole);
  const [isLoadingConsole, setIsLoadingConsole] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [message, setMessage] = useState("");
  const [actionNote, setActionNote] = useState("");

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const loadConsole = useCallback(
    async (currentSession = session) => {
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
    [session, supabase],
  );

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setIsAuthLoading(false);
      if (data.session) void loadConsole(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) void loadConsole(nextSession);
      else setConsoleData(emptyConsole);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadConsole, supabase]);

  useEffect(() => {
    if (!session) return;

    return startAdminSessionHeartbeat({
      supabase,
      onSessionInvalidated: async () => {
        await supabase.auth.signOut();
        setSession(null);
        setConsoleData(emptyConsole);
        setMessage("세션이 만료되어 다시 로그인해 주세요.");
      },
    });
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
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    } finally {
      setIsSigningIn(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  async function runAction(action: (accessToken: string) => Promise<unknown>) {
    if (!session?.access_token) return;
    setMessage("");
    try {
      await action(session.access_token);
      setMessage("처리되었습니다.");
      setActionNote("");
      await loadConsole(session);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "처리에 실패했습니다.");
    }
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
        <section className="admin-login-card" aria-labelledby="admin-login-title">
          <div className="admin-brand">
            <span className="admin-brand-symbol">
              <Image
                src="/chikapick_logo.png"
                alt=""
                fill
                sizes="32px"
                priority
              />
            </span>
            <span className="admin-brand-text" aria-label="치카픽">
              <Image
                src="/chikapick_logo_text.svg"
                alt=""
                fill
                sizes="80px"
                priority
              />
            </span>
            <span>어드민</span>
          </div>
          <div>
            <h1 id="admin-login-title">치카픽 운영 콘솔</h1>
            <p>
              병원 가입 심사, 면허 인증, 소속 승인, 사용자 권한과 운영 상태를
              한곳에서 관리합니다.
            </p>
          </div>
          <form className="admin-login-form" onSubmit={handlePasswordSignIn}>
            <label>
              <span>아이디(이메일)</span>
              <input
                autoComplete="username"
                inputMode="email"
                name="email"
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />
            </label>
            <label>
              <span>비밀번호</span>
              <input
                autoComplete="current-password"
                name="password"
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />
            </label>
            <button type="submit" disabled={isSigningIn}>
              {isSigningIn ? "로그인 중" : "로그인"}
            </button>
          </form>
          {message ? <p className="admin-message admin-message--error">{message}</p> : null}
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
              src="/chikapick_logo_text.svg"
              alt=""
              fill
              sizes="68px"
              priority
            />
          </span>
          <span>어드민</span>
        </div>
        <nav>
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={activeTab === tab.id ? "admin-nav-active" : undefined}
              aria-current={activeTab === tab.id ? "page" : undefined}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="admin-nav-icon" style={maskIcon(tab.icon)} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>{tabs.find((tab) => tab.id === activeTab)?.label}</h1>
            <p>실제 운영 데이터는 ChikaPick_API 관리자 엔드포인트에서 불러옵니다.</p>
          </div>
          <div className="admin-topbar-actions">
            <button type="button" onClick={() => loadConsole()}>
              {isLoadingConsole ? "새로고침 중" : "새로고침"}
            </button>
            <button type="button" onClick={signOut}>
              로그아웃
            </button>
          </div>
        </header>

        {message ? <p className="admin-message">{message}</p> : null}

        <div className="admin-content">
          {activeTab === "overview" ? (
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
            <UsersTab data={consoleData} />
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

function UsersTab({ data }: { data: AdminConsolePayload }) {
  return (
    <Panel title="사용자 및 권한 관리">
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>사용자</th>
              <th>역할</th>
              <th>계정 상태</th>
              <th>소속</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.fullName ?? "이름 없음"}</strong>
                  <span>{user.email ?? user.id}</span>
                </td>
                <td>{user.roles.join(", ") || "-"}</td>
                <td>{user.accountStatus ?? "active"}</td>
                <td>
                  {user.memberships.map((membership) => (
                    <span className="admin-inline-chip" key={membership.clinicId}>
                      {membership.clinicName ?? membership.clinicId} ·{" "}
                      {roleLabel(membership.role)}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
            {data.users.length === 0 ? (
              <EmptyRow colSpan={4} label="사용자 데이터가 없습니다." />
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
            `${item.patientName ?? "환자"} · ${item.status}`,
            formatDate(item.scheduledAt ?? item.createdAt),
          ])}
          emptyLabel="예약 데이터가 없습니다."
        />
      </Panel>
      <Panel title="전문의 소견 운영 조회">
        <CompactRows
          rows={data.consultations.map((item) => [
            item.clinicName ?? "병원 없음",
            `${item.title} · ${item.status}`,
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

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending_review: "심사 대기",
    approved: "승인",
    rejected: "반려",
    pending: "대기",
    active: "활성",
    revoked: "회수",
    redeemed: "사용됨",
  };
  return labels[status] ?? status;
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
