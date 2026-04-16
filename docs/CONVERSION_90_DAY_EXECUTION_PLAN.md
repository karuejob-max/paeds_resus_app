# Conversion 90-day execution plan (provider)

Purpose: convert qualified provider visitors into recurrent paying clients while preserving PSoT decisions.

Governance:
- Canonical policy and definitions remain in [PLATFORM_SOURCE_OF_TRUTH.md](./PLATFORM_SOURCE_OF_TRUTH.md).
- If this plan conflicts with PSoT, PSoT wins.
- Weekly progress belongs in [WORK_STATUS.md](./WORK_STATUS.md).

---

## 1) North-star and KPI tree

North-star:
- `active_paying_providers_30d`

Primary outcomes:
- Renewal rate (30/60/90-day cohorts)
- Second-purchase rate within 30 days

Provider funnel (minimum tracked sequence):
- Visitor
- Signup
- Provider role selected
- Enroll CTA click
- Payment initiated
- Payment completed
- First course started
- First course completed
- Second purchase

Guardrails:
- Payment failure rate
- Support tickets per 100 payment attempts
- Refund/dispute rate

---

## 2) 90-day phases

## Phase 1 (days 1-14): trust and measurement

Objectives:
- Remove payment dead-ends.
- Ensure full provider funnel instrumentation.

Deliverables:
- Single provider enrollment/payment behavior (no divergent variants).
- Pending M-Pesa recovery flow (resume, retry, clear status).
- Deterministic post-payment deep-link to exact course/module.
- Funnel dashboard with step-level conversion and drop-off.

Exit criteria:
- Payment-related support incidents down >= 30%.
- Funnel events complete and queryable end to end.

## Phase 2 (days 15-30): first conversion lift

Objectives:
- Raise first-payment conversion.

Deliverables:
- Provider home value proposition simplification.
- One-primary-CTA-by-state rule.
- Provider-only copy pass across provider routes.
- Payment trust UX block (timing, status, fallback path).

Exit criteria:
- Enroll click-through up >= 20%.
- Payment initiated per provider session up >= 15%.

## Phase 3 (days 31-45): lifecycle automation v1

Objectives:
- Recover abandonment and improve activation.

Deliverables:
- Triggered comms:
  - signup-no-pay (0h/24h/72h)
  - initiated-not-completed (5m/2h/24h)
  - paid-not-started (24h/72h)
  - started-not-completed (progress nudges)
- In-app resume nudges.
- Payment rescue support playbook.

Exit criteria:
- Initiated -> completed conversion up >= 20%.
- Paid -> first course start up >= 20%.

## Phase 4 (days 46-60): recurring monetization

Objectives:
- Convert one-off purchases into recurring revenue.

Deliverables:
- Membership/subscription packaging for providers.
- Renewal reminders and grace/win-back flows.
- Billing retry UX and renewal status visibility.

Exit criteria:
- First recurring subscriber cohort active.
- Renewal intent instrumentation >= 90% coverage.

## Phase 5 (days 61-75): retention loops

Objectives:
- Increase second purchase and habit formation.

Deliverables:
- Next-best-course recommendations.
- Completion-triggered upsell journeys.
- Monthly provider progress report (skills/cases/cert path).
- Milestone and streak mechanics tied to progression.

Exit criteria:
- Second purchase within 30 days up >= 25%.
- Active paying providers up >= 20%.

## Phase 6 (days 76-90): optimization and scale

Objectives:
- Systematize experimentation and scale winners.

Deliverables:
- 3-5 growth experiments/week with decision rubric.
- Acquisition optimization to payment completion, not clicks.
- Executive dashboard and weekly decision cadence.

Exit criteria:
- Positive recurring revenue trend.
- Month-over-month retention improvement.
- Top winning levers documented and productized.

---

## 3) First 10 experiments to launch

1. Home CTA: "Start first course" vs "Start fellowship path".
2. Preselected recommended first course vs full catalog.
3. Payment trust message variants.
4. Pending payment rescue modal emphasis variants.
5. Post-payment deep-link to module vs dashboard.
6. Abandoned payment SMS vs WhatsApp timing.
7. Intro offer vs no discount for first purchase.
8. Bundle offer after first completion.
9. Renewal reminder timing (7-day vs 3-day).
10. Win-back offer at 14 days inactive.

---

## 4) Ownership and cadence

Weekly operating loop:
- Monday: KPI review, choose experiments.
- Tuesday-Thursday: ship tests and lifecycle updates.
- Friday: evaluate, promote winners, kill losers.

Required owners:
- Product/Growth: funnel and experiment ownership.
- Engineering: reliability, instrumentation, journey consistency.
- Ops/Support: payment rescue and churn rescue.

---

## 5) Definition of done for this plan

- Provider journey has no known P0 payment trust blockers.
- KPI dashboard supports weekly decisions without manual spreadsheets.
- Recurring monetization is live and measured.
- Experiment pipeline is active every week.
