# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

**Important:** Update this file to reflect changes whenever making a commit, especially when your change affects project architecture, commands, testing, conventions, environment variables, database contracts, or API behavior.

**NEVER commit or push without explicit user permission.** Wait for explicit instructions like "Commit.", "Commit and push.", etc.

## Working Rules

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" -> "Write tests for invalid inputs, then make them pass"
- "Fix the bug" -> "Write a test that reproduces it, then make it pass"
- "Refactor X" -> "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Project Essentials

ChikaPick Admin is the internal administrator web console for ChikaPick operations. It is a Next.js 16 App Router application deployed to Vercel and backed by Supabase Auth in the browser.

The canonical GitHub repository is `Heeon-Company/ChikaPick_Admin`, and its default branch is `main`. Keep the local `origin` and the Vercel production project connected to that organization repository and branch.

This repository owns only the admin web UI and browser-side integration glue. All privileged data access and mutations must go through the sibling `../ChikaPick_API` backend under `/api/v1/admin/*` and `/api/v1/auth/session/*`. Database schema, service-role access, RLS policies, RPCs, storage signing, cron jobs, and privileged business logic belong in `../ChikaPick_API`, not this app.

Never put Supabase service-role or secret keys in this app. Browser code must use only Supabase publishable credentials and send the current Supabase access token to ChikaPick API. Do not read privileged Supabase tables directly from Admin browser code.

Admin login posts email/password to `ChikaPick_API` `POST /api/v1/admin/auth/login`, then stores the returned Supabase session locally with the browser Supabase client. This lets the API count failed admin password attempts on the Free Supabase plan. After login, register the browser session with `ChikaPick_API` `POST /api/v1/auth/session/register` using `appSurface: "admin"` before calling admin endpoints. Keep the admin session heartbeat active while the console is open. Manual logout, 1-hour browser inactivity logout, and session-invalidation cleanup must call Supabase sign-out with `{ scope: "local" }` so other Admin sessions on other devices remain active.

The API origin must allow this Admin origin in `ChikaPick_API` `ALLOWED_ORIGINS`. A browser `TypeError: Failed to fetch` with no API route logs often means the request failed CORS preflight or the deployed API route is missing, so verify `OPTIONS` responses and deployed API routes before changing Admin fetch code.

User-facing text defaults to Korean. Keep visual styling close to `../ChikaPick_Partners`: ChikaPick palette, compact admin dashboard density, white surfaces, 8-16px radius depending on component scale, and restrained blue/orange accents. Avoid marketing-style landing pages; the first screen should be the working admin console or login form.

Static assets referenced by this app must be tracked in git. Reused brand assets currently live in `public/`.

## Common Commands

```bash
npm run dev      # Start dev server
npm run test     # Run Node tests for small pure helpers
npm run lint     # Run ESLint
npm run build    # Production build
```

For local development with `ChikaPick_API` on `http://localhost:3000`, run this app on another port, for example:

```bash
npm run dev -- --port 3002
```

Before pushing, always run `npm run test`, `npm run lint`, and `npm run build`.

## Architecture

- `src/app/page.tsx` - Single-page admin console shell, auth state handling, tab navigation, data loading, and action wiring.
- `src/app/globals.css` - ChikaPick admin visual system and responsive layout styles.
- Primary tab canvases are full-width. `primaryTabContentLayouts` assigns each tab a `fluid`, `compact`, or `form` inner layout; keep Figma-defined compact widths and readable form widths in the shared layout-mode CSS instead of adding new per-tab `max-width` rules.
- `src/lib/supabase.ts` - Browser Supabase client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `src/lib/password-auth.ts` - Small password-login helper around Supabase browser auth.
- `src/lib/browser-session.ts` - Admin browser session registration and heartbeat against ChikaPick API.
- `src/lib/session-device.ts` - Browser device/session payload helpers.
- `src/lib/admin-api.ts` - Typed Admin API client wrappers for `ChikaPick_API`.
- `src/lib/admin-platform-operations.ts` - Shared types, filters, Korean labels, and Korea-time presentation for Admin reservations, consultations, clinic-membership requests, partner invites, terms, and audit events.
- `src/lib/external-connectors.ts` - External-connector directory types and Korea-date presentation helper.
- `src/lib/secret-feedback.ts` - Anonymous reservation-feedback types plus Client-aligned rating/tag labels, assets, and Korea-date presentation.
- `src/lib/chikapick-accounts.ts` - Patient account lookup payload plus provider/status/country labels and Korea-time presentation.
- `src/lib/partner-accounts.ts` - Partners account directory/detail payloads plus classification, status, provider, and Korea-time presentation helpers.
- `src/lib/admin-auth-session.ts` - Guards automatic console loading so repeated auth notifications do not trigger repeated fetches for the same access token.
- `src/lib/partner-clinics.ts` - Partner-clinic directory/detail payloads plus Korea-time activity, registration, duration, response-rate, and feedback labels.
- `src/lib/admin-detail-history.ts` - Shared browser-history state for the dental-sales and partner-clinic full-page detail views. Opening a detail pushes history; browser Back/Forward restores the list/detail selection.
- `src/lib/license-verifications.ts` - Dentist-license review summary, pending-request selection, Korea-time request labels, and membership-role labels.
- `src/lib/membership-management.ts` - ChikaPick membership partner/inquiry payloads, registration form contracts and upload validation, category/sort labels, Korea-date formatting, and compact pagination helpers.
- `public/` - Tracked brand/navigation assets used by the admin UI.

