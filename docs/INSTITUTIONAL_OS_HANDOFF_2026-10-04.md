# Paeds Resus Institutional OS — Transfer Handoff

**Prepared:** 2026-10-04  
**Purpose:** Comprehensive context transfer for a new chat/agent  
**Repository:** `karuejob-max/paeds_resus_app`  
**Canonical domain:** `paedsresus.com`  
**Primary client opportunity:** Kiirua

---

## 1. Mission and operating model

Paeds Resus is being transformed from a primarily individual course/certificate platform into a **readiness-first Institutional OS** for hospitals and other healthcare/training institutions.

The institutional product must help facilities:

1. Identify emergency-readiness gaps.
2. Assign accountable people and roles.
3. Organize emergency teams, departments, poles, and staffing rosters.
4. Capture drills, evidence, incidents, QI work, and reassessment.
5. Provide staff learning and CPD management.
6. Support institutional life-support training paid for in bulk by the institution.
7. Produce auditable operational, governance, and finance records.
8. Work reliably in low-resource hospitals and under pressure.

The core safety rule is:

> Open the app → enter findings → receive priority next actions → reassess and record evidence.

The platform must not claim that a dashboard score or training certificate alone proves clinical readiness or mortality reduction.

---

## 2. Current institutional product architecture

The Institutional Portal is one tenant-aware institution workspace with independent products and a shared control plane.

### 2.1 IERS — Institutional Emergency Readiness System

IERS covers:

- Emergency-readiness setup.
- Departments and facility poles.
- Emergency Response Coordinators (ERCo).
- Emergency Response Teams and ERTL/UTL staffing concepts.
- Provider-owned duty acceptance.
- Drills, activations, debriefs, evidence, and action closure.
- Readiness governance and institutional QI.
- Executive reporting and operational learning.

IERS is independently subscribable. Historical evidence must remain preserved across renewal states.

### 2.2 CPD Portal / Learning

The institutional Learning workspace covers:

- CPD sessions.
- Presenters and co-presenters.
- QR attendance and check-in.
- Certificates and CPD points.
- Staff development records.
- Department-scoped CPD coordination.
- People and targets.
- Reports and insights.

The simplified Learning information architecture is:

1. Learning overview.
2. Cohorts & competency (IERS).
3. CPD sessions.
4. People & targets.
5. Reports & insights.

CPD and IERS are independently gated but share canonical institution-scoped department identity.

### 2.3 ILSP — Institutional Life Support Training Program

ILSP is a unique institutional bulk-training offering. It is not an individual checkout flow.

Current commercial rules:

- Base Paeds Resus ILSP price: **KES 10,000 per provider**.
- Institution pays in bulk through an institutional training order.
- No AHA certification is included by default.
- A learner may separately request an AHA credential within three months of Paeds Resus certification:
  - ACLS credential pathway: additional **KES 10,000**.
  - BLS credential pathway: additional **KES 7,500**.
- After three months, the learner must pay the full training price:
  - ACLS: **KES 20,000**.
  - BLS: **KES 10,000**.
- ILSP is cohort/order based and should never be represented as a personal “Pay KES 10,000” link.

### 2.4 Administration

Administration is the shared control plane for:

- Institution identity and classification.
- Staff and membership records.
- People and roles.
- Department structure.
- Product subscriptions and entitlements.
- Billing, invoices, renewals, exports, and recovery.
- QI governance.
- Consent and data-sharing settings.

Institutional admins can assign institution-specific responsibilities, including:

- Emergency Readiness Chair.
- CPD Coordinator.
- Departmental Heads.

Departmental Heads can assign:

- ERCo for their department.
- Departmental CPD Coordinator.

ERCo manages the department’s UTL staffing roster. Departmental CPD Coordinators manage the department’s CPD roster.

---

## 3. Onboarding and taxonomy work already completed

Institutional onboarding was redesigned to avoid Kenya-only assumptions while supporting Kenya-specific classifications.

The onboarding taxonomy supports categories such as:

- Healthcare facilities.
- Teaching healthcare facilities.
- Training and education institutions.
- Professional or clinical training organizations.
- Government/public-sector institutions.
- Faith-based/non-profit institutions.
- Private institutions.
- Other institution types.

