# Kiirua End-to-End Onboarding Failure Audit

**Target:** St. Teresa Mission Hospital / Kiirua
**Date:** 12 October 2026
**Scope:** Identity, institution creation, administrator continuity, provider invitation, membership, department mapping, professional evidence, standing roles, dated duties, IERS readiness, CPD, ILSP, QI, notifications, deployment, support, and pilot evidence.
**Audit type:** Repository and workflow audit; no production account or patient data accessed.

## Executive conclusion

The previous fix addressed one real defect: an existing Paeds Resus account could have an `invited` membership but the provider interface classified it as non-pending because `userId` was already populated. The fix correctly makes `membershipStatus === "invited"` the pending-state source of truth.

That fix is necessary but not sufficient for Kiirua onboarding. The process can still fail at multiple points before a safe operational pilot:

1. **The fix is not merged to `origin/main`.** PR #977 is open. The local checkout is on the feature commit while `origin/main` remains behind it.
2. **The provider invitation is not delivered.** `inviteProvider` creates database state but does not send an email, SMS, or durable action notification. The provider must discover the invitation by visiting a dashboard.
3. **The invitation acceptance state is not transactional or fully audited.** Membership activation and roster linking are separate writes. A partial failure can leave contradictory states.
4. **The active invitation can carry an operational responsibility before the provider has a valid standing role, department, evidence, or dated-duty assignment.** This conflicts with the intended separation between membership, standing role, dated duty, acceptance, and readiness.
5. **The repository contains a legacy onboarding router with fake success paths.** It returns generated credentials, sample statistics, successful SSO, successful email delivery, and a “Sample Hospital” dashboard without persisting or enforcing the requested operations. It is not currently imported into the main router, but it is a serious future-regression and operator-confusion risk.
6. **There is no recorded authenticated two-person Kiirua dry run.** Unit tests and staging fixtures do not prove the real user journey on the deployed build and real roles/devices.
7. **Notification failure, account mismatch, stale department data, declined duty coverage, evidence review, downtime, and support ownership remain operationally undefined.** These are the points where a hospital rollout is most likely to stop or become unsafe.

**Decision:** Kiirua should not be described as operationally onboarded yet. It is suitable for a controlled dry run after the P0 controls below are closed.

## Severity model

- **P0 — release/pilot blocker:** Can prevent staff access, create unsafe authority assumptions, cross a security boundary, or make the pilot unverifiable.
- **P1 — first operational month blocker:** May not stop onboarding day but will cause unreliable staffing, governance, or improvement operations.
- **P2 — scale/readiness debt:** Should be addressed before expanding beyond a bounded pilot.

## Failure map

### A. Release and deployment control

| ID | Severity | Failure mode | Evidence | Consequence | Required control |
|---|---|---|---|---|---|
| A1 | P0 | Kiirua invitation fix is not on `origin/main`. | `gh pr view 977`: state `OPEN`; HEAD is `50d5bcc4`; `origin/main` is `481efdf4`. | Production may still run the defective invitation classification. The local branch can create false confidence. | Merge PR #977 through protected CI; verify the merge commit on `origin/main`; perform deployed smoke test. |
| A2 | P0 | No recorded production migration/schema verification for the current invitation path. | `docs/WORK_STATUS.md` has broad pending production verification entries; no Kiirua-specific deployed evidence was found. | Code and database can disagree; membership table or indexes may be absent/different in production. | Verify the exact production schema and record command output in `WORK_STATUS.md`. |
| A3 | P0 | No authenticated deployed account verification. | `AGENTS.md` requires account verification for learner/admin workflows; Kiirua audit checklist remains unchecked. | Local tests can pass while login, route gating, stale cache, mobile rendering, or production auth fails. | Test real disposable admin, existing provider, and new provider accounts on the deployed build. |
| A4 | P1 | No rollback/containment switch for onboarding invitations. | No Kiirua-specific feature flag or operational disable procedure was found. | A bad invitation or role assignment can continue while support investigates. | Add an operational stop rule: disable new invitations, preserve existing memberships, and publish a support route. |

