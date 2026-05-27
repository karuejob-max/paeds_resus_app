# Incident Response and Data Breach Playbook

**Document:** INCIDENT_RESPONSE_AND_BREACH_PLAYBOOK.md  
**Version:** 1.0.0  
**Effective date:** 27 May 2026  
**Last updated:** 27 May 2026  
**Status:** Internal operations — counsel review  
**Entity:** Paeds Resus Limited, Nairobi, Kenya  
**Contacts:** privacy@paeds-resus.com | legal@paeds-resus.com | support@paeds-resus.com  

---

## 1. Purpose and scope

This playbook guides **internal staff** responding to security incidents and **personal data breaches** affecting the Paeds Resus platform. It implements PRIVACY_POLICY_FULL.md §15 (72-hour ODPC notification) and Kenya DPA 2019 breach obligations.

**Not for public distribution** — publish summary obligations in Privacy Policy only.

---

## 2. Definitions

| Term | Meaning |
|------|---------|
| **Security incident** | Unauthorised access attempt, outage, malware, credential leak, DDoS |
| **Personal data breach** | Breach of security leading to accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to, personal data |
| **Severity P1** | Active exfiltration, production DB compromise, M-Pesa webhook forgery, widespread credential leak |
| **Severity P2** | Limited user data exposure, single-tenant institutional leak, Care Signal bulk export by unauthorised admin |
| **Severity P3** | Attempted attack blocked, non-production leak, no personal data |

---

## 3. Response team

| Role | Responsibility | Default contact |
|------|----------------|-----------------|
| **Incident Commander** | CEO or delegate | Job Karue / engineering lead |
| **Privacy Lead** | ODPC notification, DSAR impact | privacy@paeds-resus.com |
| **Legal** | Privilege, regulator correspondence | legal@paeds-resus.com |
| **Engineering** | Containment, forensics, patch | On-call engineer |
| **Communications** | User/institution notice drafting | CEO approval |
| **Safaricom liaison** | M-Pesa fraud | support + finance |

Maintain encrypted contact sheet offline.

---

## 4. Detection sources

- Admin audit anomalies (`adminAuditLog`)
- M-Pesa webhook IP allowlist violations (`MPESA_CALLBACK_IP_ALLOWLIST`)
- Aiven / Render / Cloudflare alerts
- User reports to support@paeds-resus.com
- ODPC or institution inquiry
- Dependency CVE advisories

---

## 5. Response phases

### Phase 1 — Identify (0–2 hours)

1. Open incident ticket: `INC-YYYY-MM-DD-NNN`
2. Classify P1/P2/P3
3. Preserve logs — **do not** mass-delete audit trails
4. Record timeline in incident doc (UTC + EAT)

### Phase 2 — Contain (2–8 hours)

| Action | Owner |
|--------|-------|
| Rotate compromised API keys, JWT secrets, DB passwords | Engineering |
| Disable affected admin accounts | Engineering |
| Block malicious IPs at Cloudflare / allowlist | Engineering |
| Pause M-Pesa callbacks if webhook compromise suspected | Engineering + finance |
| Snapshot database for forensics | Engineering |
| Preserve webhook log (`mpesaWebhookLog`) | Engineering |

### Phase 3 — Assess (8–24 hours)

1. Determine **categories of data** affected (accounts, Care Signal, Safe-Truth, payments)
2. Count approximate **data subjects**
3. Assess **risk** to rights (identity theft, employment harm, clinical harm from ResusGPS tampering)
4. Determine if breach is **notifiable** to ODPC and users
5. Involve counsel if P1/P2 or any Care Signal / Safe-Truth narrative leak

### Phase 4 — Notify (72-hour ODPC clock)

**Kenya DPA 2019:** Notify **ODPC within 72 hours** of becoming aware, where breach is likely to result in risk to rights.