Path alias `@/*` maps to `./src/*`.

## Admin API Contracts

The dashboard fetches a compact aggregate payload from `GET /api/v1/admin/console` for review counters, clinic/user summaries, and background-operation counts. Large operational directories use their own server-filtered and paginated endpoints; do not add reservation, consultation, invite, terms-history, external-connector, or audit-log arrays back to the aggregate. Mutations call specific admin endpoints and reload the authoritative destination. User rows include `isSuperAdmin`, `adminAccountType`, and `adminSecurity` so Admin can display super-admin state, distinguish general Admin and sales accounts, and show failed login count and locked accounts before enabling unlock actions.

Dental-sales detail payloads include `canEditAssignment`, which is derived server-side from the current Admin account. Use that flag to expose the 담당자 정보 edit control; the assignment mutation is also enforced as super-admin-only by the API. Salesperson options come from active Admin accounts whose `adminAccountType` is `sales`, external-connector options come from the non-login external-connector records added in account management, and the assignment mutation persists both selections. The detail also includes `hospitalInformation`, a read-only live Partners payload for the linked clinic that powers the 100% completion review popup.

Partner-clinic detail payloads include the live clinic summary, hospital-information completion payload, service-role-aggregated consultation, result-record, reservation, instant-booking, membership/activity, and submitted-feedback metrics, plus Super Admin operator-management capability, active non-sales operator options, append-only operation memo/support-history events, captured reservation-modification timing, and future instant-slot availability. The detail refreshes every 60 seconds while visible. Render these values rather than Figma sample figures; operator changes and operation events must use the Admin API and reload the authoritative detail.

Current Admin API calls:

- `GET /api/v1/admin/console`
- `GET /api/v1/admin/manual-hospital-submissions`
- `POST /api/v1/admin/manual-hospital-submissions/:submissionId/approve`
- `POST /api/v1/admin/manual-hospital-submissions/:submissionId/reject`
- `GET /api/v1/admin/clinic-memberships`
- `PATCH /api/v1/admin/clinic-memberships/:clinicId/:userId`
- `PATCH /api/v1/admin/license-verifications/:userId`
- `GET /api/v1/admin/invites`
- `POST /api/v1/admin/invites/:inviteId/reveal`
- `POST /api/v1/admin/invites/:inviteId/revoke`
- `GET /api/v1/admin/reservations`
- `GET /api/v1/admin/consultations`
- `GET /api/v1/admin/terms`
- `POST /api/v1/admin/terms/:documentId/versions`
- `GET /api/v1/admin/audit-log`
- `POST /api/v1/admin/auth/login`
- `GET /api/v1/admin/accounts`
- `POST /api/v1/admin/accounts/invite`
- `POST /api/v1/admin/accounts/:userId/password-reset`
- `POST /api/v1/admin/accounts/:userId/lock`
- `POST /api/v1/admin/accounts/:userId/unlock`
- `GET /api/v1/admin/external-connectors`
- `POST /api/v1/admin/external-connectors`
- `DELETE /api/v1/admin/external-connectors/:connectorId`
- `GET /api/v1/admin/secret-feedback`
- `POST /api/v1/admin/chikapick-accounts/lookup`
- `POST /api/v1/admin/partner-accounts/search`
- `POST /api/v1/admin/partner-accounts/lookup`
- `GET /api/v1/admin/partner-accounts/:userId`
- `DELETE /api/v1/admin/accounts/:userId`
- `GET /api/v1/admin/dental-sales`
- `GET /api/v1/admin/dental-sales/:profileId`
- `PATCH /api/v1/admin/dental-sales/:profileId`
- `POST /api/v1/admin/dental-sales/:profileId/visits`
- `POST /api/v1/admin/dental-sales/:profileId/business-license`
- `GET /api/v1/admin/sales-performance`
- `GET /api/v1/admin/partner-clinics`
- `GET /api/v1/admin/partner-clinics/:clinicId`
- `PATCH /api/v1/admin/partner-clinics/:clinicId/operations`
- `POST /api/v1/admin/partner-clinics/:clinicId/operation-events`
- `GET /api/v1/admin/memberships`
- `POST /api/v1/admin/memberships`
- `PATCH /api/v1/admin/memberships/:partnerId`
- `DELETE /api/v1/admin/memberships/:partnerId`
- `POST /api/v1/admin/memberships/bulk-action`
- `POST /api/v1/auth/session/register`
- `POST /api/v1/auth/session/heartbeat`