### B. Institution creation and administrator continuity

| ID | Severity | Failure mode | Evidence | Consequence | Required control |
|---|---|---|---|---|---|
| B1 | P0 | The two-admin rule is validated at creation, but continuity is not proven in a real account flow. | `completeOnboarding` requires `secondAdminUserId`; `institution-admins` has minimum-two logic; no Kiirua account test is recorded. | The second admin may not receive access, may not know how to sign in, or may be unable to recover the institution. | Complete an actual two-admin test: both sign in, see the same institution, administer it, and recover after one admin is unavailable. |
| B2 | P1 | Administrator invitations have no expiry or single-use token. | `server/routers/institution-admins.ts` explicitly documents exact-email acceptance with no token or expiry. | A stale pending invite can be accepted long after it should be invalid; auditability and revocation are weak. | Add expiry, cancellation, resend, and single-use acceptance; at minimum add a documented compensating control for the pilot. |
| B3 | P1 | Primary-owner transfer/removal semantics are complex and not exercised with Kiirua data. | `institution-admins.remove` promotes another admin while deleting the grant; no live evidence found. | A departure can leave wrong ownership, no recovery contact, or an unexpected access state. | Dry-run departure, replacement, suspension, and reactivation with audit evidence. |
| B4 | P1 | The onboarding form accepts institution data and departments, but the operational baseline is not yet approved by Kiirua. | `InstitutionalOnboarding.tsx` submits department names; the IERS manual requires canonical departments, poles, shift intervals, escalation and downtime decisions. | Staff may be invited into the wrong department or no department; duties cannot be safely generated. | Hold a signed baseline workshop and approve canonical department IDs, parent/child hierarchy, poles, shift hours, and escalation rules before roster assignment. |

### C. Provider invitation and access

| ID | Severity | Failure mode | Evidence | Consequence | Required control |
|---|---|---|---|---|---|
| C1 | P0 | `inviteProvider` creates an invitation but performs no delivery. | `server/routers/institution.ts` lines 1207–1297 contain DB writes only; no notification dispatch. | Existing staff never know they have been invited unless they independently visit the correct dashboard. New staff may never create an account. | Send a durable in-app action notification plus email/SMS where configured; record attempted, delivered, failed, and retried states. |
| C2 | P0 | The provider UI has no clear single entry instruction at the point of invitation delivery. | The card says to accept from the provider dashboard; Workplaces & Access says to accept from the provider dashboard, but neither is a delivered link or explicit route in the invitation mutation. | Staff can be trapped in a loop: “invited” in the database, but no idea where to act. | Use one instruction: sign in with the invited email → open Workplaces & Access or Provider Dashboard → select Kiirua → Accept institution access. Include a direct route in the notification. |
| C3 | P0 | Email identity mismatch is not handled operationally. | Acceptance requires `LOWER(ctx.user.email) === LOWER(invitedEmail)`. | A staff member using a personal/work email variant cannot accept; an admin may have invited a typo or shared mailbox. | Add pre-send email confirmation, normalized display, resend/change-email flow, and support recovery with an auditable correction. Never silently match by name. |
| C4 | P1 | No decline/reject path for general institution access. | `acceptMembershipInvite` only accepts; pending UI has only an Accept button. | Wrong-person invitations remain pending; providers cannot explicitly say “not me” or decline membership. | Add decline with reason, admin cancellation, and an auditable resolution state. |
| C5 | P1 | Re-invitation resets acceptance but does not clearly reset linked roster state or notify the provider. | `inviteProvider` resets membership fields but no notification or complete state reconciliation is performed. | A previously active or ended row can be re-invited with stale role, department, facility-link, or duty assumptions. | Define an explicit reinvite state machine and test active → ended → reinvited → accepted. |
| C6 | P0 | Acceptance uses two independent updates without a transaction. | `acceptMembershipInvite` updates `institutionMemberships`, then updates `institutionalStaffMembers`. | A failure between writes can produce active membership with an unlinked roster row, or linked roster with failed membership activation. | Wrap membership and staff updates in one transaction; add an idempotent acceptance result and reconciliation check. |
| C7 | P1 | Membership acceptance has no membership-event audit record. | The schema has `institutionMembershipEvents` for removal/suspension/reactivation, but acceptance does not insert an acceptance event. | It is difficult to prove who accepted, when, under which email identity, and whether the roster link followed. | Add `invited`, `accepted`, `declined`, `reinvited`, and `cancelled` event types or an equivalent append-only audit event. |
| C8 | P1 | Pending memberships are queried by account ID or email; email changes and duplicate identities are not reconciled. | `getMyMemberships` filters by `userId OR invitedEmail`. | A changed account email, duplicate user, or shared email can hide or expose the wrong pending relationship. | Make the user identity canonical after verified acceptance; provide controlled email correction and duplicate resolution. |

