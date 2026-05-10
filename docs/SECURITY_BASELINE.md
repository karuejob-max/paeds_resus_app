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

## 5. Browser “clinical context” (age / weight for dosing)

- **ResusGPS / protocol helpers** store **age and weight** in **`sessionStorage`** (per browser tab), not long-lived `localStorage`, so data clears when the tab closes.
- **Legacy:** a one-time migration reads the old `localStorage` key and moves it to session storage, then removes the legacy key.
- **Classification:** treat as **sensitive workflow context** (not a medical record). No patient names are stored in this context.
- **Care Signal / Safe-Truth:** governed by their own submission flows and DB retention (see PSOT).

---

## 6. `server/security.ts` (demo module)

- **Not** the application’s password or session security (those use **bcrypt** + **JWT** in `server/_core`).
- **In-memory** `auditLogs` / `dataAccessLogs` are **samples only**; real admin audit history is **`adminAuditLog`** in the database.
- **`encryptData`:** in production requires **`SECURITY_SERVICE_SECRET`** (≥24 characters); see `.env.example`.

---

*When you change behaviour (e.g. session duration, password rules), update this file and code together.*