The backend verifies admin authorization through `user_roles.role = 'admin'` and rejects locked admin accounts through `admin_account_security.locked_at`. Logging in with a non-admin Supabase account can authenticate successfully in Supabase but admin session registration and admin API calls should be rejected by the API.

Partner invite codes are revealed only through the authenticated, audited `POST /api/v1/admin/invites/:inviteId/reveal` action. Do not include plaintext codes in the paginated directory response or browser state before an explicit clinic-name click. Legacy hash-only rows cannot be recovered and must show the API's unavailable message.

## Current Admin Surfaces

- 운영 현황: live operational landing dashboard and the only dashboard navigation item. Status-aware cards count pending hospital reviews, pending clinic memberships, pending dentist-license submissions, and active partner clinics; each card routes to the authoritative management surface. Grouped shortcuts expose every current clinic, account/service, and administrator workflow, with Super Admin-only sales performance hidden from other admins. Background queue counts and the latest job note continue to come from the compact Admin console payload. The former `기존 관리 메뉴` and its duplicate components are removed.
- 치과 영업 관리: live nationwide HIRA clinic sales directory from `ChikaPick_API`, with server-owned filters/pagination, regional owner-code copying, status/detail display, an accessible hover/focus status glossary beside the page title, and a responsive full-page detail view. The detail view provides a super-admin-only inline editor whose salesperson list comes from active sales accounts and whose external-connector list comes from the non-login contacts added in 어드민 계정 관리; both assignments are persisted by the API. At 100% hospital-information completion, `등록 정보 검토하기` opens an accessible, responsive, read-only popup ported from the Partners hospital-information page and backed by that clinic's live five-section completion payload. Visit creation/history remains immutable and timestamped. The visit-registration modal stores the custom title inside the existing immutable note contract and persists up to five JPG/PNG/PDF attachments. Business-registration documents are stored in the API-owned private Admin sales bucket, returned through 15-minute signed links, and retain upload history. Both flows enforce signatures and 10MB limits in the API. `NOT_VISITED`, `VISITING`, and `SIGNED` are backend lifecycle states; signed rows show `INFORMATION_MISSING` until all five Partners hospital-information sections are complete, then `ACTIVE`.
- 영업 성과 관리: Super Admin-only monthly `SIGNED` clinic report. The navigation item is hidden from other admins and the API independently returns 403. Month inclusion uses either tracked status timestamp in Korea time, the displayed date is the later timestamp, filters come from active sales accounts and external connectors, and unassigned parties render as `-`. The three summary cards count salesperson-only, external-only, and both-assigned rows after filtering; detail status defaults to `ACTIVE` (`사용중`).
- 파트너 치과 관리: live partner-only clinic directory with server-owned free-text search and 10-row pagination. Rows show representative name, active doctor/staff counts, latest active Partners-device heartbeat, and the clinic registration timestamp. `상세보기` opens a responsive full-page operational dashboard backed by live aggregate metrics; Super Admin can assign an active non-sales operator, and unlocked Admin accounts can append operation memos or support-history records. Reservation modification speed is derived only from captured proposal/reschedule events, future available slots drive the instant-booking activity badge, and the detail refreshes every 60 seconds while visible. `Type=Hospital.svg` is used in the summary card, and the existing accessible read-only hospital-information review remains available from the completion card. Browser Back/Forward restores the default list/detail state, matching 치과 영업 관리 detail navigation. Hospital-information editing remains in Partners.
- 병원 가입 심사: all manual owner hospital submissions with server-owned 10-row pagination, request-account/date/status display, short-lived private business-license links, inline approval, and rejection through a required-reason dialog. Pending, approved, rejected, and cancelled rows remain visible as review history.
- 소속 신청 관리: global, server-paginated pending clinic-membership queue with role and private server-side clinic/user search. Admin can approve or reject requests across every clinic; each mutation reloads the authoritative queue and is audited.
- 치과의사 면허 인증: live actively affiliated owner/doctor counts split into verified, pending, and not-requested states. Pending submissions show the dentist, clinic, title, Korea-time request timestamp, and a short-lived private file link. Approval displays the Figma success dialog only after the API mutation succeeds; rejection requires a trimmed reason in an accessible dialog and sends it through the existing audit-note contract.
- 치카픽 계정 조회: exact-email patient account lookup backed by `ChikaPick_API`. Results are masked by the server by default and show login provider, identity/contact/country fields, patient account status, creation/last-access/withdrawal timestamps, and family-account registration/member names. `마스킹 해제` makes an explicit audited API request; do not expose already-unmasked PII in browser state before that request succeeds.
- 파트너스 계정 조회: server-paginated Partners account directory backed by `ChikaPick_API`, with private server-side name/email/phone/clinic search, current clinic and representative/dentist/staff classification, Partners-device last activity, and UUID-based row detail. `단일 계정 정보 상세 조회하기` opens the Figma full-page exact-email search state with masked email/name/phone, patient country/family registration, Partners clinic/classification, account/activity timestamps, and a dedicated no-result state. `마스킹 해제` requires a separate audited API request; directory and UUID-detail responses continue to omit raw phone data.
- 어드민 계정 관리: server-paginated Admin-only directory with role chips, name/email/ID search, Korea-time last-login/joined dates, invitation/active/locked status, and row actions. Super admins can use the Figma-aligned account-creation modal to invite admin, super-admin, and sales accounts with the required email and role fields; the API's initial display name is derived from the email local part. The Figma row dropdown sends password-reset emails, locks/unlocks accounts, or withdraws Admin access. Lock and withdrawal require confirmation and refresh the server-owned directory; withdrawal revokes Admin sessions without deleting unrelated patient/partner profiles.
- 외부 연결자 관리: Figma-aligned, server-paginated active contact directory with name, affiliation, Korea registration date, responsive table, and super-admin-only registration/deletion. Registration requires both name and affiliation. Deletion is confirmed in the browser and soft-deactivates the API row so it disappears from future 치과 영업 관리 assignment choices without erasing historical references.
- 치카픽 멤버십 관리: live server-paginated partner directory with category/search/sort filters, inline editing, soft deletion, visibility toggles, and audited transactional bulk show/hide/delete actions. `업체 등록` opens the Figma-aligned full-page two-column form for card/detail content, member benefits, inquiry routing, drag-and-drop asset uploads, tags, reorderable list items, and extended-content metadata; the requested `Type=Grip.svg` and `Type=Delete.svg` assets are used on reorderable rows. The compact editor toolbar inserts supported emphasis, list, link, and inline-image Markdown; inline images are signature-validated by the API, uploaded with the partner assets, and replaced with public asset URLs before persistence. The inquiry column shows the API-owned pending request count and requester snapshots; all partner mutations reload the authoritative list and are audited by `ChikaPick_API`.
- 시크릿 피드백: Admin-only submitted reservation-feedback metrics and server-paginated list. `상세보기` opens an anonymous right-side drawer ported from the Client survey and reuses its tracked Piki rating, Safe, and Close assets without exposing patient identity.
- 파트너 초대코드 관리: server-paginated clinic/status/role directory with issuer and lifecycle timestamps. Issuer presentation prefers partner/Admin profile display names and labels issuer-less rows as system-issued. Clicking a clinic name explicitly requests the audited Admin-only reveal action and opens a copy/confirm modal; newly issued codes are decryptable from API-owned ciphertext, while legacy hash-only rows show an unavailable message. Admin may revoke active codes.
- 예약 운영 관리: server-paginated global reservation oversight with clinic/patient search, lifecycle and booking-source filters, 즉시 예약 vs 일반 예약 labels, request context, and cancellation reasons.
- 전문의 소견 운영: server-paginated global consultation oversight with clinic/patient/title search, lifecycle filtering, category, request/response timestamps, and a bounded response preview.
- 약관 관리: Admin-readable immutable version history for every terms document. Only Super Admin can publish a new URL-backed version; publishing atomically increments and activates it, retains prior versions, prevents published content edits/deletion, and writes an audit event.
- 감사 로그: server-paginated Admin audit-event directory with action/result filters, actor/target presentation, and structured metadata details.

병원 가입 승인 성공 시 API가 한 번만 반환하는 직원 초대코드와 만료일을 즉시 복사 모달에 표시합니다. Admin은 평문 코드를 저장하거나 목록에서 재조회하지 않으며, 분실 시 병원 대표자가 Partners `직원 관리`에서 새 코드를 발급합니다.

## Environment Variables

Required in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Browser-safe Supabase publishable key.
- `NEXT_PUBLIC_CHIKAPICK_API_BASE_URL` - ChikaPick API origin, for example `http://localhost:3000` locally or `https://chikapick-api.vercel.app` for deployed API testing.

Remember to configure the matching Admin origin in `ChikaPick_API` `ALLOWED_ORIGINS`, including local ports such as `http://localhost:3002` and the deployed Admin domain.

All three public variables are required at runtime. Admin has no localhost, deployed-API, or dummy-Supabase fallback. Keep `.env.example` tracked and secret-free.
