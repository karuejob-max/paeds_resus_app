# Kiirua Institution Onboarding Gap Audit

**Target pilot:** Kiirua / St. Teresa Mission Hospital
**Audited against:** `docs/PLATFORM_SOURCE_OF_TRUTH.md`, Institutional Portal Architecture V1, and the IERS client onboarding manual
**Date:** 12 October 2026

## Summary

The platform already has the core primitives required for the Kiirua journey:

- One institution account with separate IERS, CPD Portal, Administration, and ILS lanes.
- A minimum-two-admin onboarding rule.
- Institutional staff roster and invitation records.
- Provider-to-institution membership with explicit acceptance.
- Provider self-service facility-link requests and administrator review.
- Canonical department records, department heads, ERCo, CPD coordinators, and dated UTL/ERT responsibilities.
- Individual-provider surfaces for My Shift, professional records, CPD, and life-support learning.

The critical gap was the **handoff from an existing individual account to an institution invitation**. When an admin invited a provider who already had a Paeds Resus account, the membership row already contained `userId`, but the provider UI only classified invitations with a null `userId` as pending. The invitation therefore existed in the database but was invisible to the provider. This is now fixed: `membershipStatus === "invited"` is the source of truth.

## Canonical Kiirua operating sequence

1. **Create the institution account**
   - Mr. Babu signs in with an individual Paeds Resus account.
   - He completes Institutional Onboarding.
   - He selects the registered facility where possible, or uses controlled manual entry.
   - He names the second existing Paeds Resus administrator.
   - He confirms the initial department list.

2. **Confirm the two-admin continuity rule**
   - Both named administrators can administer the institution.
   - Do not create a second institution account for IERS or CPD.
   - Keep at least two named administrators available for recovery and continuity.

3. **Prepare institution structure before staffing duties**
   - Confirm the canonical department list in Administration/Readiness.
   - Decide which departments are IERS-operational and need a pole.
   - Create/assign response poles.
   - Confirm local shift intervals, escalation, downtime, and review arrangements.

4. **Bring staff into the institution**
   - Preferred path for a staff member who already has an account: institution admin invites the exact email from People & Roles.
   - The staff member opens the provider workspace or Workplaces & Access and accepts **institution access**.
   - If staff self-discover the hospital first: they request a facility link; an institution admin reviews it in Administration → Access & links.
   - Approval creates general institutional membership only. It does not create an IERS duty or emergency authority.

5. **Complete the individual provider record**
   - Staff maintain their own name, cadre/provider type, professional profile, department, and current licence/credential evidence in the individual platform.
   - The institution verifies the person’s identity and canonical department before assigning operational responsibility.
   - A profile or CPD record alone must not be treated as institutional membership or IERS authorization.

6. **Assign standing institutional roles**
   - Institution admin assigns department heads.
   - Department heads accept or decline their appointment.
   - Accepted department heads appoint the department ERCo and CPD coordinator.
   - The institution assigns the institutional IERS/CPD coordination roles through the appropriate administration and learning surfaces.
   - Every role appointment remains separate from dated shift duties.

7. **Run monthly IERS staffing**
   - Accepted ERCo opens the department staffing surface.
   - ERCo chooses active, linked Staff/RN providers in the exact canonical department.
   - The system publishes dated UTL/ERT/ERTL responsibilities as pending acceptance.
   - Providers accept or decline in My Shift; declines require a reason and trigger coverage action.
   - Acceptance is not proof of readiness; readiness is recorded separately.

8. **Run CPD and ILS separately**
   - CPD coordinators create CPD sessions, attendance, points, certificates, and reports in the CPD Portal.
   - Institutional life-support cohorts are managed in the ILS workspace.
   - Staff enter the learning pathway from the **individual/provider platform** after the institution has linked them to the roster/order/cohort.
   - IERS competency, CPD attendance, and ILS completion remain separate records unless an explicit governed mapping exists.

9. **Review and improve**
   - Institution leadership reviews membership coverage, role acceptance, readiness gaps, training completion, attendance, certificates, actions, and response evidence.
   - Missing-resource reports must become owned procurement, staffing, policy, training, or escalation actions.

## What is still missing before a real Kiirua pilot

### P0 — must be closed before staff onboarding day

