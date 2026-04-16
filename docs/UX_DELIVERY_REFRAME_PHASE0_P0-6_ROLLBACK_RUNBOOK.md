# P0-6 Rollback Runbook (Auth/Routing Critical Changes)

**Task:** P0-6  
**Owner:** Cursor  
**Start:** 2026-04-14  
**Target complete:** 2026-04-15

---

## 1) Scope

Applies to high-risk changes in:

- Auth/login/session routing
- Role guards
- Provider landing and primary navigation
- ResusGPS entry path reliability controls

---

## 2) Canary sequence

Until formal staged environment is fully reliable, use conservative rollout:

1. Deploy small isolated change (scope target: one route or one API procedure; preferably <= 1 file touched for canary slice)
2. Run immediate smoke checks (auth + dashboard + ResusGPS + role access sanity)
3. Monitor critical metrics for **30 minutes**
4. Proceed with next slice only if gates pass

---

## 3) Revert triggers

Trigger immediate rollback if any occurs:

- Login error rate > 5% during canary window
- Dashboard shell not rendering for authenticated providers in smoke checks
- ResusGPS route success < 95% during canary window
- New cross-role access leak detected

---

## 4) Recovery checklist

1. Revert offending commit(s)
2. Redeploy
3. Re-run critical smoke checks:
   - Provider login
   - Provider dashboard FMC
   - ResusGPS open and interact
   - Parent/institution role isolation checks
4. Confirm metrics return to baseline
5. Document incident and root cause in `WORK_STATUS.md` critique/review or done note

---

## 5) Communication protocol

- Record rollback decision and reason in `WORK_STATUS.md`
- Mark blocked tasks in execution plan until post-rollback verification is complete

---

## 6) Exit criteria

- Revert triggers explicitly documented
- Recovery checklist executable by any team member
- Rollback proof run performed once before Week 1 completion

Rollback proof definition:

- Simulate canary regression
- Revert commit and redeploy
- Run critical smoke checklist
- Confirm all critical checks pass and metrics return to baseline