For healthcare facilities, the Kenya classification supports:

- Primary healthcare: Levels 1–4.
- Secondary healthcare: Level 5.
- Tertiary/quaternary: Level 6 and higher-complexity referral/teaching models.

The model is designed to remain portable for non-Kenyan facilities by preserving a local classification label and a broader normalized facility-care-level concept.

Earlier onboarding defects were addressed, including:

- Required second-admin fields incorrectly blocking onboarding.
- Lack of Faith Based Hospital and other institution categories.
- Outdated course checkbox selection for BLS/ACLS during institutional onboarding.
- Requirement that added administrators already have Paeds Resus accounts.
- Searchable directory selection for admins, with name/email autofill to prevent duplicate or mismatched accounts.
- Facility ownership and facility-care-level fields.
- Institution-defined departments and subdepartments such as Theatre under Surgery.

Departments are institution-scoped and can be created, renamed, reactivated, or deactivated by authorized institutional administrators while preserving historical IDs and records.

---

## 4. Canonical department and staffing model

`facility_departments` is the institution-scoped source of truth for departments and optional facility poles.

Important rules:

- Departments are not inferred from free text.
- CPD and IERS use the same canonical department identity.
- Historic text is retained for reporting compatibility.
- Custom or `Other` submissions are not silently grouped into one department.
- Institution admins can review and map custom labels to explicit local departments.
- IERS pole eligibility is fail-closed and explicitly controlled using `requires_pole`.
- CPD-only departments such as Pharmacy may remain valid without poles.
- ERCo governance is distinct from dated duty acceptance.
- Monthly staffing source rows never silently assign the first provider.
- Each dated duty requires explicit provider acceptance.

The platform also supports:

- Departmental ERCo and Assistant ERCo concepts.
- Dated ERTL rotations.
- Dated UTL shifts.
- Accepted, declined, pending, and readiness states.
- Department conflict alerts when provider profile/CPD evidence and roster allocation disagree.
- Reason-required, non-destructive staff retirement/removal.
- Preservation of CPD, attendance, accepted duties, readiness evidence, and audit history after removal.

---

## 5. QI and institutional safety model

The institutional QI foundation was implemented as structured data rather than free-form narrative only.

Canonical QI entities include:

- Safety Event.
- Improvement Project.
- Actions.
- Effectiveness Reviews.
- Status transition history.

The intended workflow is:

```text
Draft → Open/Active → Under Review → Closed
```

Closure is protected. A report cannot be treated as effectively closed unless:

- The action/evidence review is present.
- Effectiveness is explicitly assessed.
- The outcome is effective or partially effective under the defined contract.
- There is no unresolved follow-up that contradicts closure.
- The transition has an actor, role, reason, and timestamp.

The institutional QI router now enforces:

- Department belongs to the current institution.
- Action owner is an active institutional member.
- Transition actor is authorized.
- Initial report creation creates an initial transition event.
- Later transitions append immutable ledger records.

The Institutional Command Centre surfaces high-severity QI attention items and directs the user to the Readiness review lane. It deliberately does not invent a readiness score.

---

## 6. Commercial and pricing model

### 6.1 Founding Partner

Approved rule:

- Five-year founding partner term.
- Renewal pricing at 50% of standard pricing.
- Founding terms must be represented in an approved commercial contract rather than inferred from a UI discount.

### 6.2 IERS pricing

The facility-level institutional pricing model is:

- Level 4: **KES 200,000** standard annual pricing.
- Level 5: **KES 350,000** standard annual pricing.
- Level 6: **KES 600,000** standard annual pricing.

The executable source of truth is `shared/institutional-pricing.ts`.

Public display helpers are in `shared/institutional-public-pricing.ts`.

### 6.3 ICPD pricing

ICPD uses staff-count tiers and the institutional staff rate:

- Canonical institutional rate: **KES 7,000 per staff member**.
- The institutional rate must not stack with other percentage discounts.
- Full waivers remain possible when explicitly granted.
- Public display should show staff-band logic rather than a misleading flat annual price.

### 6.4 Currency and international use

KES is the canonical operating currency for the Kenya commercial model. International pricing should be generated through an explicit currency/FX contract field, not hidden ad hoc conversion.

