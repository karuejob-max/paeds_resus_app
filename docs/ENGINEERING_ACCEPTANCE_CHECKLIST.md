# Engineering acceptance checklist

Use this before marking work "done" or before merge. Codex, Manus, Cursor, and devs should all validate against the same list.

---

## Every PR / sprint slice

- [ ] Aligns with [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) (auth, roles, reports definitions, priority order).
- [ ] If the change affects **positioning**, **multi-product scope**, or **institutional / community** flows, aligns with [STRATEGIC_FOUNDATION.md](./STRATEGIC_FOUNDATION.md).
- [ ] No new single-role lock; multi-role UI switch and default `userType` behaviour preserved.
- [ ] Reuses existing routes/components/schemas where possible; no duplicate implementations.
- [ ] Admin reports: "this month" uses EAT (UTC+3) where applicable; "last 7 days" = rolling 7×24h.
- [ ] No hardcoded secrets; env vars documented in `.env.example` if new.

---

## When touching auth or users

- [ ] Admin only via `OWNER_OPEN_ID`; auth check is `role === 'admin'`.
- [ ] Post-login redirect follows default `userType` (individual → `/home`, parent → `/parent-safe-truth`, institutional → `/institutional-portal`).

---

## When touching deployment or infra

- [ ] Staging rule when it exists: PRs verified on staging before production; branch-based deploys (e.g. develop → staging, main → production).
- [ ] Domain: paedsresus.com → 301 to www.paedsresus.com (documented and implemented).

---

## When touching analytics or admin reports

- [ ] Events flow to existing `events.trackEvent` → `analyticsEvents`; no parallel ad-hoc tracking.
- [ ] Report KPIs match PLATFORM_SOURCE_OF_TRUTH (Safe-Truth = submissions in month EAT; product activity = events in last 7 days).

---

## After you finish

- [ ] [WORK_STATUS.md](./WORK_STATUS.md) updated: your work under **Done**, **In progress** adjusted, and any **Critique / review** you want to leave for others.
