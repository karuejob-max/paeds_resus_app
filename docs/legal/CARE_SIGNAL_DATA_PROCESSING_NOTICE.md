# Care Signal — Data Processing Notice

**Document:** CARE_SIGNAL_DATA_PROCESSING_NOTICE.md  
**Version:** 1.1.0  
**Effective date:** 27 May 2026  
**Last updated:** 19 July 2026  
**Status:** Counsel review draft  
**Controller:** Paeds Resus Limited, Nairobi, Kenya  
**Contact:** privacy@paeds-resus.com | legal@paeds-resus.com  

---

## 1. Purpose of this notice

This notice supplements the **Privacy Policy** (PRIVACY_POLICY_FULL.md) and applies specifically to **Care Signal**, the Paeds Resus product for healthcare-provider quality improvement (QI) reporting of paediatric emergency incidents and near-misses.

By submitting your first Care Signal report, you provide **explicit consent** to processing described here (recorded via `CareSignalConsentGate` and `legal.acceptCareSignalConsent`).

---

## 2. What Care Signal is — and is not

| Care Signal **is** | Care Signal **is not** |
|--------------------|------------------------|
| A structured QI and learning tool for providers | A patient medical record or electronic health record |
| A fellowship Pillar C progress input (streak rules) | Mandatory employer incident reporting (unless your employer adopts it formally) |
| A source of **de-identified-from-patient** facility aggregates | An anonymous channel — your provider account is known to the platform |
| A near-miss and systems-gap learning system | A whistleblower hotline with statutory protections (unless your employer provides them) |

**You remain responsible** for any parallel reporting required by your hospital, county, or regulator.

---

## 3. Categories of data processed

| Field category | Examples | Patient identifiers |
|----------------|----------|---------------------|
| Event metadata | Date/time (EAT), facility, department | Not collected in schema |
| Clinical context bands | Age band, presentation category, outcome band | No patient names |
| Systems factors | Delays, equipment gaps, staffing, handover issues | — |
| Preventability | Structured preventability assessment | — |
| Narrative | Free-text description | **Must not** include patient names, IDs, addresses, photos |
| Provider link | Depends on submission mode (see below) | Varies by mode |
| Technical | IP, user agent on consent; rate-limit counters | — |

**Submission mode (added since v1.0.0):** every report is filed under one of three modes, chosen by you at submission time, each with a different provider-link footprint:

| Mode | What's linked | Fellowship credit |
|------|---------------|--------------------|
| **Named** | Your real account `userId` | Yes, via your account |
| **Pseudonymous** | A Fellowship token — a generated ID with a one-time recovery code, held on your device only, never linked to your real account | Yes, via the token |
| **Anonymous** | Nothing — no `userId`, no token | No |

If you choose Pseudonymous and lose your device without having saved the recovery code, the streak tied to that token cannot be recovered — there is no plain link stored anywhere for us to look it up, by design.

Schema reference: `careSignalEvents` in `drizzle/schema.ts` — no patient identifier columns by design.

---

## 4. Lawful basis

| Processing | Basis |
|------------|-------|
| First submission and storage | **Consent** (this notice + Privacy Policy) |
| Fellowship streak calculation | **Contract** (Fellowship terms) + **legitimate interests** (integrity) |
| Facility dashboards for authorised admins | **Legitimate interests** / **B2B contract** |
| National aggregate (admin-only surveillance views) | **Legitimate interests** / **public interest** in health system QI — subject to governance MOU |
| Abuse prevention (rate limits, duplicate detection) | **Legitimate interests** |

---

## 5. Who can see your data

| Recipient | What they see |
|-----------|---------------|
| **You** | Your submission history and fellowship-related streak status |
| **Paeds Resus operations** | Full report for moderation, appeals, and platform integrity |
| **Facility administrators** (if your facility is registered) | **Aggregated** and facility-scoped views — not public league tables |
| **Platform administrators** | Review queues (`/admin/care-signal-review`), national aggregate tools |
| **MOH / WHO partners** | Only under signed governance — **not** routine public disclosure |
| **Other providers** | Not your individual reports (unless you share them) |

