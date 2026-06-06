# Feedback ticket workflow

**Purpose:** How CEO and AI agents triage user feedback tickets for gap fixes across courses, ResusGPS, Care Signal, and platform surfaces.

**Registry:** PSOT §21 · extends PR #128 `contentSafetyReports` via unified `platformFeedbackTickets` (migration **0048**).

---

## Surfaces

| Entry point | Route / component | Default category |
|-------------|-------------------|------------------|
| Global header (authenticated) | Account menu → Send feedback | Other |
| Dedicated page | `/feedback?category=…&course=…` | Query param |
| Microcourse / AHA player | `ClinicalContentSafetyFooter` | `course_content` |
| ResusGPS | `ClinicalContentSafetyFooter` | `resus_gps` |
| Care Signal | `FeedbackDialog` on page | `care_signal` |
| Fellowship dashboard | Header button | `course_content` |
| Safety report (legacy) | Report unsafe content → auto `safety_concern` + `priority=safety` | Safety |

---

## Admin inbox

- **URL:** `/admin/feedback`
- **Hub:** Admin → Feedback inbox
- **Filters:** status, category
- **Actions:** status update, admin response (audit-logged via `adminAuditLog`)

### Status lifecycle

```
open → in_progress → resolved | wont_fix
```

Safety-priority tickets should be triaged first (clinical content team).

---

## Agent export (gap analysis)

Pattern mirrors [`FELLOWSHIP_ASSESSMENT_AUDIT.md`](./FELLOWSHIP_ASSESSMENT_AUDIT.md): generate a bundle, paste into Cursor, fix gaps, re-verify.

### tRPC (admin session)

```typescript
// In browser devtools or admin script with session cookie:
trpc.adminFeedback.exportOpen.query({ format: "markdown" })
```

### CLI export script

```bash
pnpm run export:feedback-tickets
```

Writes `docs/FEEDBACK_TICKETS_EXPORT.md` with category counts and verbatim open/in-progress messages.

### Agent triage loop

1. Export open tickets (`exportOpen` or CLI).
2. Group by category — safety first, then course_content, resus_gps, care_signal.
3. For course content: cross-check against `pnpm run audit:fellowship-assessments` and seed files.
4. For ResusGPS: inspect `client/src/lib/resus/` and protocol tables.
5. For Care Signal: check form UX and `careSignalEvents` schema (no PHI in tickets).
6. Fix → PR → merge → mark ticket `resolved` with admin response noting PR/commit.
7. Log in `WORK_STATUS.md` Done table.

---

## Database

| Migration | Table | Apply |
|-----------|-------|-------|
| 0047 | `contentSafetyReports` (legacy safety mirror) | `pnpm run db:apply-0047` |
| **0048** | `platformFeedbackTickets` (canonical) | `pnpm run db:apply-0048` |

---

## tRPC API

| Procedure | Auth | Description |
|-----------|------|-------------|
| `feedback.submit` | protected | Create ticket; returns `{ ticketId }` |
| `feedback.listMine` | protected | User's recent tickets |
| `adminFeedback.list` | admin | Filtered inbox |
| `adminFeedback.updateStatus` | admin | Status transition + audit |
| `adminFeedback.respond` | admin | Response + optional status + audit |
| `adminFeedback.exportOpen` | admin | JSON or markdown bundle for agents |

---

## Notifications (v1 follow-up)

Email admin on `priority=safety` when SES is wired. Until then: monitor `/admin/feedback` filter `safety_concern` + ops alerts. Log SES wiring in WORK_STATUS when done.

---

*Last updated: 2026-06-06*
