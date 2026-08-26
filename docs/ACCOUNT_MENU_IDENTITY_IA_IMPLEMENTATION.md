# Account Menu and Identity Information Architecture

**Status:** Implemented on `feat/account-menu-identity-redesign`; pending protected review.

## Purpose

The authenticated user menu is a navigation surface, not a second authorization system and not a catch-all container for every personal task. The platform separates account identity, professional identity, workplace relationship, operational authorization, records, analytics, notifications, and help.

## Canonical destinations

| Surface | Route | Owns | Must not own |
|---|---|---|---|
| Account & security | `/account` | Sign-in identity, name, phone, password, notification/privacy links | Cadre, department, workplace membership, IERS duties |
| Professional profile | `/provider-profile` | Cadre, cadre metadata, licence, specialty, experience, certifications, languages, biography | Sign-in security, institution membership, dated duties |
| Workplaces & access | `/workplaces` | Primary care-delivery context, department context, facility-link requests, institution memberships | IERS role assignment, dated duty acceptance, clinical records |
| My records | `/records` | CPD, certificates, evidence, membership summary, links to canonical identity/access surfaces | Editing security or granting operational access |
| My performance | `/performance-dashboard` | Personal performance insight and comparative views when denominator/cohort are meaningful | Professional identity, institutional authorization |
| Notification preferences | `/account/notifications` | Durable user-scoped email/SMS/push and learning notification choices | Urgent IERS operational dispatch policy |
| Feedback | `/feedback` | Submission plus the user’s own ticket references/statuses | Admin triage or urgent clinical escalation replacement |
| Institution workspace | `/institution` | Institution operations and administration for server-authorized institution access | Local-only role preference as authorization |

## Workspace contract

`useUserRole` remains as a backward-compatible storage hook, but its value is only a local **workspace view preference**. `useWorkspaceAccess` derives institution availability from server-returned administered institutions, active institution memberships, or platform-admin status. Header, global search, and protected institution route gating use that server-aware contract.

An institution route must fail closed when the server does not confirm institution access. A stale local `institution` value must never create access. Provider/individual navigation remains available as the fallback workspace.

## Professional and workplace contract

Cadre is edited from Professional profile through the existing audited `auth.updateMyProfile` path. Facility and department context are edited from Workplaces & access. The provider profile form still supports the legacy workplace fields only when explicitly rendered with `showWorkplaceContext`, preventing accidental duplication in the standard Professional profile page.

The existing provider profile update procedure calculates completion from the merged persisted profile, so saving professional fields does not erase or lower unchanged workplace-related completion state. Facility context is not proof of employment, institution membership, IERS permission, or dated duty.

## Notification contract

Migration `0125` adds one durable `userNotificationPreferences` row per user. The notification router reads/writes this row and retains a short-lived in-memory fallback for rolling deployments where the table is not yet available. The guarded IERS migration sequence and readiness verifier include `0125` and the new table.

## Safety boundaries

No account-menu or profile change may alter the emergency bedside guidance sequence. No workplace link may silently grant IERS product roles, pole scope, department assignment, readiness sign-off, dated duty, or activation response authority. Existing server-side authorization remains authoritative.

## Acceptance criteria

1. The desktop and mobile user menu use Account & security, Professional profile, Workplaces & access, My records, My performance, Notification preferences, Help, Feedback, and Logout labels consistently.
2. Workspace options show Institution only when the server confirms institution access.
3. Direct institution routes fail closed for stale local workspace values and authorization-query failures.
4. Professional profile saves do not write facility or department unless a caller explicitly opts into workplace context.
5. Workplace edits preserve provider profile completion state by calculating from merged persisted data.
6. Feedback history is restricted to the signed-in user and does not expose administrative ticket data.
7. Dynamic module errors produce a safe reload message without exposing raw stacks for chunk-load failures.
8. Migration `0125` is idempotent, included in `db:apply-iers`, and checked by `db:verify-iers`.
9. Build, unit tests, clinical lint, CI-workflow verification, and whitespace checks pass before merge.
10. Before deployment, the branch is rebased against current `origin/main` and open PR file overlap is checked again.
