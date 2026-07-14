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

## Admin inbox (CEO view)

- **URL:** `/admin/feedback` (admin role required)
- **Hub:** Admin → **Feedback inbox** card
- **Filters:** status (pending/in progress/fixed/won't fix/duplicate), product source, issue type, severity, course slug, date range
- **Detail:** user message, page URL, source tool, course slug, module ID, browser user-agent, screenshot link (if provided)
- **Actions:** status transition with notes, agent assignment (Cursor / Manus / CEO / clinical), comma-separated tags, admin response (audit-logged via `adminAuditLog`)

### AI assist (Gemini)

On `/admin/feedback` (requires `GEMINI_API_KEY` on the server):

| Action | Behavior |
|--------|----------|
| **AI triage** | Suggests severity, issue type, assignee, tags, next step, and a **regression guard** note. Does **not** mutate until you click **Apply suggestions**. |
| **Draft reply** | Inserts a draft into the admin response box — edit before **Save & mark fixed**. |
| **AI cluster open** | Groups pending/in-progress tickets that look like the same issue (duplicates/themes). |
| **Agent brief** | Builds a paste-ready Cursor/Manus markdown brief (problem, files, regression guard, acceptance checks, ticket evidence). Available on a single ticket or a cluster. Copy/download — does not mutate tickets. |

Hard rules: AI drafts only; humans decide. Never delete or shallow clinical/content modules to “fix” a ticket (see regression guard below).

### Structured fields (submit)

| Field | Values | Notes |
|-------|--------|-------|
| **Source (category)** | `course_content`, `resus_gps`, `care_signal`, `payment_technical`, `safety_concern`, `other` | Which product/page area |
| **Issue type** | `bug`, `content`, `ux`, `billing`, `clinical`, `other` | Triage bucket (migration 0051) |
| **Severity** | `low`, `medium`, `high`, `critical` | User-selectable; safety reports default high |
| **Context** | `pageUrl`, `courseSlug`, `surface`, `userAgent` | Auto-captured on submit |

### Status lifecycle

```
open (Pending) → in_progress → resolved (Fixed) | wont_fix | duplicate
```

UI labels: **Pending** = `open`, **Fixed** = `resolved`. Safety-priority + `critical` severity tickets triage first.

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
| **0051** | severity, issueType, agent assignment, duplicate status, status history | `pnpm run db:apply-0051` |

---

## tRPC API

| Procedure | Auth | Description |
|-----------|------|-------------|
| `feedback.submit` | protected | Create ticket; returns `{ ticketId }` |
| `feedback.listMine` | protected | User's recent tickets |
| `adminFeedback.list` | admin | Filtered inbox (status, source, issue type, severity, course slug, dates) |
| `adminFeedback.getById` | admin | Single ticket detail |
| `adminFeedback.updateStatus` | admin | Status transition + note + audit |
| `adminFeedback.updateAssignment` | admin | Assign Cursor/Manus/CEO/clinical + tags |
| `adminFeedback.respond` | admin | Response + optional status + audit |
| `adminFeedback.exportOpen` | admin | JSON or markdown bundle for agents |

---

## Notifications (v1 follow-up)

Email admin on `priority=safety` when SES is wired. Until then: monitor `/admin/feedback` filter `safety_concern` + ops alerts. Log SES wiring in WORK_STATUS when done.

---

## Regression guard (agents)

When fixing feedback tickets — especially **content** or **clinical** issues:

1. **NEVER remove existing detailed content** to fix a bug or "simplify" UX. Fix the bug; preserve what works.
2. **Extend, don't replace:** improvements must net-increase clinical depth (see `AGENTS.md` §9).
3. After fix: mark ticket **Fixed** (`resolved`) with admin response citing PR/commit.
4. Run `pnpm run audit:microcourse-depth:strict` for course-content tickets before merge.

*Last updated: 2026-06-12*