Reports are always **de-identified from patients** regardless of submission mode. Whether a report is also de-identified from Paeds Resus depends on the mode you chose at submission (Section 3): **Named** and **Pseudonymous** reports carry a real or token-based provider link respectively and are not anonymous to Paeds Resus; **Anonymous** reports genuinely carry no identity link at all. Marketing copy must describe Care Signal's anonymity accurately per the mode being discussed, not as a blanket claim either way.

---

## 6. Retention

| Item | Period |
|------|--------|
| Individual Care Signal events | **7 years** from submission, then **anonymised, not deleted** — the provider link (if any) is removed and the free-text narrative is redacted of structured identifiers, rather than the row being purged. The same treatment applies to an erasure request received before the 7-year mark. |
| Consent records | Account lifetime + **6 years** |
| Aggregates derived from events | Unaffected by anonymisation, since they never carried row-level identity to begin with |

**Named/pseudonymous reports specifically:** anonymisation at 7 years (or on an erasure request) removes the `userId`/token link retroactively — the report itself, its clinical content, and its contribution to Fellowship history up to that point are preserved, but it can no longer be traced back to you. This does not undo Fellowship credit already earned.

See DATA_RETENTION_SCHEDULE.md for operational purge procedures.

---

## 7. Your obligations as a reporter

You agree to:

1. Submit only good-faith QI reports based on your professional experience
2. **Never** include patient names, national ID numbers, exact dates of birth, photographs, or other direct patient identifiers
3. Follow local clinical governance when preventability comments could affect named colleagues — use systems-focused language
4. Not submit more than **5 reports per day** (EAT) or duplicate reports within **10 minutes** for the same event
5. Use appeals (`/care-signal/appeal`) only for **documented system errors** (e.g. wrong month bucket), not for disagreement with fellowship rules

---

## 8. Fellowship Pillar C (streak rules summary)

- Submissions are bucketed by **East Africa Time** calendar month
- Grace and catch-up rules apply per Fellowship documentation
- **Paeds Resus Fellow** title requires Care Signal streak among other pillars — automation only when enabled by CEO gate
- Appeals do not override clinical judgment disputes — system errors only

---

## 9. Institutional employment context

If you report while employed at a participating hospital:

- Your employer may infer participation from institutional programmes
- This notice does **not** create employer non-retaliation rights unless your employer adopts separate policy
- Institutional B2B Addendum may allocate roles between employer and Paeds Resus as controller/processor

---

## 10. International transfers

Care Signal data is stored in Paeds Resus databases hosted via **Aiven (EU region)**. Transfers are subject to safeguards in the Privacy Policy.

---

## 11. Your rights

You may access, correct, or request deletion of your Care Signal submissions subject to exceptions (fellowship integrity, legal hold, institutional contract). Contact privacy@paeds-resus.com or use `/legal/data-request`. Response SLA: **30 days**.

Withdrawing consent stops **new** submissions; prior processing remains lawful. Fellowship progress may be affected.

---

## 12. Breaches

Personal data breaches involving Care Signal are handled per INCIDENT_RESPONSE_AND_BREACH_PLAYBOOK.md, including **72-hour ODPC notification** where required.

---

## 13. Changes

Version tracked as `LEGAL_DOCUMENT_VERSIONS.careSignalNotice`. Material changes require new consent at next submission or via platform notice.

---

## 14. Related documents

- PRIVACY_POLICY_FULL.md  
- TERMS_OF_USE_FULL.md  
- INSTITUTIONAL_B2B_ADDENDUM.md  
- DSAR_PROCEDURE.md  
- LEGAL_IMPLEMENTATION_INDEX.md  

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-05-27 | Initial Care Signal notice |
| 1.1.0 | 2026-07-19 | Catch-up revision, still pending counsel review: §3 rewritten for the three-way submission mode (named/pseudonymous/anonymous); §5 corrected — no longer claims every report is identified to Paeds Resus, since Anonymous mode genuinely has no identity link; §6 retention rewritten for anonymise-not-delete. **CEO decision (2026-07-19): re-consent existing users now** — see `PRIVACY_POLICY_FULL.md`'s matching changelog entry and `LEGAL_SIGNOFF_BACKLOG.md` item 2.1. |

---

*© 2026 Paeds Resus Limited.*
