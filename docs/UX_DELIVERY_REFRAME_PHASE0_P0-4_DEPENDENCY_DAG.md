# P0-4 Week 1-4 Dependency DAG

**Task:** P0-4  
**Owner:** Cursor  
**Start:** 2026-04-14  
**Target complete:** 2026-04-15

---

## 1) Node definitions

- `W1-AUTH`: Login/auth latency and shell readiness
- `W1-DASH`: Provider dashboard FMC and data orchestration
- `W1-RESUS`: ResusGPS load reliability and fallback path
- `W2-GUARDS`: Role boundaries (UI/route/API enforcement)
- `W2-NAV`: Role-correct navigation and context switch hardening
- `W3-FLOW`: Provider conversion continuity (payment -> learning -> cert)
- `W3-PAY`: Payment state clarity and dead-end recovery
- `W4-PACK`: Product packaging/IA cleanup (Provider/Parent/Institution entry clarity)
- `W4-REL`: Release hardening, full smoke, and go-live confidence checks

---

## 2) Explicit blockers

- `W2-GUARDS` blocked by `W1-AUTH` and `W1-RESUS` stability baseline
- `W3-FLOW` blocked by `W2-GUARDS` pass
- `W3-PAY` blocked by `W1-AUTH` and `W1-DASH` (payment context depends on stable identity/state)
- `W4-REL` blocked by `W2-GUARDS`, `W3-FLOW`, and `W3-PAY`

---

## 3) Parallel tracks

- Track A (core performance): `W1-AUTH`, `W1-DASH`, `W1-RESUS` in parallel
- Track B (security/permission): `W2-GUARDS` and `W2-NAV` in parallel after W1 baseline
- Track C (journey continuity): `W3-FLOW` and `W3-PAY` in parallel after W2 guards pass

Owner map:

- Cursor: `W1-AUTH`, `W2-GUARDS`, `W3-PAY`, `W4-REL`
- Manus: `W1-DASH`, `W1-RESUS` (frontend orchestration), `W2-NAV`, `W4-PACK`
- Job: validation/sign-off on `W2-GUARDS` policy outcomes and `W4-REL` go/no-go

---

## 4) Critical path

`W1-AUTH` -> `W2-GUARDS` -> `W3-FLOW` -> `W4-REL`

Any slip on this path delays release readiness.

---

## 5) Contingency triggers

- If W1 profiling reveals DB refactor requirement:
  - split urgent hotfixes vs structural query improvements
  - move structural refactor to controlled sub-track without blocking role guards unless auth is directly affected
  - provisional schedule impact estimate: **+3 days** on critical path if auth-path query refactor is mandatory
- If W2 guards fail role-leak tests:
  - block all W3 merge-to-main actions until leak suite is green

---

## 5.1 Week sub-task granularity (minimum)

- `W1-AUTH`: session/auth endpoint timing, login shell rendering path, auth loading/error-state hardening
- `W1-DASH`: dashboard query fan-out reduction, FMC-first payload shaping, skeleton states
- `W1-RESUS`: route readiness checks, retry/fallback behavior, first-interaction readiness
- `W2-GUARDS`: route guards, backend authorization audits, role-leak closure
- `W2-NAV`: role-correct navigation, context-switch safety, hidden-link cleanup
- `W3-FLOW`: enrollment -> payment -> learning redirect determinism
- `W3-PAY`: payment-state clarity, pending/retry/recovery continuity
- `W4-PACK`: entry IA and lane packaging polish
- `W4-REL`: full smoke, rollback readiness, release decision

---

## 6) Exit criteria

- All dependencies and blockers documented
- Parallelizable tasks explicitly identified
- Critical path and contingencies agreed by Cursor/Manus/Job
