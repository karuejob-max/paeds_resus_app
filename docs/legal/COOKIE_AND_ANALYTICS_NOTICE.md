# Cookie and Analytics Notice

**Document:** COOKIE_AND_ANALYTICS_NOTICE.md  
**Version:** 1.0.0  
**Effective date:** 27 May 2026  
**Last updated:** 27 May 2026  
**Status:** Counsel review draft  
**Controller:** Paeds Resus Limited, Nairobi, Kenya  
**Contact:** privacy@paeds-resus.com  
**Web route:** `/legal/cookies`  

---

## 1. Introduction

This notice explains how Paeds Resus Limited (“**we**”) uses cookies, local storage, session storage, and analytics technologies on the Paeds Resus platform. It supplements PRIVACY_POLICY_FULL.md and should be read with TERMS_OF_USE_FULL.md.

**Kenya context:** Under the Data Protection Act 2019, non-essential cookies and similar technologies may require a **lawful basis** (often consent or legitimate interests balanced against your rights). This notice describes our current practice; counsel should confirm whether a consent banner is required for your deployment configuration.

---

## 2. What technologies we use

| Technology | Purpose | Typical duration |
|------------|---------|------------------|
| **Session cookie / JWT** | Authentication, security | Session or configured expiry |
| **sessionStorage** | ResusGPS age/weight workflow context | Until browser tab closes |
| **localStorage** | Care Signal consent flag, UI preferences, legacy migration keys | Persistent until cleared |
| **Analytics events** | Product usage measurement (`analyticsEvents`) | Server retention 13 months |
| **CDN / security cookies** | Cloudflare bot management, asset delivery | Per Cloudflare policy |

We do **not** use cookies to track patients. We do **not** sell cookie data to advertisers.

---

## 3. Categories of cookies and storage

### 3.1 Strictly necessary

Required for the platform to function. **No consent required** where exempt under applicable law.

| Name / key | Purpose |
|------------|---------|
| Authentication token | Logged-in session |
| CSRF / security headers | API protection |
| Load balancer affinity | Infrastructure (hosting provider) |

### 3.2 Functional

Remember choices and improve experience.

| Name / key | Purpose |
|------------|---------|
| `care_signal_consent_granted` (localStorage) | Records client-side Care Signal consent before server sync |
| UI theme / dismiss flags | Disclaimer and onboarding dismissals |
| Fellowship UI state | Non-sensitive progress hints |

**Lawful basis:** Legitimate interests / contract.

### 3.3 Analytics

Help us understand feature usage and improve safety.

| Data | Examples |
|------|----------|
| Page views | `/resus`, `/care-signal` |
| Events | `care_signal_consent_granted`, enrollment funnels |
| Pseudonymous session ID | Linked to user ID when logged in |

**Lawful basis:** Legitimate interests (service improvement, security). Where ODPC guidance requires opt-in for non-essential analytics, we will implement a consent banner — **engineering flag TBD after counsel**.

**Retention:** 13 months raw; aggregates may be kept longer (DATA_RETENTION_SCHEDULE.md).

### 3.4 Marketing

We do **not** deploy third-party advertising cookies on the clinical platform as of v1.0.0. If introduced, we will update this notice and obtain consent where required.

---

## 4. Third-party analytics and subprocessors

Analytics and infrastructure providers may set their own cookies when enabled:

| Provider | Role | Policy link |
|----------|------|-------------|
| Cloudflare | CDN, security | https://www.cloudflare.com/privacypolicy/ |
| Hosting (Render or equivalent) | Application delivery | Per provider |
| [Analytics vendor if enabled] | Product analytics | To be listed at `/legal/subprocessors` |

Full sub-processor list: **Subprocessors** page (`client/src/legal/cookie-notice.ts` → `/legal/subprocessors`).

---

## 5. How to control cookies and storage

| Action | Effect |
|--------|--------|
| Browser “clear site data” | Logs you out; clears localStorage/sessionStorage including ResusGPS context |
| Disable cookies entirely | Platform login will not work |
| Log out | Ends authenticated session |
| Email privacy@paeds-resus.com | Request analytics opt-out where technically feasible |

**Note:** Clearing storage may reset Care Signal consent UI until server consent is re-fetched.

---

## 6. Do Not Track

We do not currently respond to DNT browser signals. We honour applicable legal requirements instead.

---

## 7. Children

We do not knowingly use analytics to profile children. Parent Safe-Truth accounts are guardian-facing; minimize child-identifying analytics.

---

## 8. International users (EAC)

Users outside Kenya should review EAC_EXPANSION_LEGAL_CHECKLIST.md. Cookie rules in Uganda, Tanzania, Rwanda, and other states may differ — local counsel recommended before marketing.

---

## 9. Changes

Version `LEGAL_DOCUMENT_VERSIONS.cookieNotice`. Updates published at `/legal/cookies` with `LEGAL_LAST_UPDATED`.

---

## 10. Contact

privacy@paeds-resus.com | `/legal/data-request`

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-05-27 | Initial cookie and analytics notice |

---

*© 2026 Paeds Resus Limited.*
