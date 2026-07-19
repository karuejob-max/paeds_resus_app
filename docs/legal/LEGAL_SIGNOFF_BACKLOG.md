# Legal Sign-Off Backlog

**Document:** LEGAL_SIGNOFF_BACKLOG.md
**Version:** 1.0.0
**Created:** 19 July 2026
**Owner:** Job Karue (CEO) — this file is the single canonical list of what is waiting on counsel across the whole platform
**Purpose:** So that when legal comes on board, their job is to **review and sign off**, not to draft from scratch or hunt across a dozen docs to find out what's pending. Every substantive legal document already exists in counsel-ready draft form (see `LEGAL_IMPLEMENTATION_INDEX.md` §1 for the full registry). Nothing in engineering should ever be blocked waiting for this list to clear — every item below already has a working, shipped implementation behind it; counsel's role is to confirm or correct the policy layer, not to unblock the product.

**How to use this file:** Each row is one discrete thing counsel needs to look at. When counsel clears an item, move it from its "Open" table into the "Cleared" table at the bottom with the date and who signed off, rather than deleting it — same convention as `WORK_STATUS.md`.

---

## 1. Whole-document sign-offs (never yet reviewed by counsel)

Every one of these was drafted to counsel-ready standard specifically so that sign-off is the only remaining step — not a redraft.

| Document | What it covers | Drafted since | Blocking anything today? |
|---|---|---|---|
| `PRIVACY_POLICY_FULL.md` | Full privacy policy, all products | 2026-05-27 (v1.1.0 as of 2026-07-19) | No — published at `/privacy` as a draft under active development; re-consent gate bumped to v1.1.0 on 2026-07-19 (CEO decision, item 2.1) |
| `TERMS_OF_USE_FULL.md` | Full terms of use | 2026-05-27 | No — published at `/terms` |
| `CARE_SIGNAL_DATA_PROCESSING_NOTICE.md` | Care Signal-specific processing notice | 2026-05-27 (v1.1.0 as of 2026-07-19) | No — published at `/legal/care-signal` |
| `CLINICAL_INTENDED_USE_STATEMENT.md` | ResusGPS / clinical decision-support intended-use disclaimer | 2026-05-27 | No — published at `/legal/clinical-use` |
| `COOKIE_AND_ANALYTICS_NOTICE.md` | Cookies, analytics, sub-processors | 2026-05-27 | No — published at `/legal/cookies` |
| `DATA_RETENTION_SCHEDULE.md` | Retention periods, purge jobs | 2026-05-27, updated 2026-07-12 for anonymise-not-delete | No — drives `retention:cleanup` |
| `DSAR_PROCEDURE.md` | Data-subject access/erasure request handling | 2026-05-27, updated 2026-07-12 for anonymise-not-delete | No — drives `dsar:deletion` + `legal.processDeletionRequest` |
| `INCIDENT_RESPONSE_AND_BREACH_PLAYBOOK.md` | Security incident / breach response | 2026-05-27 | No — internal ops playbook, usable as-is |
| `INSTITUTIONAL_B2B_ADDENDUM.md` | B2B data-processing addendum for institutional clients | 2026-05-27 | No — referenced in onboarding |
| `B2B_MSA_TEMPLATE.md` | Master Services Agreement template | 2026-05-27 (Phase 5) | No — not yet needed until a formal institutional contract is signed |
| `PILOT_HOSPITAL_MOU_TEMPLATE.md` | Pilot partnership MOU template | Pre-existing | No — used ad hoc for pilot conversations |
| `EAC_EXPANSION_LEGAL_CHECKLIST.md` | Pre-launch checklist for a new East African country | 2026-05-27 | No — not yet triggered (single-country operation) |

**Standing instruction:** none of the above being unsigned should ever stop a product launch, a feature ship, or a data-processing activity going live. Each is already marked "counsel review draft — not legal advice" in its own header, is published (where public-facing) with that status visible, and the underlying engineering is built and running regardless. This is a deliberate, CEO-owned risk position, not an oversight — see `LEGAL_COMPLIANCE_BASELINE.md` §6 for the sign-off gate that specifically applies to *outcome claims* (a narrower, higher-stakes category than ordinary product operation).

---

## 2. Specific decisions/mechanisms needing a counsel opinion (narrower than a whole-document review)

These are individual questions, mostly already flagged inline in the docs above, consolidated here so none gets lost in a 300-line markdown file.

### 2.1 Re-consent version bump — CEO decision made: re-consent now

