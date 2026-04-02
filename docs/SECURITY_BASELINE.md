# Security baseline

**Purpose:** Minimal security rules and behaviour for Paeds Resus (Phase 3).  
**Audience:** Codex, Manus, Cursor, developers.  
**See also:** [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md).

---

## 1. Password policy

- **Minimum length:** 8 characters (enforced in register and schema).
- **Complexity:** At least one letter and one number (enforced in register validation). No requirement for special characters or history.
- **Storage:** Bcrypt hash only; never store plain passwords.

---

## 2. Session policy

- **Max age:** Configurable via `SESSION_MAX_AGE_MS` (milliseconds). Recommended: **30 minutes** (e.g. `1800000`) for higher security; default remains 1 year if unset for backward compatibility.
- **Cookie:** `httpOnly`, `secure` in production, `sameSite: lax` on localhost (so login works without HTTPS). Cookie `maxAge` matches session max age.
- **Refresh:** No sliding expiry or refresh token yet; session ends after max age.

---

## 3. Admin audit logging

- **Requirement:** Every admin action (every call to an `adminProcedure`) is logged.
- **Logged:** Admin user id, procedure path (e.g. `adminStats.getReport`), optional sanitized input (**top-level JSON keys only**, from parsed procedure `input` — see `summarizeAdminProcedureInput` in `server/_core/trpc.ts`), timestamp. No passwords or tokens.
- **Storage:** `adminAuditLog` table (or equivalent). Retention and export to be defined later (e.g. 90 days, compliance).

---

## 4. Compliance (future)

- **HIPAA / PHI:** Not yet fully defined; treat user and health-related data as sensitive; no logging of PHI in audit log.
- **Data retention:** To be defined; document in this file when agreed.

---

*When you change behaviour (e.g. session duration, password rules), update this file and code together.*