Current contract schema includes:

- Currency.
- Amount in cents/minor units.
- Optional KES-per-USD FX rate.
- Facility level.
- Verified staff count.
- Term.
- Data-sharing status.
- Approval metadata.

Do not claim a final global USD price until finance approves FX, taxes, rounding, invoice, and renewal policy.

---

## 7. Billing and payment architecture

Payment integrations are provider-neutral and target:

- Pesapal.
- Direct M-Pesa.
- Bank transfer.
- Optional card/autopay where supported.

The platform has:

- HMAC-SHA256 signed webhooks.
- Idempotency protection.
- Amount and institution mismatch protection.
- Provider-neutral payment adapters.
- Invoice-first annual renewal model.
- Manual institutional payment administration.
- M-Pesa and bank-transfer fallback paths.

The institutional trust-closure work added finance-grade states.

### 7.1 Invoice states

The supported invoice lifecycle includes:

- `draft`
- `issued`
- `payment_pending`
- `payment_received`
- `settlement_confirmed`
- `reconciled`
- `paid`
- `disputed`
- `refunded`
- `void`
- `overdue`
- `cancelled`

### 7.2 Payment-attempt states

Payment attempts include:

- `created`
- `pending`
- `succeeded`
- `settled`
- `failed`
- `refunded`
- `disputed`

A provider callback must not automatically equal finance settlement or active institutional entitlement. Finance reconciliation is the authority for settlement-sensitive progression.

New payment intents are blocked for invoices that are already settled, refunded, void, cancelled, or otherwise not payable.

### 7.3 Commercial contract authority

Institutional invoices now require an approved commercial contract. The contract contains:

- Institution.
- Product.
- Contract number.
- Pricing tier.
- Facility level.
- Staff count.
- Currency and amount.
- Term.
- Data-sharing status.
- Approval actor/time.
- Start/end dates.

An invoice cannot be created from an unapproved quote or an arbitrary client-supplied amount.

---

## 8. Entitlements and administrator grants

Global Admin entitlement controls were implemented for:

- IERP.
- NERP.
- ILSP.
- Self-pay/AHA pathways.

Controls include:

- Named account or institution targeting.
- Full waiver or bounded percentage discount.
- Expiry.
- Redemption limits.
- Revocation.
- Audit reference.
- Immutable redemption history.

ILSP entitlements apply to institution-paid cohort orders and do not create individual ILSP access by themselves.

Entitlements adjust unpaid balance only. They do not bypass:

- Clinical eligibility.
- Evidence review.
- Roster/readiness rules.
- Practical assessments.
- Certificate gates.
- AHA credentialing gates.

A shareable learner access token is intentionally not used because it lacks safe identity, expiry, revocation, and audit controls.

---

## 9. Kiirua client opportunity

A Kiirua-specific briefing was created and updated to frame the offer as hospital-wide, while retaining paediatric emergency strength.

Recommended Kiirua discovery sequence:

1. Confirm facility classification and level.
2. Confirm staff/provider count.
3. Map departments and current emergency teams.
4. Understand current emergency response workflow.
5. Identify high-risk readiness gaps.
6. Confirm CPD and learning priorities.
7. Agree pilot scope, governance, data-sharing, and success measures.
8. Issue an approved statement of work and commercial contract.
9. Configure the institution and run baseline readiness capture.
10. Begin the first improvement cycle.

Do not issue a final Kiirua quote until baseline data is received and the commercial contract is approved.

Relevant documents previously created include:

- `docs/KIIRUA_CLIENT_BRIEFING.md`
- `docs/INSTITUTIONAL_PRICING_AND_KIIRUA_PROPOSAL.md`
- `docs/ILSP_MARKETING_AND_PRICING_UPDATE.md`
- `docs/marketing/PAEDS_RESUS_PRODUCT_MARKETING_MESSAGE_PACK.md`
- `docs/INSTITUTIONAL_REVENUE_READINESS_RUNBOOK.md`

---

## 10. Audit and trust-closure implementation

An external institutional portal audit identified the need to make the portal more operationally valuable and trustworthy, not merely visually polished.

The following hardening slice was implemented and merged in PR #928:

