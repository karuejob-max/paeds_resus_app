# IERP Implementation Contract

**Status:** Merged, deployed, and production-verified
**Owner:** Manus  
**Implementation branch:** `feat/ierp-program-e2e` (merged via PR #616; feature branch deleted after protected merge)
**Closeout branch:** `chore/ierp-closeout-20260827`
**Migration:** `0131` applied and verified in Render Production after collision review (0128 is owned by NERP; 0129 and 0130 are owned by the concurrent CPR/IERS work)
**Constraint:** No promotional email sends in this initiative.

## Naming contract

- **IERP** means only the **Intern Emergency Readiness Program**.
- **IERS** means only the **Institutional Emergency Readiness System**.
- **NERP** means only the **Nurses Emergency Readiness Program**.
- **ResusGPS** means the bedside paediatric emergency clinical decision-support product, not the training programme or institution portal.

No new learner-facing copy, route, email subject, event name, analytics key, database field, or test should use IERP for IERS or NERP behavior.

## Owned feature boundary

This initiative owns self-service IERP entry, explicit intern programme state, authoritative Phase 1/2/3 progress, private Phase 1 proof, IERP-aware payment state, the public IERP acquisition surface, and paused promotional-email infrastructure. It does not send promotional emails.

The existing IERS institutional emergency operations, staffing, activation, readiness, QR, and clinical response flows remain unchanged. The NERP agent owns nurse-specific programme rules and nurse-facing copy. Shared course, payment, learner-dashboard, programme-identity, email, and documentation files may be edited only through small interface-preserving changes and must retain separate IERP/NERP behavior.

## Safety boundaries

- IERP entry must not require an institutional staff row or facility membership.
- Facility context must not be converted into employment or IERS access.
- Phase 1 evidence must use private authenticated storage; public URLs are legacy-only and must not be the new source of truth.
- Phase 2 completion counts only confirmed named roles: three Team Leader sessions and six Team Member sessions covering all six named roles.
- Phase 3 must remain a separate hands-on assessment gate and requires the full KES 15,000 IERP fee.
- IERP payment timing is calendar-based in EAT: August–November starters may access Phase 1 and Phase 2 before payment until 1 December; December–July starters require full payment before cognitive access; the payment action requests the full remaining balance in one payment, not a Lipa Mdogo Mdogo instalment.
- AHA courses remain separate from the Paeds Resus Fellowship.
- Promotional email sends remain disabled until consent, suppression, audience preview, canary, pause, attribution, and rollback controls are validated.
- No email send, payment charge, real learner enrolment, clinical activation, or production seed is part of local testing.

## Definition of done

The initiative is not complete until the protected implementation PR is merged to `origin/main`, migration `0131` is applied and verified in production if schema changes ship, no promotional emails have been sent, the IERP/NERP regression suite passes, and the live public IERP route and learner journey are smoke-tested without creating production clinical data.
