# Sprint 1 — Measurement Truth MVP — implementation checklist

**Sprint goal (one line):** By end of sprint, admin **product activity** (`analyticsLastDays` in `adminStats.getReport`) reflects our main **revenue and mission** journeys—not only ResusGPS—and we have a **written event taxonomy** frozen in repo so we don’t regress.

**Canonical refs:** [PRODUCT_BACKLOG_PRIORITIZED.md § Sprint 1](./PRODUCT_BACKLOG_PRIORITIZED.md), [EVENT_TAXONOMY.md](./EVENT_TAXONOMY.md), [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md) §12.

---

## Pre-sprint (Day 1)

- [ ] Run audit using [SPRINT_1_EVENT_AUDIT_TEMPLATE.md](./SPRINT_1_EVENT_AUDIT_TEMPLATE.md)
- [ ] Prioritize **2–4** gaps by impact (prefer enroll → pay → completion, Safe-Truth; institutional if **thin**)
- [ ] Assign owner per gap (name / tool)

---

## Instrumentation (Days 2–7)

Implement `trackEvent` / server analytics helpers with **one naming convention** — update [EVENT_TAXONOMY.md](./EVENT_TAXONOMY.md) in the same PR.

- [ ] Gap #1: Journey: _______________ — PR: _______________
- [ ] Gap #2: Journey: _______________ — PR: _______________
- [ ] Gap #3: Journey: _______________ — PR: _______________
- [ ] Gap #4: Journey: _______________ — PR: _______________

---

## Verification (Days 8–9)

- [ ] Trigger each instrumented journey on **local or staging** (production only if policy allows)
- [ ] Confirm new rows appear in **`analyticsEvents`**
- [ ] Open **Admin → Reports**: `analyticsLastDays` counts move; spot-check **no duplicate eventType chaos**
- [ ] Confirm **`resusGpsAnalyticsLastDays`** still only counts `resus_*` (expected); mission/revenue events appear under **broader** product activity, not necessarily ResusGPS-only card
- [ ] Naming review: fix fragmented `eventType` / `eventName` pairs if they break grouping

---

## Documentation (Day 10)

- [ ] Finalize [EVENT_TAXONOMY.md](./EVENT_TAXONOMY.md) table
- [ ] Save audit result (completed template or `SPRINT_1_MEASUREMENT_TRUTH_AUDIT_RESULTS.md`)
- [ ] Update [WORK_STATUS.md](./WORK_STATUS.md) — Done row, clear In progress
- [ ] Optional: link sprint summary in [PRODUCT_BACKLOG_PRIORITIZED.md](./PRODUCT_BACKLOG_PRIORITIZED.md) changelog

---

## Regression prevention

- [ ] Add a **Vitest** or smoke note: “events router accepts new types” (if applicable)
- [ ] Document **do not rename** existing `eventType` without migration note in EVENT_TAXONOMY

---

## Stretch (only if checklist above is complete)

- [ ] **P1-RESUS-1** thin slice: end-of-session **summary export** (copy / one-pager) — connects bedside → learning without institutional dashboards

---

## Explicitly out of scope (this sprint)

- Staging environment → **Sprint 2** (CEO priority #2)
- ResusGPS v4 → after measurement baseline (**CEO priority #4**)
- Institutional dashboard v1 / triage workflow UI / consultancy features → **later**
