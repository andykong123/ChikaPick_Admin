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

This repository owns only the admin web UI and browser-side integration glue. All privileged data access and mutations must go through the sibling `../ChikaPick_API` backend under `/api/v1/admin/*` and `/api/v1/auth/session/*`. Database schema, service-role access, RLS policies, RPCs, storage signing, cron jobs, and privileged business logic belong in `../ChikaPick_API`, not this app.

Never put Supabase service-role or secret keys in this app. Browser code must use only Supabase publishable credentials and send the current Supabase access token to ChikaPick API. Do not read privileged Supabase tables directly from Admin browser code.

Admin login posts email/password to `ChikaPick_API` `POST /api/v1/admin/auth/login`, then stores the returned Supabase session locally with the browser Supabase client. This lets the API count failed admin password attempts on the Free Supabase plan. After login, register the browser session with `ChikaPick_API` `POST /api/v1/auth/session/register` using `appSurface: "admin"` before calling admin endpoints. Keep the admin session heartbeat active while the console is open, and handle session invalidation by signing out locally. The Admin UI also applies a 1-hour browser inactivity logout.

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
- `src/lib/supabase.ts` - Browser Supabase client using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `src/lib/password-auth.ts` - Small password-login helper around Supabase browser auth.
- `src/lib/browser-session.ts` - Admin browser session registration and heartbeat against ChikaPick API.
- `src/lib/session-device.ts` - Browser device/session payload helpers.
- `src/lib/admin-api.ts` - Typed Admin API client wrappers for `ChikaPick_API`.
- `src/lib/admin-auth-session.ts` - Guards automatic console loading so repeated auth notifications do not trigger repeated fetches for the same access token.
- `public/` - Tracked brand/navigation assets used by the admin UI.

Path alias `@/*` maps to `./src/*`.

## Admin API Contracts

The console fetches one aggregate payload from `GET /api/v1/admin/console`, then renders all tabs from that payload. Mutations call specific admin endpoints and reload the aggregate payload on success. Reservation rows include `bookingSource` and `instantSlotId` so Admin can distinguish 즉시 예약 from 일반 예약. User rows include `isSuperAdmin` and `adminSecurity` so Admin can display super-admin state, failed login count, and locked accounts before enabling unlock actions.

Current Admin API calls:

- `GET /api/v1/admin/console`
- `POST /api/v1/admin/manual-hospital-submissions/:submissionId/approve`
- `POST /api/v1/admin/manual-hospital-submissions/:submissionId/reject`
- `PATCH /api/v1/admin/clinic-memberships/:clinicId/:userId`
- `PATCH /api/v1/admin/license-verifications/:userId`
- `POST /api/v1/admin/invites/:inviteId/revoke`
- `POST /api/v1/admin/auth/login`
- `POST /api/v1/admin/accounts/invite`
- `POST /api/v1/admin/accounts/:userId/password-reset`
- `POST /api/v1/admin/accounts/:userId/unlock`
- `POST /api/v1/auth/session/register`
- `POST /api/v1/auth/session/heartbeat`

The backend verifies admin authorization through `user_roles.role = 'admin'` and rejects locked admin accounts through `admin_account_security.locked_at`. Logging in with a non-admin Supabase account can authenticate successfully in Supabase but admin session registration and admin API calls should be rejected by the API.

Do not expose plaintext invite codes in Admin. The invite tab should inspect invite status and allow revocation of unused invites only.

## Current Admin Surfaces

- 치과 영업 관리: Figma-matched regional clinic sales table with client-side filters, invite-code copying, status display, and pagination state. It currently uses the design reference rows; live privileged clinic-sales data must wait for a typed `ChikaPick_API` Admin endpoint rather than querying Supabase from the browser.
- 수동 병원 가입 심사: pending owner manual hospital submissions, short-lived business-license file links, approve/reject.
- 소속 신청 승인: pending doctor/staff clinic memberships, approve/reject.
- 면허 인증: partner dentist license verification review and approval/rejection.
- 병원 관리: inspect ChikaPick partner clinics, owner counts, active member counts, and registration dates.
- 사용자/권한 관리: inspect users, roles, memberships, account status, super-admin state, and admin lock state.
- 어드민 계정 관리: super admins invite admin/super-admin accounts by email, send password reset emails, unlock failed-login locks, and rely on API audit logs.
- 초대코드 관리: inspect invite status and revoke unused invites without exposing plaintext invite codes.
- 예약/전문의 소견 운영 조회: admin-wide operational oversight, including 즉시 예약 vs 일반 예약 source labels.
- 약관/운영 도구: terms version overview and operational queue/job status.

## Environment Variables

Required in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Browser-safe Supabase publishable key.
- `NEXT_PUBLIC_CHIKAPICK_API_BASE_URL` - ChikaPick API origin, for example `http://localhost:3000` locally or `https://chikapick-api.vercel.app` for deployed API testing.

Remember to configure the matching Admin origin in `ChikaPick_API` `ALLOWED_ORIGINS`, including local ports such as `http://localhost:3002` and the deployed Admin domain.