- Institution-scoped QI department and owner validation.
- Immutable QI transition ledger.
- Effectiveness-based QI closure protection.
- Approved commercial contracts as invoice authority.
- Explicit payment-received versus finance-settled states.
- Fail-closed product-ledger degradation.
- High-severity QI attention in the command centre.
- Reusable invariant tests.
- Scenario matrix and trust-closure specification.
- PSOT document registry update.

Merged commit before the migration correction:

```text
7331c375828cb703606d00bc6e1cb0c3e2127416
```

Validation completed for that release:

- Focused institutional Vitest: 11 tests passed.
- TypeScript: passed.
- `pnpm run check`: passed.
- Production build and prerender: passed.
- Migration syntax checks: passed.
- Diff hygiene: passed.
- Protected CI: passed.

The honest release boundary remains: code/test verified, but production migration, authenticated hospital scenarios, legal/finance review, and clinical-owner/device review are separate gates.

---

## 11. Migration-number conflict and final resolution

A migration-number conflict was discovered after the trust-closure release.

The institutional trust-closure migration had originally used `0171`, but a separate professional-evidence governance PR also used `0171`.

Final assignment:

```text
0171 = Professional evidence governance
0172 = Institutional trust closure
```

Safety actions completed:

1. Confirmed both implementations on `main`.
2. Did not run the ambiguous institutional `0171` command in the sandbox.
3. Reserved `0172` remotely before renaming.
4. Renamed institutional scripts:
   - `scripts/apply-0172-institutional-trust-closure.mjs`
   - `scripts/verify-0172-institutional-trust-closure.mjs`
5. Updated package commands and documentation.
6. Updated work ledger.
7. Merged correction PR #932.
8. Deleted temporary reservation branch `migration-reserved-0172` after merge.

Correction merge commit:

```text
a40accd9e9d409172e3ac54294f9932d543ee34c
```

The verified current commands are:

```bash
pnpm run db:apply-0171
pnpm run db:verify-0171
# Professional evidence governance

pnpm run db:apply-0172
pnpm run db:verify-0172
# Institutional trust closure
```

**Important:** Never run `db:apply-0171` expecting institutional trust closure.

---

## 12. Production work still outstanding

The remaining work is operational verification, not another broad rewrite.

### 12.1 Render production migration

Run in the production Render Shell from the current deployed release:

```bash
pnpm run db:apply-0172
pnpm run db:verify-0172
```

Capture the complete output and record it in `docs/WORK_STATUS.md`.

Do not run the old institutional `0171` command.

### 12.2 Authenticated institutional scenario matrix

Run the scenarios documented in:

`docs/INSTITUTIONAL_SCENARIO_TEST_MATRIX.md`

Minimum scenarios:

1. Create a QI report.
2. Add an institution-scoped action.
3. Attempt an out-of-institution department or owner — must fail.
4. Review effectiveness.
5. Close an effective report.
6. Attempt closure with unresolved follow-up — must fail.
7. Create/approve a commercial contract.
8. Issue an invoice from the approved contract.
9. Create payment intent for a payable invoice.
10. Submit a correctly signed provider webhook.
11. Confirm webhook does not itself imply finance settlement.
12. Reconcile payment as authorized finance user.
13. Attempt amount/institution mismatch — must fail.
14. Attempt payment intent for settled/refunded/void invoice — must fail.
15. Simulate unavailable product ledger and confirm degraded state does not imply access.
16. Verify cross-tenant reads and writes are denied.
17. Verify mobile institutional administration surfaces.

### 12.3 Configuration still required

Production revenue collection remains dependent on environment configuration, including:

- `INSTITUTIONAL_PAYMENT_WEBHOOK_SECRET`.
- Pesapal credentials if enabled.
- Direct M-Pesa credentials if enabled.
- Bank-transfer reconciliation process.
- Tax/eTIMS configuration.
- Finance approval roles.

### 12.4 Governance and legal gates

Still require Kenyan counsel/finance review for:

- Just-culture wording.
- Data-sharing consent.
- Institutional contract/addendum.
- eTIMS and tax treatment.
- Refund, dispute, and renewal language.
- International currency/FX treatment.

### 12.5 Clinical and device gates

