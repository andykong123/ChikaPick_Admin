# AGENTS.md

ChikaPick Admin is the internal administrator web console for ChikaPick operations. It is a Next.js App Router application deployed to Vercel and should call `../ChikaPick_API` for all privileged data access and mutations.

Do not put Supabase service-role keys in this app. Browser code must use only Supabase publishable credentials and send the current access token to ChikaPick_API.

After Supabase login, register the browser session through `ChikaPick_API` `/api/v1/auth/session/register` with `appSurface: "admin"` before calling admin endpoints. Keep heartbeat active while the console is open.

User-facing text defaults to Korean. Visual styling should stay close to `../ChikaPick_Partners`: ChikaPick palette, compact admin dashboard density, white surfaces, 8-16px radius depending on component scale, and restrained blue/orange accents.

Static assets referenced by this app must be tracked in git. Reused brand assets currently live in `public/`.

## Current Admin Surfaces

- 수동 병원 가입 심사: pending owner manual hospital submissions, short-lived business-license file links, approve/reject.
- 소속 신청 승인: pending doctor/staff clinic memberships, approve/reject.
- 면허 인증: partner dentist license verification review and approval/rejection.
- 병원 관리: inspect ChikaPick partner clinics, owner counts, active member counts, and registration dates.
- 사용자/권한 관리: inspect users, roles, memberships, and account status.
- 초대코드 관리: inspect invite status and revoke unused invites without exposing plaintext invite codes.
- 예약/전문의 소견 운영 조회: admin-wide operational oversight.
- 약관/운영 도구: terms version overview and operational queue/job status.

## Common Commands

```bash
npm run dev
npm run lint
npm run build
```
