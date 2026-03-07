# Platform source of truth

**Purpose:** Single canonical reference for Paeds Resus platform decisions, definitions, and priorities.  
**Audience:** Codex, Manus, Cursor, and any developer.  
**Full narrative:** See CEO_Platform_Update_And_Reply_To_AI_Team.md in this folder.

---

## Brand and offerings

- **Paeds Resus** = organisation and platform. **ResusGPS** = one key product among equals (with Safe-Truth, elite fellowship, BLS/ACLS/PALS, others). Do not treat "Paeds Resus / ResusGPS" as the same thing.

## Auth and roles

| Topic | Decision |
|-------|----------|
| Auth | Email + password only. No OAuth. |
| User types (DB) | individual, parent, institutional. Single userType per user; no multi-role table yet. |
| Can switch to X | Any logged-in user may choose Provider / Parent / Institution in the UI. DB stores only default userType for post-login redirect. |
| Admin | Admin = role === 'admin' in DB. Set only via openId === OWNER_OPEN_ID at auth. No role elevation by editing DB. |
| Post-login redirect | By default userType only: individual to /home, parent to /parent-safe-truth, institutional to /institutional-portal. No last-used role yet. |

## Admin reports

| Term | Definition |
|------|------------|
| This month | Calendar month in EAT (East Africa Time, UTC+3). All month boundaries in reports use EAT. |
| Last 7 days | Rolling 7x24h from now. Not calendar week. |
| Safe-Truth usage | One row = one parentSafeTruthSubmissions row with createdAt in report month (EAT). |
| Product activity | One row = one analyticsEvents row with createdAt in last 7 days. |

## Course funnel

- Applied/enrolled: enrollments (createdAt, programType, paymentStatus). No strict state machine yet; count by date.
- Certified: certificates (issueDate, programType).

## Deployment and infra

- Current: Single production (Render + Aiven). No staging yet.
- When staging exists: Branch-based: develop to staging, main to production. All PRs verified on staging before production.
- Domain: Canonical: paedsresus.com to 301 to www.paedsresus.com.

## Security (current / target)

- Password: Min 8 characters (enforced). Complexity and session refresh TBD.
- Session: Long-lived cookie (~1 year); no refresh/sliding expiry yet.
- Compliance: Audit logs, data retention, PHI not yet defined. Minimal baseline to be agreed and documented.

## Priority order (locked)

1. Analytics instrumentation: ResusGPS and other products send events to analyticsEvents; admin reports show real activity.
2. Staging: Set up develop to staging, main to production.
3. Security baseline: Password complexity, session max age, audit logging for admin.
4. ResusGPS v4: Undo, medication dedup, multi-diagnosis, structured age, countdown timers, dose rationale.

When in doubt, read the CEO brief. When you change a decision here, update this file and note it in WORK_STATUS.md.