### D. Role and authority semantics

| ID | Severity | Failure mode | Evidence | Consequence | Required control |
|---|---|---|---|---|---|
| D1 | P0 | `inviteProvider` accepts a `responsibilityRole` and stores it before the provider has department, standing-role, or governance acceptance. | Input includes `responsibilityRole`; it is written to both membership and staff roster. | The interface may make a provider believe that accepting institution access accepts an emergency responsibility. This can create unsafe authority assumptions. | Invitation must create **general institutional membership only**. Assign Departmental Head/ERCo/CPD coordinator through their dedicated appointment workflows, each with explicit acceptance. |
| D2 | P0 | UI wording conflates institution access and responsibility acceptance. | `ProviderInstitutionReadinessCard` renders “Accept responsibility” for non-general roles; the mutation is `acceptMembershipInvite`. | A provider can interpret a membership action as clinical or operational appointment acceptance. | Split actions and labels: “Accept institution access” versus “Accept standing appointment”; never use one mutation for both. |
| D3 | P1 | The legacy responsibility-role enum remains broader than the current six-family operating model. | `institution.ts` still exposes executive, ERC member, UTL, ERTL and responder values in the general provider invitation route. | Old role concepts can re-enter the new onboarding path and bypass the intended role architecture. | Deprecate or remove the legacy route from active product use; map only the approved role families through dedicated procedures. |
| D4 | P0 | Department assignment is text-based in the invitation route. | `inviteProvider` accepts `department: string`; canonical IERS assignment requires `facilityDepartmentId`. | “Theatre”, “Surgery/Theatre”, and duplicate labels can create wrong or unassignable staffing records. | Invite without operational department or resolve to a canonical department ID before enabling assignment. |
| D5 | P1 | Role acceptance and duty acceptance are different workflows but are not demonstrated together. | The repository has dedicated department-head, ERCo and shift-role procedures/tests, but no Kiirua account evidence. | A provider may be active in the institution but absent from the duty workflow or unable to see the correct My Shift task. | Run the exact chain: institution access → canonical department → standing role appointment → acceptance → dated duty → My Shift acceptance. |

### E. Legacy and fake onboarding surface