Before claiming global readiness:

- Named clinical-owner review.
- Labelled mobile testing.
- Two-device or synthetic/manikin validation where applicable.
- Verification that emergency workflows do not create provider confusion.
- Explicit separation between training evidence and accreditation.

---

## 13. Definition of Done for this institutional phase

The work should not be called globally ready until all of the following are true:

- Current `main` is deployed to production.
- Migration `0172` applied successfully.
- Migration `0172` verifier passes in production.
- Production payment secrets are configured and tested.
- Authenticated institutional scenario matrix passes.
- Tenant isolation is tested.
- QI closure and effectiveness rules are tested.
- Invoice-contract authority is tested.
- Provider callback versus finance reconciliation is tested.
- Degraded state is tested and does not grant access.
- Mobile administration surfaces are tested.
- Legal/finance review is documented.
- Clinical-owner and device review is documented.
- Kiirua baseline discovery is completed before final quote.

A successful build and green CI are necessary but not sufficient for the final claim.

---

## 14. Recommended next-chat opening prompt

Use this in a new chat:

> Continue work on the Paeds Resus Institutional OS from `docs/INSTITUTIONAL_OS_HANDOFF_2026-10-04.md`. The code is merged on `main` at commit `a40accd9e9d409172e3ac54294f9932d543ee34c`. Migration `0171` belongs to professional evidence governance; institutional trust closure is migration `0172`. Do not run the old institutional 0171 command. First verify deployment status, then run `pnpm run db:apply-0172` and `pnpm run db:verify-0172` in Render Shell, capture the output, and execute the authenticated institutional scenario matrix. Treat legal/finance and clinical-owner/device review as separate production-readiness gates. Do not claim global readiness until those gates pass.

---

## 15. Key files

### Canonical architecture and status

- `docs/PLATFORM_SOURCE_OF_TRUTH.md`
- `docs/PLATFORM_CURRENT_STATE.md`
- `docs/WORK_STATUS.md`
- `AGENTS.md`
- `docs/AGENT_OPERATIONS_PLAYBOOK.md`

### Institutional trust closure

- `docs/INSTITUTIONAL_TRUST_CLOSURE_SPEC.md`
- `docs/INSTITUTIONAL_SCENARIO_TEST_MATRIX.md`
- `server/lib/institutional-trust-invariants.ts`
- `server/lib/institutional-trust-invariants.test.ts`
- `server/routers/institutional-qi.ts`
- `server/routers/institutional-billing.ts`
- `server/webhooks/institutional-payment.ts`
- `server/routers/institution-products.ts`

### Migration 0172

- `scripts/apply-0172-institutional-trust-closure.mjs`
- `scripts/verify-0172-institutional-trust-closure.mjs`
- `package.json`

### Pricing and marketing

- `shared/institutional-pricing.ts`
- `shared/institutional-public-pricing.ts`
- `shared/institutional-pricing.test.ts`
- `shared/institutional-public-pricing.test.ts`
- `docs/INSTITUTIONAL_PRICING_AND_KIIRUA_PROPOSAL.md`
- `docs/KIIRUA_CLIENT_BRIEFING.md`
- `docs/ILSP_MARKETING_AND_PRICING_UPDATE.md`
- `docs/INSTITUTIONAL_REVENUE_READINESS_RUNBOOK.md`
- `docs/marketing/PAEDS_RESUS_PRODUCT_MARKETING_MESSAGE_PACK.md`

### Earlier institutional foundations

- `server/routers/institutional-life-support.ts`
- `server/lib/institutional-life-support-payments.ts`
- `client/src/pages/InstitutionWorkspace.tsx`
- `client/src/components/InstitutionHomePanel.tsx`
- `drizzle/schema.ts`

---

## Final status

**Software status:** Institutional OS trust-closure implementation merged and locally validated.  
**Migration status:** Corrected; institutional migration is `0172`.  
**Production status:** Requires Render migration and authenticated smoke-test evidence.  
**Commercial status:** Pricing and Kiirua briefing prepared; final quote waits for baseline data and approved contract.  
**Global-readiness status:** Not yet an evidence-backed “yes”; the remaining work is controlled production, governance, clinical, and device verification.