`PRIVACY_POLICY_FULL.md` and `CARE_SIGNAL_DATA_PROCESSING_NOTICE.md` were both substantively updated 2026-07-19 (to v1.1.0) to catch the documents up with engineering shipped since May — three-way Care Signal submission modes, Safe-Truth v1's no-account flow, and the anonymise-not-delete standing decision. **CEO decision (2026-07-19): bump now, don't wait for counsel.** `shared/legal-versions.ts`'s `privacyPolicy` and `careSignalNotice` keys are both bumped to `"1.1.0"` — every existing user will hit the re-consent gate (`isTermsConsentStale` / `CareSignalConsentGate`) on their next protected action, re-consenting to the current best-effort draft rather than the outdated v1.0.0 text. Rationale, as given: if counsel later requires further substantive changes, users can simply be asked to re-consent again at that point — sequencing correctness isn't worth blocking on. Closed; nothing further needed here unless counsel's eventual review produces changes substantive enough to warrant another version bump and a second re-consent round.

### 2.2 Anonymise-not-delete (Care Signal + Safe-Truth) — engineering decision, not yet counsel-reviewed

Standing CEO decision (2026-07-12, gap-analysis item #13): erasure requests and the 7-year retention cutoff both anonymise (`userId` → null, narrative redacted) rather than hard-delete. Implemented in `care-signal-anonymize.ts` / `care-signal-deidentify.ts`, referenced in `DATA_RETENTION_SCHEDULE.md`, `DSAR_PROCEDURE.md`, and now `PRIVACY_POLICY_FULL.md`/`CARE_SIGNAL_DATA_PROCESSING_NOTICE.md`. **Specific question for counsel:** does Kenya DPA 2019's erasure right require a true hard delete in this context, or does irreversible de-identification satisfy it? If counsel requires hard deletion instead, `care-signal-anonymize.ts` is the one file to change (per its own doc comment).

### 2.3 Third-party name redaction in free text — known, documented limitation

The automated redaction pass (`care-signal-deidentify.ts`) reliably catches structured identifiers (facility names, dates, phone numbers, emails, labelled ID/passport numbers) but does **not** reliably catch a person's name mentioned in ordinary prose. Flagged in code comments and in `DSAR_PROCEDURE.md`. **Question for counsel/CEO jointly:** is manual review sufficient for this specific case on a per-DSAR-request basis (current approach), or does volume eventually justify an LLM-based redaction pass — which is a real new-dependency and per-request-cost decision, not a small addition?

### 2.4 Fellowship pseudonymous token — residual correlation risk, disclosed not solved

`fellowshipTokens`' schema doc comment (and now `CARE_SIGNAL_DATA_PROCESSING_NOTICE.md` §3) discloses that server-side request logs could, in principle, correlate a login session to a token at the moment of creation, even though no application code stores that link. No engineering fix removes this entirely — it is a property of any server that logs requests at all. **Question for counsel:** does this residual, log-level correlation risk need explicit disclosure beyond what's already in the notice, or is "we do not store or use this correlation, and access to raw request logs is restricted to X" sufficient?

### 2.5 Safe-Truth v1 device-local disclaimer as a substitute for guardian consent

Flagged inline in `PRIVACY_POLICY_FULL.md` §10 (added 2026-07-19). The no-account `/safe-truth` flow cannot obtain account-level guardian consent because there is no account — it shows a one-time, device-local disclaimer acknowledgement instead (a standalone audit record, never linked to any submission). **Question for counsel:** is a device-local disclaimer acknowledgement, without any identity behind it, an adequate substitute for guardian consent when the reporter may be describing a minor's care experience? This is a genuinely new legal question the original `/parent-safe-truth` (account-based) flow never had to answer, since that flow always had an account and click-wrap consent behind it.

### 2.6 ODPC registration number

`LEGAL_IMPLEMENTATION_INDEX.md` §8 and `shared/legal-versions.ts`'s `odpcRegistrationPlaceholder` still need the real Office of the Data Protection Commissioner (Kenya) registration number inserted once registration completes. Not a review question — an outstanding data-entry item, listed here so it isn't lost.

---

## 3. Cleared

*(Nothing cleared yet — this file is new as of 2026-07-19. Move rows here from Section 1/2 as counsel signs off, with date and reviewer name, per the convention above.)*

---

## Related documents

| Doc | Relationship |
|---|---|
| `LEGAL_IMPLEMENTATION_INDEX.md` | Maps each doc to the engineering surfaces (routes, routers, components) that implement it |
| `LEGAL_COMPLIANCE_BASELINE.md` | Older (2026-05-27) governance draft — narrower scope, largely superseded by this file and the full docs it names, but still holds the outcome-claims sign-off gate (§6), which is unrelated to this backlog and remains in force |
| `DATA_RETENTION_SCHEDULE.md`, `DSAR_PROCEDURE.md` | Operational procedures this backlog's item 2.2 concerns |

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-07-19 | Initial consolidated backlog, created during a platform-wide gap-remediation audit |

---

*© 2026 Paeds Resus Limited.*
