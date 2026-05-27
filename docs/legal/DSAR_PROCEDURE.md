# Data Subject Access Request (DSAR) Procedure

**Document:** DSAR_PROCEDURE.md  
**Version:** 1.0.0  
**Effective date:** 27 May 2026  
**Last updated:** 27 May 2026  
**Status:** Internal operations — counsel review  
**Controller:** Paeds Resus Limited, Nairobi, Kenya  
**SLA:** **30 calendar days** (extendable once by 30 days with notice)  
**Contacts:** privacy@paeds-resus.com | `/legal/data-request`  

---

## 1. Purpose

This procedure operationalises data subject rights under the **Kenya Data Protection Act 2019** and PRIVACY_POLICY_FULL.md §13. It supports engineering via `legal.submitDataRequest` and `legalDataRequests` storage.

---

## 2. Request channels

| Channel | Handler |
|---------|---------|
| Web form | `/legal/data-request` (`client/src/pages/legal/DataRequest.tsx`) → `trpc.legal.submitDataRequest` |
| Email | privacy@paeds-resus.com |
| Postal | Paeds Resus Limited, Nairobi, Kenya (counsel to publish full address) |
| Institutional employee | Copy Institution HR; Paeds Resus assists per B2B Addendum |

All channels create or reference ticket ID format: **DSAR-YYYY-NNNN**.

---

## 3. Request types

| Type | `requestType` enum | Typical action |
|------|-------------------|----------------|
| Access | `access` | Export JSON/CSV of account data |
| Correction | `correction` | Update inaccurate profile fields |
| Deletion | `deletion` | Anonymise/delete per retention exceptions |
| Objection | `objection` | Stop legitimate-interest processing where applicable |
| Portability | `portability` | Machine-readable export |

---

## 4. Intake workflow

### Step 1 — Log (Day 0)

1. Auto-email from `submitDataRequest` to privacy@ with subject `[DSAR] {type} request #{id}`
2. Privacy Lead assigns owner within **2 business days**
3. Record in tracker: ID, email, user ID (if any), type, date received

### Step 2 — Verify identity (Days 0–5)

| User state | Verification |
|------------|--------------|
| Logged-in submitter | Match `ctx.user.id` to email on account |
| Email only | Send one-time verification link or request government ID fragment + selfie policy per counsel |
| Institutional | Confirm HR letter or institutional admin authorisation for roster data |

**Do not** disclose data until identity verified.

### Step 3 — Scope (Days 5–10)

Map request to data stores:

| Product | Tables / sources |
|---------|------------------|
| Account | `users` |
| Care Signal | `careSignalEvents` |
| Safe-Truth | Safe-Truth tables |
| ResusGPS | `resusGPSCases`; note sessionStorage not on server |
| Fellowship | `fellowshipProgress` |
| Payments | `payments`, `mpesaWebhookLog` (redact secrets) |
| Institutional | `institutionalAccounts`, action logs |
| Consent | legal consent columns / `legal-consent.ts` |
| Analytics | `analyticsEvents` (pseudonymous) |

### Step 4 — Legal review (Days 10–20)

Counsel or Privacy Lead checks exceptions:

- **Legal obligation** retention (tax, M-Pesa 7 years)  
- **Fellowship integrity** — may delay deletion until dispute resolved  
- **Institutional contract** — joint controller routing  
- **Other subjects' rights** — redact third parties in Care Signal narratives  
- **Manifestly unfounded or excessive requests** — refuse or charge fee per DPA  

### Step 5 — Fulfil (Days 20–30)

| Type | Deliverable |
|------|-------------|
| Access / portability | Encrypted ZIP: profile.json, care_signal.csv, etc. |
| Correction | Apply updates; confirm in email |
| Deletion | Run deletion checklist (§6); confirm anonymisation |
| Objection | Document outcome; stop processing where required |

### Step 6 — Close (Day ≤30)

- Email response with outcome and appeal rights (ODPC)  
- Update ticket status `closed`  
- Retain DSAR metadata **3 years** (DATA_RETENTION_SCHEDULE.md)  

### Extension

If complex, email requester before Day 30 with **additional 30 days** reason per Privacy Policy.

---

## 5. Response templates

### 5.1 Access fulfilled

> Your DSAR #{id} is complete. Attached is an encrypted export. Password sent separately. Retained data per legal obligation: [list]. Contact privacy@paeds-resus.com with questions.

### 5.2 Deletion partial

> We deleted/anonymised account data. Retained: M-Pesa records (7 years), anonymised aggregates. Care Signal fellowship audit rows: [status].

### 5.3 Refused

> We cannot fulfil [aspect] because [legal basis]. You may contact ODPC.

---

## 6. Deletion checklist (engineering)

When deletion approved:

- [ ] Anonymise `users.email`, `phone`, `name` → `deleted_user_{id}@anonymised.local`  
- [ ] Delete password hash; invalidate sessions  
- [ ] Care Signal: delete rows OR anonymise `userId` per counsel  
- [ ] Safe-Truth: delete guardian narratives  
- [ ] ResusGPS cases: delete saved cases  
- [ ] Remove from institutional roster links  
- [ ] Do **not** delete `mpesaWebhookLog` — redact PII where possible  
- [ ] Certificate verification: retain code with “revoked” if fraud concern  
- [ ] Export to backup archive if litigation hold **not** active  
- [ ] Log completion in DSAR ticket  

**Automation status:** CLI + admin tRPC (`legal.processDeletionRequest`, `legal.previewDeletion`); operator script `pnpm run dsar:deletion`. Counsel review still required before production `--execute`.

---

## 7. Cross-border

Exports may include data processed in **Aiven EU**. Inform requester in cover letter.

---

## 8. Metrics (internal)

| Metric | Target |
|--------|--------|
| First response | ≤ 2 business days |
| Completion | ≤ 30 calendar days |
| Verification pending | ≤ 5 business days |

Quarterly report to CEO.

---

## 9. Escalation

- P1 mistaken mass disclosure → INCIDENT_RESPONSE_AND_BREACH_PLAYBOOK.md  
- Institution dispute → legal@paeds-resus.com  
- Child data → expedited review within **15 days** where feasible  

---

## 10. Engineering reference

```typescript
// server/routers/legal.ts — submitDataRequest
// server/lib/legal-consent.ts — createLegalDataRequest
// client/src/pages/legal/DataRequest.tsx
```

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-05-27 | Initial DSAR procedure |

---

*© 2026 Paeds Resus Limited — INTERNAL*
