# Paeds Resus Platform — Current State & Agent Handoff

**Last updated:** 2026-09-21  
**Canonical code state:** `origin/main` at merge commit `0406f4fa` (documentation merge PR [#869](https://github.com/karuejob-max/paeds_resus_app/pull/869)); institutional implementation merge: `6c586d31` (PR [#867](https://github.com/karuejob-max/paeds_resus_app/pull/867))  
**Audience:** New engineering agents, maintainers, clinical/operations collaborators, and reviewers.

## What the platform is

Paeds Resus is a clinical learning, emergency-readiness, quality-improvement, and institutional operations platform. The strategic product direction is **readiness first**: institutions should be able to understand their emergency-response capability, train and track the right people, capture improvement work, and review measurable operational signals. The platform is not a bulk certificate-sales system and must not be described as guaranteeing mortality reduction, replacing clinical judgement, or issuing official AHA credentials unless the contracted pathway explicitly does so.

## Product surfaces

| Surface | Purpose | Primary routes / code areas |
|---|---|---|
| **Individual learning and records** | Courses, competency progress, certificates, CPD evidence, professional identity, and access grants. | `client/src/pages/ProviderLearn.tsx`, `client/src/pages/ProviderRecords.tsx`, `client/src/pages/ProviderProfile.tsx`, `server/routers/learning.ts` |
| **Institutional Emergency Readiness** | Institution-scoped departments, readiness roles, response structures, staffing, evidence, dashboards, and governed QI. | `/institutional-portal`, `client/src/pages/InstitutionWorkspace.tsx`, `server/routers/institution.ts` |
| **CPD Portal** | Institutional sessions, presenter directory, attendance, quizzes, certificates, targets, and reporting. | `client/src/components/institution/CPDPanel.tsx`, `server/routers/cpd.ts` |
| **Institutional Life Support Training Program (ILSP)** | Institution-paid Paeds Resus competency-based training with cohort orders, provider assignments, cognitive/practical progression, completion records, and optional AHA credentialing request pathway. | `client/src/pages/InstitutionalLifeSupport.tsx`, `server/routers/institutional-life-support.ts`, `server/lib/institutional-life-support-payments.ts` |
| **Structured QI** | Safety Events and Improvement Projects with draft, review, actions, effectiveness review, closure, export scopes, retention controls, and participation governance. | `server/routers/institutional-qi.ts`, `docs/INSTITUTIONAL_REVENUE_READINESS_RUNBOOK.md` |
| **Institutional billing** | Pricing, annual invoices, payment intents, provider-neutral payment adapters, signed callbacks, reconciliation, refunds, and manual institutional payment operations. | `server/routers/institutional-billing.ts`, `server/webhooks/institutional-payment.ts`, `server/routers/institutional-life-support.ts`, `/admin/institutional-payments` |
| **Global admin entitlements** | Named, institution-scoped, programme-scoped free or discounted access with expiry, limits, audit, and price linkage. | `client/src/pages/AdminAccessGrants.tsx`, `server/routers/global-entitlements.ts` |
| **People & roles** | Institutional administrator, Emergency Readiness Chair/Coordinator, CPD Coordinator, Departmental Head, ERCo, and Departmental CPD Coordinator authority model. | `client/src/components/InstitutionPeopleRolesPanel.tsx`, `server/routers/institution.ts` |

## Current commercial rules

- **Founding Partner:** five-year term with a 50% renewal rate after the founding term.
- **IERS / institutional emergency readiness:** facility-level pricing anchors are Level 4 **KES 200,000**, Level 5 **KES 350,000**, and Level 6 **KES 600,000**. Quaternary scope is custom and should not be quoted as an automatic fixed tier.
- **ICPD / CPD Portal:** staff-count tiered pricing; the Kiirua planning case uses KES 800 per staff per year for the 301–500 staff tier. Above 500 staff is negotiated unless the pricing source of truth changes.
- **ILSP:** the institutional rate is **KES 7,000 per provider** rather than the KES 10,000 list price. Percentage discounts do not stack with this institutional rate; full waivers remain possible through governed entitlements.
- **AHA add-ons:** an ILSP learner may request BLS or ACLS credentialing within the allowed post-certificate window at the approved add-on price. Paeds Resus ILSP completion is not an AHA card.
- **Currencies:** KES is the settlement currency for Kenyan institutional invoices. USD is only a reference/display currency when explicitly labelled with the FX snapshot and must not silently replace the KES invoice amount.
- **Renewal:** annual invoice-first renewal is the default; card autopay is optional. M-Pesa and bank transfer remain fallback routes where configured.

The source of truth for pricing logic is `shared/institutional-pricing.ts` and the associated institutional pricing documentation. Do not create a second pricing table in a feature.

## Current payment boundary

The software supports a provider-neutral institutional payment model, but **live revenue collection is not automatically live merely because code is merged**. Before accepting external institutional funds, operations must complete all of the following:

1. Configure `INSTITUTIONAL_PAYMENT_WEBHOOK_SECRET` and the selected provider credentials in production.
2. Confirm callback URL, proxy/IP policy, settlement account, refund handling, and reconciliation ownership.
3. Run the disposable authenticated smoke test in `docs/INSTITUTIONAL_REVENUE_READINESS_RUNBOOK.md`.
4. Complete Kenyan legal/accounting review covering data protection, consent, retention, tax/eTIMS, renewal, refunds, and just-culture language.
5. Record finance ownership and a daily/weekly reconciliation rhythm.

The admin manual-payment page currently covers pending **ILSP** orders at `/admin/institutional-payments`. It records a bank-transfer or card reference and reason, then reuses `applyInstitutionalLifeSupportPaymentCompletion` so delivery and provider enrolment activation follow the same path as automated completion. IERS/ICPD backend confirmation exists separately; a unified UI is a future improvement, not a current claim.

## Current data and migration discipline

- Code merge and production database migration are separate tracks.
- Migration `0156` established institutional QI, pricing, and billing foundations.
- Migration `0157` established institutional payment operations and was reported applied and verified in production before this handoff.
- Later migrations visible on `main` must be checked against production before claiming deployment completion. Use the matching `pnpm run db:apply-NNNN` and `pnpm run db:verify-NNNN` scripts from an authenticated production shell.
- Never put secrets in source control, browser payloads, QI reports, invoice notes, or documentation.
- A production database or seed result must be recorded in `docs/WORK_STATUS.md` before claiming a migration/content task is complete.

## Kiirua engagement position

The Kiirua offer is a **general hospital-wide emergency-readiness proposition**. Paediatric competency is a core strength, not the boundary of the offer. The discovery workshop must establish total staff, clinical cohort size, departments, facility level, existing emergency-response process, training coverage, equipment readiness, CPD process, QI process, named governance owners, procurement route, and measurable 90-day outcomes.

Use `docs/KIIRUA_CLIENT_BRIEFING.md` as the client-facing briefing and `docs/INSTITUTIONAL_PRICING_AND_KIIRUA_PROPOSAL.md` as the internal pricing reference. Treat quoted totals as planning assumptions until Kiirua confirms the baseline. Do not reuse a retired fixed total without recalculating it from verified headcount, facility level, cohort size, and scope.

## Agent operating sequence

1. Read `AGENTS.md`, `docs/WORK_STATUS.md`, this document, and the relevant product/runbook files.
2. Fetch `origin/main`, start a fresh feature branch from current `main`, and inspect existing routes, schema, and tests before editing.
3. Make the smallest reviewable change; preserve the core emergency flow: open app → enter findings → receive priority next actions → reassessment prompts.
4. Run the relevant focused tests plus `pnpm run check`; run build or migration verification where applicable.
5. Perform the user-visible/account smoke test required by `AGENTS.md` for learner or admin workflow changes.
6. Open a PR, wait for protected CI, merge through GitHub, and verify the merge commit on `origin/main`.
7. Update `docs/WORK_STATUS.md` with the PR, merge hash, validation, production verification, and remaining gaps.

## Known open operational gaps

- Production payment provider configuration and controlled institutional revenue smoke test remain outstanding unless separately recorded as completed in `WORK_STATUS.md`.
- Legal/finance review of Kenyan consent, retention, tax/eTIMS, renewal, refunds, and just-culture wording remains required before external sale claims.
- A unified admin payment console for IERS, ICPD, and ILSP is not yet complete; the current UI is ILSP-focused.
- Deployed mobile/desktop smoke tests and real-account workflow verification must be recorded separately from local tests.

## Documentation map

- `AGENTS.md` — mandatory pre-read and Definition of Done.
- `docs/PLATFORM_SOURCE_OF_TRUTH.md` — canonical product/architecture source of truth.
- `docs/AGENT_OPERATIONS_PLAYBOOK.md` — protected-branch shipping, migration, seed, and recovery procedures.
- `docs/WORK_STATUS.md` — dated release ledger and production verification record.
- `docs/KIIRUA_CLIENT_BRIEFING.md` — client-facing Kiirua discovery and offer briefing.
- `docs/INSTITUTIONAL_REVENUE_READINESS_RUNBOOK.md` — payment configuration and smoke-test runbook.
- `docs/INSTITUTIONAL_PRICING_AND_KIIRUA_PROPOSAL.md` — internal commercial reference.
- `docs/marketing/PAEDS_RESUS_PRODUCT_MARKETING_MESSAGE_PACK.md` — canonical marketing wording and pricing display rules.
- `shared/institutional-pricing.ts` — executable pricing source of truth.
- `server/webhooks/institutional-payment.ts` — signed institutional webhook boundary.