| ID | Severity | Failure mode | Evidence | Consequence | Required control |
|---|---|---|---|---|---|
| E1 | P0 | Legacy `institution-onboarding` router contains fake mutations and fake statistics. | `server/routers/institution-onboarding.ts`: temporary passwords and activation codes are generated in memory; activation completion returns success without persistence; SSO returns success without configuration; bulk email returns requested count; dashboard returns “Sample Hospital” and zeros. | A future UI or agent can call an apparently successful endpoint and tell Kiirua that staff were imported, emails sent, SSO enabled, or training tracked when none occurred. | Delete the dead router or replace every procedure with a hard failure marked “not supported”; add a CI scan preventing stub onboarding procedures from being imported. |
| E2 | P0 | The legacy router has weak authorization even where it checks anything. | Several procedures are merely `protectedProcedure`; only one checks `ctx.user.role === "admin"`, and none consistently assert the institution relationship. | If reconnected, an authenticated user could request or mutate another institution’s data. | Remove it or enforce `assertInstitutionAccess`/capability checks on every operation; add cross-tenant tests. |
| E3 | P1 | The active onboarding form can show success and navigate to the workspace before the complete operational setup exists. | `InstitutionalOnboarding.tsx` sets `success`, stores a session flag, and navigates after two seconds. | The buyer sees “created” but still lacks canonical departments, roles, notifications, training, payment, and baseline evidence. | Change completion copy to “Institution account created — next setup required” and present a checklist of remaining gates. |

### F. Professional identity and evidence

| ID | Severity | Failure mode | Evidence | Consequence | Required control |
|---|---|---|---|---|---|
| F1 | P0 | Self-entered professional information can be mistaken for verified evidence. | The Kiirua gap audit correctly warns that profile/licence evidence requires institutional review; no Kiirua reviewer assignment or evidence test is recorded. | Unverified licence/cadre/department data may influence staffing or competency decisions. | Define Kiirua’s required evidence, assign a reviewer, require evidence-backed review, and record approved/rejected/pending states. |
| F2 | P1 | Staff can be active institution members without a complete provider profile. | Membership acceptance links the roster row and marks `facilityLinkStatus: linked`; it does not ensure cadre, licence, or department evidence readiness. | The person appears available while remaining ineligible for specific duties. | Keep membership active but show explicit readiness blockers; prevent duty assignment until eligibility and canonical department checks pass. |
| F3 | P1 | Training, CPD attendance, IERS competency, and certificates can be misread as equivalent. | The source of truth explicitly separates these records; the onboarding journey has no live proof that Kiirua leaders understand the distinction. | Leadership may report attendance or certificates as emergency readiness. | Use separate completion labels and train Kiirua administrators on what each record proves and does not prove. |

### G. IERS operations and clinical safety

| ID | Severity | Failure mode | Evidence | Consequence | Required control |
|---|---|---|---|---|---|
| G1 | P0 | No approved Kiirua readiness template or missing-resource action policy. | Existing audit lists the requirement; IERS manual requires nursing, clinical, pharmacy, biomedical and quality approval. | A missing paediatric airway, oxygen, medication, defibrillation or monitoring resource becomes a comment rather than an owned correction. | Approve Immediate vs Accessible checks, owner, due date, evidence, escalation and independent closure review. |
| G2 | P0 | No proven declined-duty replacement process for Kiirua. | The code and manual describe decline and replacement, but the Kiirua checklist remains unchecked. | A staffing gap can remain hidden while the system shows a published roster. | Test accept, decline-with-reason, coverage exception, replacement, new acceptance, and preserved history. |
| G3 | P1 | Night/weekend staffing, cross-cover, emergency activation, downtime and escalation are not baseline inputs. | Required by IERS manual and discovery questions; not confirmed for Kiirua. | The configured roster can be technically valid but operationally impossible. | Freeze local shift intervals, emergency call method, escalation ladder, cross-cover and downtime procedure before first live duty. |
| G4 | P1 | Provider offline information is not safe for live operational changes. | `ProviderToday` states that offline snapshots are read-only and may be stale; this is not yet part of the Kiirua orientation. | Staff may trust a stale roster, duty, or readiness state during connectivity loss. | Train staff that activation, notifications, role acceptance and readiness sign-off require live connection; provide a paper/downtime fallback. |
| G5 | P1 | No independent reviewer and closure governance recorded. | IERS manual requires independent evidence/action review; Kiirua owners are not named. | The same person may submit, approve, and close an action, weakening learning and trust. | Name clinical governance, biomedical, pharmacy, quality and independent closure owners in the implementation record. |

