# ResusGPS Pending-Task Closure Audit — 2026-10-02

## Purpose

This audit reconciles the remaining ResusGPS safety work against protected `origin/main`. It distinguishes shipped engineering controls from evidence that requires a named clinical owner and labelled device/manikin observation.

## Phase status

| Phase | Scope | Status | Evidence | Remaining gate |
|---|---|---|---|---|
| 0 | Fresh-main reconciliation, collision review, safety-boundary review | Complete | Main `24af385`; `AGENTS.md`; open-PR overlap checked | None for this slice |
| 1 | Unified age/context/weight resolver | Complete in code | PR #875, merge `3dd5fa522a7d2a1caf2b3be08fa58572176a2456`; resolver matrix and protected CI | Clinical owner must approve routing/wording |
| 2 | CPR server authority and retry safety | Complete in code | Authenticated session reads; active-team write checks; terminal-write guards; retry-key conflict/idempotency handling in `server/routers/cpr-session.ts` | Disposable-tenant API exercise should be run when a DB test environment is available |
| 3 | IERS delivery and closure semantics | Complete in code | Separate receipt, acknowledgement, response, witnessed/self arrival, resource claim/arrival, debrief, and closure transitions; monotonic terminal guards | Labelled synthetic activation run on two devices |
| 4 | QI/synthetic-data quarantine | Complete in code | Server-assigned `unknown` + `pending_review` provenance and `analyticsEligible=false` in `server/lib/event-provenance.ts` and `server/routers/resus-event.ts` | Clinical/data owner must approve the eventual review-clearing process |
| 5 | Actor-scoped offline persistence | Complete in code | PR #895, merge `7cb1dd8c865eee44e674fc9013e8bf3fbb64e506`; protected main CI `37026248517` | Two-device offline wording and reload test |
| 6 | Named clinical-owner review | Blocked by required human input | Review packet exists at `docs/RESUSGPS_CLINICAL_OWNER_REVIEW_PACKET_2026-09-21.md` | Name, role, institution, review date, decisions, and sign-off required |
| 7 | Labelled synthetic/manikin usability validation | Blocked by required physical observation | Protocol exists at `docs/RESUSGPS_LABELLED_SYNTHETIC_USABILITY_PROTOCOL_V1.md` | Test lead, two mobile devices, synthetic accounts, observer, and completed evidence table required |

## Verification performed in this audit

- Protected main reconciled at `24af3852e088dbbdb3b4c7d0a65955995cd94468`.
- PR #875 verified merged with merge commit `3dd5fa522a7d2a1caf2b3be08fa58572176a2456`.
- PR #895 verified merged with merge commit `7cb1dd8c865eee44e674fc9013e8bf3fbb64e506`.
- Post-merge protected CI passed for the code slice and subsequent documentation merge.
- Current code contains the canonical resolver, CPR authorization/idempotency controls, IERS state/closure controls, server provenance envelope, and actor-scoped offline store.
- No production patient, activation, staff, QR, Care Signal, migration, or QI record was created by this audit.

## What cannot be honestly completed by an agent in the sandbox

The following are evidence activities, not coding tasks:

1. A named clinical owner reviewing locally approved protocols and signing the review packet.
2. A participant operating the interface on two physical mobile devices with gloves/keyboard/audio/haptics and recording observations.
3. A clinical/data owner deciding when quarantined evidence may be cleared for aggregate QI use.

No result from synthetic unit tests, browser emulation, or code inspection should be labelled clinical validation, regulatory clearance, device integration, pilot approval, or permission for unsupervised offline use.

## Exact next actions

1. Assign the clinical owner and complete the review packet decisions, especially delivery-room NRP, preterm weight fallback, weight provenance, adult ACLS gating, ambiguous context, arrival semantics, and synthetic-data policy.
2. Nominate a test lead and run S1–S8 in the labelled protocol on two mobile devices using only synthetic/manikin data.
3. Record all stop conditions and unresolved findings; do not proceed to pilot claims if any stop condition occurs.
4. After signed review and passing labelled usability evidence, open a separate governed PR for any required clinical-content or workflow changes.