| Step | Deadline | Action |
|------|----------|--------|
| Internal counsel brief | ASAP | legal@paeds-resus.com |
| ODPC notification draft | ≤ **72 hours** | Privacy Lead |
| Affected users | Without undue delay if high risk | Email + in-app banner |
| Institutional customers | Without undue delay | MOU contact + B2B §B.10 |
| Safaricom | If payment data | Per Daraja incident process |

**ODPC placeholder registration:** [ODPC registration number — counsel to insert]

Notification content (minimum):

- Nature of breach  
- Categories and approximate number of subjects  
- Likely consequences  
- Measures taken and contact point (privacy@paeds-resus.com)  

### Phase 5 — Recover

- Patch vulnerability; deploy via staging first  
- Force password reset if credential database affected  
- Re-enable M-Pesa with rotated credentials  
- Verify `RoleGate` and `role-boundary-provider-api` tests pass  

### Phase 6 — Review (within 14 days)

- Post-incident report  
- Update SECURITY_BASELINE.md and this playbook  
- Train staff on root cause  

---

## 6. Product-specific scenarios

### 6.1 Care Signal free-text PHI leak

- **Risk:** Patient identifiers in narratives  
- **Contain:** Disable export endpoints; restrict admin review queue  
- **Notify:** Affected providers; institution if facility identifiable  
- **Remediate:** Moderation tooling backlog; user education blast  

### 6.2 ResusGPS pathway tampering

- **Risk:** Clinical harm if malicious dosing change deployed  
- **Contain:** Roll back deployment; verify git integrity  
- **Notify:** Users if production served wrong content > 1 hour  
- **Regulatory:** Counsel on whether medical device reporting triggered  

### 6.3 Certificate verification database leak

- **Risk:** Fraudulent certificate claims  
- **Contain:** Rotate verification signing; invalidate affected codes  

### 6.4 M-Pesa webhook spoofing

- **Risk:** Fraudulent enrollments  
- **Contain:** IP allowlist; reconcile against Safaricom portal  
- **Notify:** Affected payers if charges confirmed  

---

## 7. Communication templates (internal)

### 7.1 User email (high-risk breach)

> Subject: Important security notice from Paeds Resus  
>  
> We are writing to inform you of a data security incident affecting [DESCRIPTION]. We became aware on [DATE]. [ACTIONS TAKEN]. We recommend [PASSWORD RESET / MONITOR M-PESA]. Contact privacy@paeds-resus.com.  
>  
> Paeds Resus Limited

### 7.2 Institution email

> Subject: Care Signal / institutional data incident — [FACILITY]  
>  
> Per our B2B Addendum, we notify you of [SUMMARY]. Facility liaison: [NAME]. Next call: [TIME EAT].

---

## 8. Evidence preservation

- `adminAuditLog` exports before retention purge  
- `mpesaWebhookLog` relevant rows  
- CDN access logs (Cloudflare)  
- Git commit hashes for deployed build  
- Consent versions in effect (`shared/legal-versions.ts`)

Chain of custody: store in encrypted drive; limit access.

---

## 9. Regulatory contacts

| Authority | When | Contact |
|-----------|------|---------|
| **ODPC Kenya** | Personal data breach notification | https://www.odpc.go.ke |
| **CAK** | If telecom/user data crossover | Per counsel |
| **AHA** | If alignment agreement breach | Per contract |

---

## 10. Testing

- **Tabletop exercise:** Annually  
- **Staging breach drill:** After staging environment live  
- **Webhook replay test:** Quarterly in sandbox  

---

## 11. Related documents

- PRIVACY_POLICY_FULL.md  
- DSAR_PROCEDURE.md  
- DATA_RETENTION_SCHEDULE.md  
- INSTITUTIONAL_B2B_ADDENDUM.md  
- LEGAL_IMPLEMENTATION_INDEX.md  

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-05-27 | Initial internal breach playbook |

---

*© 2026 Paeds Resus Limited — INTERNAL*