### H. CPD, ILSP and reconciliation

| ID | Severity | Failure mode | Evidence | Consequence | Required control |
|---|---|---|---|---|---|
| H1 | P0 | ILS cohort/order reconciliation is not proven against active linked members. | Kiirua audit lists it as P1; the ILS design requires institution selection and provider learning on the individual platform. | Paid seats can be assigned to wrong, inactive, or unlinked staff; completion reporting becomes unreliable. | Reconcile cohort list against active membership, canonical department, consent and eligibility immediately before order/session activation. |
| H2 | P1 | CPD total-staff pricing and ILSP cohort pricing depend on verified counts, but the baseline is unconfirmed. | Client briefing says planning values are not final and must be recalculated. | Kiirua can receive an incorrect quote or believe training covers more people than contracted. | Confirm total staff, clinical cohort, facility level, training mix and official AHA add-ons before final SOW/invoice. |
| H3 | P1 | CPD session creation and presenter/department reconciliation have prior production-verification debt. | `WORK_STATUS.md` records multiple institutional CPD changes with production smoke tests pending. | The first live CPD session can fail or record the wrong presenter/department despite passing unit tests. | Run a Kiirua coordinator session creation, attendance, certificate and export smoke test on deployed code. |

### I. QI, data protection, finance and support

| ID | Severity | Failure mode | Evidence | Consequence | Required control |
|---|---|---|---|---|---|
| I1 | P0 | Live institutional payment collection is not enabled merely by merged code. | `PLATFORM_CURRENT_STATE.md` and client briefing require provider credentials, webhook secret, callback policy, settlement account, refunds, reconciliation and legal review. | Kiirua can pay or believe access is active without a reconciled invoice/entitlement. | Keep payment disabled until provider configuration, authenticated smoke test, finance owner and Kenyan legal/accounting review are recorded. |
| I2 | P0 | Data protection, consent, retention, tax/eTIMS, refunds and just-culture wording remain governance gates. | Client briefing and pilot checklist explicitly leave these for legal/finance review. | The hospital may reject the programme or the platform may mishandle sensitive staff/QI information. | Complete the MOU/B2B addendum and Schedule B review with the hospital privacy liaison and counsel. |
| I3 | P1 | No named Kiirua support owner or incident escalation route is recorded. | Audit checklist says support contact must be recorded; no completed owner/evidence found. | A blocked staff member, failed invitation, or incorrect role can remain unresolved during a shift. | Name Paeds Resus support, Kiirua implementation lead, clinical escalation contact, response times and downtime route. |
| I4 | P1 | QI data may be collected before baseline and governance boundaries are signed. | Pilot checklist requires MOU, Schedule A/B, baseline month and explicit process-metric limits. | Data cannot be interpreted, compared, or ethically shared; outcome claims may be overstated. | Use process metrics first; freeze baseline dates; restrict exports by approved scope; prohibit public mortality claims. |

## What is already working

- The current repository has a coherent one-institution model with separate IERS, CPD, Administration and connected-service concepts.
- `assertInstitutionAccess` and newer product/capability helpers provide a meaningful tenant and role-control foundation.
- Active provider duty and membership revocation protections have real-router staging coverage in the repository.
- Facility-linking tests cover duplicate prevention, tenant isolation and general-membership-only approval.
- The invitation visibility fix correctly handles existing accounts by treating `membershipStatus: "invited"` as authoritative.
- The provider-facing copy explicitly warns that membership is not competency, dated duty, readiness or emergency authority.
- The IERS design correctly distinguishes assignment, acceptance, readiness, response and outcome.

These strengths are **foundations**, not proof that Kiirua is ready for live operation.

## Minimum safe Kiirua dry run

Do not begin with bulk import or a 200-person cohort. Use a disposable institution or explicitly approved staging tenant:

