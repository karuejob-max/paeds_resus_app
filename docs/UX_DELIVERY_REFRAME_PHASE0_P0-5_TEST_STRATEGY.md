# P0-5 Test Strategy (Role Leaks + Performance Gates)

**Task:** P0-5  
**Owner:** Manus (primary), Cursor (backend authorization test support)  
**Start:** 2026-04-14  
**Target complete:** 2026-04-16

---

## 1) Test pillars

1. Role isolation tests (UI + route + API)
2. Performance gate telemetry and thresholds
3. Weekly smoke checklist for mission-critical journeys

---

## 2) Role E2E matrix (minimum)

Minimum required automated scenarios:

- Parent cannot see provider/instructor/admin nav items
- Parent denied on provider/instructor/admin routes
- Parent denied on provider/instructor/admin APIs
- Provider cannot access admin routes/APIs
- Institutional user cannot access provider-only learning/payment routes unless explicitly allowed
- Instructor route requires approved instructor status
- Admin has access where expected; non-admin denied regardless of guessed URLs
- Instructor cannot access unrelated institutional-admin surfaces without tenancy/assignment
- Institutional users denied on admin-only APIs/routes
- Cross-role: provider+instructor retains provider access while enforcing instructor-approval checks
- Cross-role: provider+admin can use provider routes while admin access remains backend-gated

Acceptance threshold: **100% pass for all critical role-leak tests**.

---

## 3) Performance telemetry events

Required events/metrics:

- `auth_login_shell_ready_ms`
- `provider_dashboard_fmc_ms`
- `resusgps_ready_ms`
- `resusgps_load_success` (boolean/rate)

Targets:

- Login shell ready < 2000 ms (p95 target bound)
- Dashboard FMC < 3000 ms (p95 target bound)
- ResusGPS readiness success >= 95%

Instrumentation source of truth:

- Client emits route/perceived-latency marks and submits through existing analytics pathway.
- Server emits API timing and outcome metrics for auth/dashboard/resus endpoints.
- All events flow through existing analytics pipeline (no ad-hoc side-channel).

---

## 4) Automation scope

- Automated:
  - Critical role leak suite
  - API auth guard tests
  - Core journey smoke (sign in, dashboard load, ResusGPS open, payment continuity)
- Manual:
  - Visual quality checks
  - Cross-device sanity checks where automation coverage is limited

---

## 5) Weekly smoke cadence

- Run smoke on every Week milestone completion (W1, W2, W3, W4)
- Run pre-release smoke immediately before W4 release decision

Required smoke checks:

- Sign-in for each role
- Provider dashboard next-action correctness
- ResusGPS load + interaction
- Enrollment -> payment -> learning continuity
- Parent lane integrity
- Institutional lane integrity

Pass/fail criteria:

- Login smoke pass: authenticated shell visible and usable in <= 2.0s target band (p95 gate).
- Dashboard smoke pass: FMC visible in <= 3.0s target band (p95 gate).
- ResusGPS smoke pass: interactive controls visible; success rate target maintained.
- Role smoke pass: zero critical role-leak failures (UI + route + API).
- Payment continuity smoke pass: no dead-end states in enrollment/payment/learning handoff.

---

## 6) Exit criteria

- Role leak matrix test set committed
- Perf telemetry and thresholds documented and wired for collection
- Weekly smoke checklist committed with clear pass/fail criteria
- Critical role-leak scenarios listed above are automated and passing