- **Production notification delivery:** database notifications exist, but the pilot needs a confirmed email/in-app delivery path and an owner for failed delivery follow-up.
- **Provider invitation instructions:** staff need one short instruction: “Sign in with the invited email → open Workplaces & Access or My Shift → accept institution access.”
- **Roster acceptance test:** test one existing account and one newly created account from invitation through active membership and visibility in the institution roster.
- **Canonical department baseline:** Kiirua must approve department names, IERS-operational departments, poles, shift hours, and the department-to-pole map.
- **Professional evidence readiness:** confirm which licence fields/evidence Kiirua requires and who reviews them; do not treat a self-entered number as verified automatically.

### P1 — required before the first operational month

- **Role coverage:** name a backup for each department head, ERCo, CPD coordinator, and the institutional admin pair.
- **UTL/ERT coverage policy:** agree how declined, absent, redeployed, or resigned staff are replaced without deleting history.
- **Readiness template approval:** nursing, clinical, pharmacy, biomedical, and quality leads approve Immediate vs Accessible checks and missing-resource handling.
- **ILS roster/order reconciliation:** verify the selected staff are active linked members before institutional training orders and session assignments are finalized.
- **Audit evidence:** record who approved each staff link, role appointment, dated duty, attendance, evidence review, and action closure.

### P2 — should not block the first bounded pilot

- SSO/directory synchronization.
- Automated reminder campaigns and bulk activation email automation.
- A central export centre across IERS, CPD, and ILS.
- Full quotation → contract → payment → renewal ledger automation.
- Fine-grained product-role enforcement for every mature legacy procedure.

## Answers to the original design questions

### Individual account or institutional account first?

The correct model is **one individual identity plus one institution account**. The first administrator uses an individual account to create/administer the institution. The institution is not owned conceptually by one person, so the second admin must be added at creation and retained for continuity.

### Where does clinical staff access institutional life support?

Staff use the **individual/provider platform** for their own learning, records, acceptance, and assigned work. The institution workspace selects the cohort, grants/records institutional access, manages the roster, and tracks aggregate progress. Do not force ordinary staff to operate from the institution admin workspace.

### How do self-registered staff join Kiirua?

There are two valid paths:

- **Admin-led:** Kiirua invites the staff member’s existing Paeds Resus email; the staff member accepts institution access.
- **Provider-led:** staff searches for Kiirua in Workplaces & Access and submits a facility-link request; Kiirua approves or rejects it in Administration → Access & links.

Neither path should silently assign an emergency role. Department head, ERCo, CPD coordinator, UTL, ERTL, and ERT roles require separate assignment and explicit acceptance.

## Main risks and mitigations

| Risk                                              | Mitigation                                                                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Staff invitation exists but is not seen           | Pending state is now based on `membershipStatus === "invited"`; test both existing and new accounts.                            |
| Facility link is mistaken for emergency authority | Keep general membership, product roles, dated duties, acceptance, and readiness as separate states in UI and server checks.     |
| Wrong department causes unsafe staffing           | Use canonical department IDs; block operational assignment when the provider is not an active linked member of that department. |
| One person leaves and access collapses            | Maintain two admins plus named deputies/backups; end membership without deleting history.                                       |
| CPD/ILS/IERS records become conflated             | Preserve separate product ownership and require explicit governed mappings.                                                     |
| Missing resources become comments with no action  | Convert each accepted gap into an owned, dated improvement action with evidence and independent review.                         |

## Pilot acceptance checklist

- [ ] Two admins can sign in and administer the same institution.
- [ ] Existing staff account receives and sees a pending institution invitation.
- [ ] Staff accepts institution access and appears as active linked roster member.
- [ ] Staff can open the individual provider platform and see institutional learning/duty surfaces.
- [ ] Admin can review a provider-led facility-link request.
- [ ] Department list and pole allocation are confirmed.
- [ ] Department head, ERCo, and CPD coordinator assignments are accepted.
- [ ] One monthly UTL duty is published, accepted, and visible in My Shift.
- [ ] A declined duty produces a reason and a coverage exception.
- [ ] One missing resource becomes a tracked improvement action.
- [ ] IERS competency, CPD attendance, ILS completion, and certificates remain distinct.
- [ ] Export/recovery owner and pilot support contact are recorded.

## Highest-impact next action

Run a **two-person Kiirua dry run** using one existing Paeds Resus staff account and one new account. Do not start with bulk import. Prove the identity → invitation/link → active membership → department → role acceptance → dated duty → individual-provider visibility chain first; then scale the same path to the full roster.