1. Admin A creates the institution and selects Admin B.
2. Admin A and Admin B sign in independently and both see the same institution.
3. Admin A confirms Kiirua’s canonical department list and poles.
4. Admin A invites one existing provider account with **general institution access only**.
5. Verify durable notification delivery and failure visibility.
6. Provider opens the exact link, sees Kiirua as pending, accepts institution access, and reloads.
7. Confirm one active membership, one linked roster row, matching user identity, and an acceptance audit event.
8. Provider completes the profile/licence evidence path; reviewer approves or rejects with a reason.
9. Admin assigns one standing department role through the dedicated workflow; provider accepts or declines.
10. ERCo publishes one dated UTL/ERT duty; provider accepts it in My Shift.
11. Repeat the invitation path with a new account and confirm account creation/activation without temporary-password leakage.
12. Decline one duty, verify a coverage exception and replacement, then confirm history is preserved.
13. Record one missing resource and verify it becomes an owned improvement action with due date and independent closure.
14. Create one CPD session and reconcile one ILSP cohort member without conflating the records.
15. Test suspension/end-membership and confirm future duties disappear while history remains.
16. Export the approved evidence and record the exact routes, timestamps, actors and results.

## P0 closure sequence

1. **Merge PR #977** and verify `origin/main` plus deployed code.
2. **Remove or hard-fail the legacy fake onboarding router.** Do not leave success-shaped stubs available to future work.
3. **Wire invitation delivery** with in-app action notification, email/SMS route, delivery status, retry, and support ownership.
4. **Separate general membership from standing responsibility assignment.** Remove responsibility-role assignment from the general invitation path.
5. **Make acceptance transactional and auditable.** Add event logging, idempotency, and reconciliation checks.
6. **Use canonical department IDs** for operational assignment; do not use free-text department values for staffing authority.
7. **Complete the authenticated two-person dry run** on the deployed build, including existing and new accounts.
8. **Complete Kiirua baseline and governance sign-off:** departments, poles, shifts, escalation, downtime, readiness template, missing-resource action flow, reviewers, support and MOU/privacy terms.
9. **Reconcile ILS/CPD cohort data** only after verified membership and headcount.
10. **Record every result in `WORK_STATUS.md`** with PR/merge hash, environment, account roles, route, expected result, observed result and remaining gaps.

## Pilot go/no-go gate

### Go only if all are true

- Code is merged to `origin/main` and deployed.
- Existing-account and new-account invitation flows pass.
- Invitation delivery is confirmed, with a failure owner.
- Two admins can operate and recover the institution.
- No provider can mistake institution membership for emergency authority.
- Canonical department and pole configuration is approved.
- Role appointment and dated-duty acceptance pass, including decline/replacement.
- Professional evidence review owner and status model are active.
- Readiness template and missing-resource action workflow are approved.
- CPD/ILSP reconciliation passes for the pilot cohort.
- MOU, privacy, consent, retention, just-culture and process-metric boundaries are signed off.
- Support, downtime and escalation contacts are visible to Kiirua.
- Production evidence is recorded, not inferred from local tests.

### No-go conditions

- “The invitation exists in the database” is the only evidence that staff were onboarded.
- The provider must discover invitations without a notification or direct instruction.
- The legacy stub router remains available for reuse.
- General membership acceptance also appears to accept an emergency role.
- Department names are free text at the point of operational assignment.
- Payment, clinical outcome or AHA claims are made before their separate gates are complete.
- The only test is a mocked unit test or an admin-only backend fixture.

## Single highest-impact next action

**Ship and prove the safe invitation-to-duty vertical slice on a deployed disposable tenant:** merge PR #977, remove the fake onboarding surface, wire invitation delivery, then run the two-person dry run through membership, canonical department, standing role acceptance, dated duty acceptance/decline, and My Shift visibility. Do not scale the roster until this chain produces recorded evidence without manual database intervention.
