# Data Retention Schedule

**Document:** DATA_RETENTION_SCHEDULE.md  
**Version:** 1.0.0  
**Effective date:** 27 May 2026  
**Last updated:** 27 May 2026  
**Status:** Counsel review draft — operational baseline  
**Controller:** Paeds Resus Limited, Nairobi, Kenya  
**Contact:** privacy@paeds-resus.com  
**Linked from:** PRIVACY_POLICY_FULL.md §11  

---

## 1. Purpose

This schedule defines **how long** Paeds Resus Limited retains categories of personal data, **where** it is stored, and **how** deletion or anonymisation is executed. It aligns with SECURITY_BASELINE.md §4 and engineering table names in `drizzle/schema.ts`.

**Review cycle:** Annual, or upon material product change. Counsel must confirm periods for Kenya DPA and tax law.

---

## 2. Retention principles

1. **Data minimisation** — retain only as long as necessary for the purpose  
2. **QI and safety** — Care Signal retained long enough for learning cycles and limitation periods  
3. **Financial audit** — payment logs meet tax and reconciliation needs  
4. **Account deletion** — manual workflow until automated (DSAR_PROCEDURE.md)  
5. **Legal hold** — suspend deletion when litigation or investigation requires  

---

## 3. Master retention table

| Data category | Storage location | Table / key | Retention period | Deletion method | Owner |
|---------------|------------------|-------------|------------------|-----------------|-------|
| **User account** | Aiven MySQL | `users` | Active + **3 years** after closure | Anonymise email/phone; retain transaction refs | Ops |
| **Password hash** | `users` | Same as account | Deleted with account | Overwrite | Engineering |
| **Terms/privacy consent** | `users` / `legalConsent` | Consent columns | Account + **6 years** | Archive with account | Engineering |
| **Care Signal consent** | DB + localStorage | consent fields | Account + **6 years** | With account | Engineering |
| **Care Signal events** | `careSignalEvents` | **7 years** from `createdAt` | Anonymise (userId → null, raw_narrative redacted) — never hard-deleted, see §4.1 | Ops |
| **Safe-Truth events** | Safe-Truth tables | **7 years**; bereavement flag | Restricted access job | Ops |
| **ResusGPS sessionStorage** | Client browser | `sessionStorage` keys | **Until tab close** | User/browser | N/A |
| **ResusGPS saved cases** | `resusGPSCases` | Fellowship + **24 months** | Delete case rows | Engineering |
| **ResusGPS disclaimer ack** | User consent record | Account + **6 years** | With account | Engineering |
| **Fellowship progress** | `fellowshipProgress` etc. | Account + **6 years** | With account | Engineering |
| **Certificates** | `certificates` | **Indefinite** verification metadata; PII minimised on public verify | Anonymise only if fraud | Ops |
| **Certificate PDF assets** | Cloudflare R2 | **Indefinite** unless revoked | Delete object on revocation | Ops |
| **Enrollments / courses** | enrollment tables | **7 years** | Archive | Ops |
| **Payments & M-Pesa** | `payments`, `mpesaWebhookLog` | **7 years** | Archive then purge | Finance |
| **Analytics raw** | `analyticsEvents` | **13 months** | Monthly rollup then delete raw | Engineering |
| **Admin audit log** | `adminAuditLog` | **90 days** online | Export archive optional; then delete | Engineering |
| **Institutional roster** | `institutionalAccounts` | Contract + **3 years** | Per B2B exit | Ops |
| **Institutional action logs** | `institutionalActionLogs` | **7 years** | Facility export on exit | Ops |
| **DSAR tickets** | `legalDataRequests` | **3 years** after closure | Purge | Privacy |
| **Support email** | Mailbox / ticket | **3 years** | Mailbox policy | Support |
| **Backups** | Aiven backups | Provider default (**~30 days** rolling) | Provider lifecycle | Engineering |
| **Webhook debug** | Application logs | **90 days** | Log rotation | Engineering |

---

## 4. Product-specific notes

### 4.1 Care Signal

- Not a medical record — retention driven by QI governance and fellowship audit  
- Aggregates may survive event-level deletion in statistical form  
- Rate-limit counters: ephemeral or **90 days**
- **Standing decision (2026-07-12, CEO — pending formal counsel sign-off):** at both the 7-year cutoff and on DSAR erasure, `careSignalEvents` rows are **anonymised, never hard-deleted** — `userId` set null, `raw_narrative` passed through automated redaction (`server/lib/care-signal-deidentify.ts`). Structured/categorical fields (eventType, outcome, systemGaps, conditionCategory, facilityId) are retained as-is since they were already de-identified by design. This resolves the "Aggregates may survive event-level deletion" principle above literally: the row survives too, just severed from the reporting individual and stripped of free-text identifiers. See DSAR_PROCEDURE.md §6 for the same decision applied to DSAR requests, and OBSERVATION_ARCHITECTURE_V1_1.md Layer 0 for how this reconciles with "preserved permanently" (the permanence applies to derived knowledge/patterns, not necessarily every raw sentence forever).

### 4.2 Parent Safe-Truth

- Never merged into Care Signal KPIs  
- Bereavement submissions: access limited to trained reviewers; no marketing reuse  
- Guardian consent version retained per account

### 4.3 ResusGPS

- No server-side retention of session age/weight unless user saves Fellowship case  
- Legacy `localStorage` migration removes persistent clinical context

### 4.4 Institutional

- On MOU termination: export window **30 days**; deletion **90 days** unless dispute  
- Staff unlinking does not delete historical Care Signal attributed to provider ID

---

## 5. Deletion workflows

| Trigger | Process |
|---------|---------|
| User DSAR erasure | DSAR_PROCEDURE.md — verify identity, check exceptions |
| Account closure request | support@paeds-resus.com → manual checklist |
| Institutional exit | INSTITUTIONAL_B2B_ADDENDUM Part B.8 |
| Automated purge jobs | **Engineering — `pnpm run retention:cleanup` (dry-run default); monthly scheduler dry-run log; `--execute` after ops review** |

**Exceptions to erasure:** Legal obligation, tax, fraud investigation, fellowship dispute resolution, anonymous aggregates.

---

## 6. Archiving and exports

Before deleting `adminAuditLog` or Care Signal batches:

- Export CSV to secure storage if MOU or litigation requires  
- Encrypt at rest; access limited to privacy@ and legal@  

---

## 7. Children's data

Safe-Truth child-related narratives follow Safe-Truth row retention; erasure requests prioritised for review within **30 days**.

---

## 8. Cross-border

Data in **Aiven EU** remains subject to this schedule regardless of user country. Backups inherit provider retention.

---

## 9. Document control

| Version | Approved by | Date |
|---------|-------------|------|
| 1.0.0 | Counsel (pending) | 2026-05-27 |

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-05-27 | Initial retention schedule table |

---

*© 2026 Paeds Resus Limited.*
