# Execution Plan: Fellowship Qualification System

**Status:** Ready for implementation**Timeline:** 8-10 days (4 phases)**Owner:** Manus Agent (with clinical review for course alignment)**Blocking:** Cannot launch "Fellow" title until Phase 1 complete

---

## Overview

This plan closes all 6 critical gaps from the audit:

1. Micro-course catalog alignment (PSOT MECE)

1. Course prerequisite enforcement

1. Care Signal grace/catch-up/streak automation

1. Fellowship qualification system (pillars A/B/C)

1. Fellowship progress dashboard

1. Legal/consent flows

**Dependency chain:**

```
Phase 1 (Data) → Phase 2 (Automation) → Phase 3 (UI) → Phase 4 (Legal + Testing)
```

---

## Phase 1: Data & Schema (2 days)

### 1.1 Micro-Course Catalog Alignment

**Goal:** Realign 26 courses to PSOT 24-slot MECE structure.

**Decision Required:** What to do with 6 extra courses?

- **Option A:** Keep as "elective" (separate from fellowship requirement)

- **Option B:** Merge/split into PSOT slots

- **Option C:** Remove entirely

**Assumption:** Keep as elective (Option A) — they add value but don't block fellowship.

**Tasks:**

| Task | Details | Effort |
| --- | --- | --- |
| **1.1.1 Add missing 10 courses** | Create placeholders in `microCourses` table for: Croup, Upper Airway, Advanced Airway, Bronchiolitis, HFNC/CPAP, Anaphylaxis, Neurogenic Shock, Cardiogenic Shock (2), PE, Tamponade, Tet Spells, Systematic Approach, Cardiac Arrest | 4 hours |
| **1.1.2 Reclassify extra courses** | Mark toxicology, burns, infectious, extra metabolic as "elective" (add `isRequired` boolean to `microCourses`) | 1 hour |
| **1.1.3 Update ****`emergencyType`**** enum** | Add missing types if needed (e.g., "cardiac" for cardiogenic shock) | 30 min |
| **1.1.4 Set course order** | Assign `order` field 1-24 per PSOT backlog slot mapping | 1 hour |
| **1.1.5 Create course data files** | Write 10 new course data files (modules, quizzes) following existing pattern | 8 hours |
| **1.1.6 Update seed script** | Modify `courses.seedCourses` to include all 24 required + electives | 1 hour |

**Subtotal:** ~15 hours (2 days with parallelization)

**Checkpoint:** All 24 PSOT-required courses + electives in DB, seeded successfully.

---

### 1.2 Database Schema Extensions

**Goal:** Add columns and tables for prerequisite enforcement, grace tracking, and fellowship progress.

**Tasks:**

| Task | Details | Effort |
| --- | --- | --- |
| **1.2.1 Extend ****`microCourseEnrollments`** | Add columns: `courseId` (FK), `prerequisiteValidated` (boolean), `prerequisiteCourseId` (FK) | 30 min |
| **1.2.2 Extend ****`careSignalEvents`** | Add columns: `eatCalendarMonth` (YYYY-MM), `graceApplied` (boolean), `catchUpRequired` (boolean), `streakResetDate` (timestamp), `monthlyEventCount` (int) | 1 hour |
| **1.2.3 Create ****`fellowshipProgress`**** table** | Track pillar A/B/C status per user: `userId`, `pillarA_percentComplete`, `pillarB_percentComplete`, `pillarC_monthsCompleted`, `pillarC_streak`, `isFellow`, `lastUpdated` | 1 hour |
| **1.2.4 Create ****`fellowshipGraceUsage`**** table** | Track grace budget: `userId`, `calendarYear`, `graceUsedCount`, `graceRemaining`, `catchUpMonthRequired`, `catchUpEventsNeeded` | 30 min |
| **1.2.5 Create ****`fellowshipStreakResets`**** table** | Audit trail: `userId`, `resetDate`, `previousStreak`, `reason`, `monthsLost` | 30 min |
| **1.2.6 Create ****`careSignalMonthlyStatus`**** view** | SQL view: aggregate `careSignalEvents` by `eatCalendarMonth`, count events, flag grace/catch-up/reset | 1 hour |
| **1.2.7 Run ****`pnpm db:push`** | Push all migrations to database | 15 min |

**Subtotal:** ~5 hours (1 day)

**Checkpoint:** All schema changes migrated, views created, no orphaned data.

---

## Phase 2: Automation & Procedures (3 days)

### 2.1 Course Prerequisite Enforcement

**Goal:** Block Course II enrollment if Course I not passed.

**Tasks:**

| Task | Details | Effort |
| --- | --- | --- |
| **2.1.1 Create ****`courses.checkPrerequisite`**** query** | Input: `userId`, `courseId`. Output: `isEligible` (boolean), `prerequisiteCourseId`, `prerequisiteStatus` (not_started, in_progress, passed, failed) | 1 hour |
| **2.1.2 Update ****`courses.enrollWithMpesa`** | Call `checkPrerequisite` before allowing enrollment. If not eligible, return error with clear message. | 1 hour |
| **2.1.3 Add prerequisite validation to schema** | Ensure `microCourses.prerequisiteId` is set correctly for all tier II courses | 30 min |
| **2.1.4 Write integration test** | Test: enroll Course I → fail quiz → cannot enroll Course II. Then: pass quiz → can enroll Course II. | 1 hour |

**Subtotal:** ~3.5 hours

**Checkpoint:** Prerequisite enforcement working, tests passing.

---

### 2.2 Care Signal Grace/Catch-Up/Streak Logic

**Goal:** Implement automated monthly validation with grace, catch-up, and streak reset.

**Tasks:**

| Task | Details | Effort |
| --- | --- | --- |
| **2.2.1 Create ****`careSignalEvents.validateMonthlyCompletion`** | Input: `userId`, `eatCalendarMonth`. Output: `status` (complete, grace_applied, catch_up_required, missed), `eventCount`, `graceRemaining`. Logic: ≥1 event = complete; 0 events + grace available = grace_applied; 0 events + no grace = missed. | 2 hours |
| **2.2.2 Create ****`careSignalEvents.processCatchUp`** | Input: `userId`, `previousGraceMonth`, `currentMonth`. Validate: current month has ≥3 events. If yes: grace "closed," streak continues. If no: streak resets to 0. | 2 hours |
| **2.2.3 Create ****`careSignalEvents.checkStreakReset`** | Input: `userId`, `month`. Logic: if 3rd consecutive missed month (without grace or failed catch-up), reset streak to 0, create audit entry in `fellowshipStreakResets`. | 1.5 hours |
| **2.2.4 Create ****`careSignalEvents.getMonthlyStatus`** | Input: `userId`, `year`. Output: array of months with status, event counts, grace applied, catch-up required. | 1 hour |
| **2.2.5 Create ****`careSignalEvents.getCareSIgnalPillarStatus`** | Input: `userId`. Output: `monthsCompleted`, `monthsRequired` (24), `currentStreak`, `graceUsedThisYear`, `graceRemaining`, `nextCatchUpRequired`, `status` (complete, in_progress, not_started). | 1.5 hours |
| **2.2.6 Write comprehensive tests** | Test: normal month (1 event) → complete. Grace month (0 events) → grace applied. Catch-up month (≥3 events) → grace closed. Catch-up fail (1 event) → streak reset. | 3 hours |

**Subtotal:** ~11 hours (1.5 days)

**Checkpoint:** All grace/catch-up/streak logic working, edge cases tested.

---

### 2.3 Fellowship Qualification System

**Goal:** Create unified system to validate all 3 pillars and determine fellow status.

**Tasks:**

| Task | Details | Effort |
| --- | --- | --- |
| **2.3.1 Create ****`fellowshipQualification`**** router** | New router with all procedures below | 30 min |
| **2.3.2 Implement ****`getCoursePillarStatus`** | Input: `userId`. Query: all required courses (24 PSOT), check completion status. Output: `requiredCourses`, `completedCourses`, `percentComplete`, `missingCourses`, `status`. | 1.5 hours |
| **2.3.3 Implement ****`getResusGPSPillarStatus`** | Input: `userId`. Query: all conditions, count valid sessions per condition (≥3 required). Output: `conditions` array with session counts, `percentComplete`, `status`. | 2 hours |
| **2.3.4 Implement ****`getCareSIgnalPillarStatus`** | Reuse from 2.2.5 — call `careSignalEvents.getCareSIgnalPillarStatus`. | 30 min |
| **2.3.5 Implement ****`getFullProgress`** | Input: `userId`. Aggregate all 3 pillars. Output: `pillars` (A/B/C status), `overallStatus`, `isFellow` (all 3 pillars complete), `nextMilestone`, `estimatedCompletionDate`. | 1.5 hours |
| **2.3.6 Implement ****`isFellow`** | Input: `userId`. Output: boolean. Simple: `getFullProgress.isFellow`. | 30 min |
| **2.3.7 Implement ****`updateFellowshipProgress`** | Background job (or trigger on course/Care Signal completion): update `fellowshipProgress` table with latest pillar status. | 1.5 hours |
| **2.3.8 Write integration tests** | Test full journey: complete courses → ResusGPS sessions → Care Signal months → Fellow status. Test edge cases (grace, reset, missing pillar). | 3 hours |

**Subtotal:** ~11 hours (1.5 days)

**Checkpoint:** All 3 pillars validated, fellow determination working, integration tests passing.

---

## Phase 3: UI & Dashboard (2 days)

### 3.1 Fellowship Progress Dashboard

**Goal:** Build single aggregated view of all 3 pillars + grace/streak messaging.

**Tasks:**

| Task | Details | Effort |
| --- | --- | --- |
| **3.1.1 Create ****`/fellowship/progress`**** page** | New route in App.tsx, protected (user must be logged in). | 30 min |
| **3.1.2 Build ****`FellowshipProgressDashboard.tsx`** | Main component: call `fellowshipQualification.getFullProgress`, render all 3 pillars, overall status, Fellow badge if applicable. | 2 hours |
| **3.1.3 Build ****`CoursePillarStatus.tsx`** | Pillar A: show required courses, completed, missing. Progress bar. Link to course catalog. | 1.5 hours |
| **3.1.4 Build ****`ResusGPSConditionChecklist.tsx`** | Pillar B: show all conditions, session counts, % complete. Highlight missing. Link to ResusGPS. | 1.5 hours |
| **3.1.5 Build ****`CareSIgnalMonthlyStatus.tsx`** | Pillar C: show monthly grid (Jan-Dec), status per month (complete, grace, catch-up, missed). Show current streak, grace remaining, catch-up required. | 2 hours |
| **3.1.6 Build ****`FellowshipBadge.tsx`** | Small component: "Fellow" badge with icon. Show in header/profile when `isFellow` is true. | 1 hour |
| **3.1.7 Build ****`StreakResetAlert.tsx`** | Alert component: show when streak resets (3rd missed month). Message: "Your Care Signal streak has reset. You need 24 consecutive months to qualify for Fellow status." | 1 hour |
| **3.1.8 Add to learner dashboard** | Link to `/fellowship/progress` from main dashboard. Show progress card summary. | 1 hour |

**Subtotal:** ~10 hours (1.5 days)

**Checkpoint:** Dashboard complete, all components rendering, data flowing correctly.

---

### 3.2 UI Refinement & Messaging

**Goal:** Ensure UX is clear, fair, and non-punitive.

**Tasks:**

| Task | Details | Effort |
| --- | --- | --- |
| **3.2.1 Write grace/catch-up/reset messaging** | Copy per PSOT: "Discipline in logging is leadership behaviour training." Show: grace remaining, catch-up required (3 events), reset consequences. | 1 hour |
| **3.2.2 Add tooltips** | Explain each pillar, grace rules, catch-up rule, streak reset. | 1 hour |
| **3.2.3 Test responsive design** | Mobile, tablet, desktop. Ensure Care Signal monthly grid is readable. | 1 hour |
| **3.2.4 Accessibility review** | Color contrast, keyboard navigation, screen reader support. | 1 hour |

**Subtotal:** ~4 hours

**Checkpoint:** UI polished, messaging clear, accessible.

---

## Phase 4: Legal, Testing & Launch (2 days)

### 4.1 Legal & Compliance

**Goal:** Update ToS/privacy policy, document appeals process.

**Tasks:**

| Task | Details | Effort |
| --- | --- | --- |
| **4.1.1 Update privacy policy** | Add: Care Signal data collection, grace/streak rules, data retention, user rights. | 2 hours |
| **4.1.2 Update ToS** | Add: fellowship criteria, grace budget, streak reset, no manual overrides, appeals process. | 2 hours |
| **4.1.3 Document appeals process** | For system errors only (e.g., data bug, event not counted). No subjective appeals. | 1 hour |
| **4.1.4 Get legal review** | Submit to counsel for approval (assume 24-48 hour turnaround). | 0 hours (external) |

**Subtotal:** ~5 hours (1 day, plus external review)

**Checkpoint:** Legal docs approved, ready for launch.

---

### 4.2 Testing & Validation

**Goal:** Comprehensive testing before launch.

**Tasks:**

| Task | Details | Effort |
| --- | --- | --- |
| **4.2.1 Unit tests** | All new procedures: `checkPrerequisite`, `validateMonthlyCompletion`, `processCatchUp`, `checkStreakReset`, `getFullProgress`, etc. Target: 90%+ coverage. | 3 hours |
| **4.2.2 Integration tests** | Full journey: enroll courses → complete → ResusGPS sessions → Care Signal reporting → Fellow status. Test all edge cases. | 3 hours |
| **4.2.3 E2E tests** | Simulate real user: login → enroll course → fail → retry → pass → enroll Course II → ResusGPS sessions → Care Signal submission → check progress dashboard. | 2 hours |
| **4.2.4 Grace/streak edge cases** | Test: grace month → catch-up success → grace month → catch-up fail → reset. Test annual grace budget. | 2 hours |
| **4.2.5 Performance test** | Load test: 100+ concurrent users checking fellowship progress. Target: <500ms response time. | 1 hour |
| **4.2.6 Security audit** | Ensure: no PII in public APIs, no privilege escalation, audit trail immutable. | 1 hour |

**Subtotal:** ~12 hours (1.5 days)

**Checkpoint:** All tests passing, performance acceptable, security approved.

---

### 4.3 Launch Readiness

**Goal:** Final checklist before going live.

**Tasks:**

| Task | Details | Effort |
| --- | --- | --- |
| **4.3.1 Data migration** | Backfill `fellowshipProgress` table for existing users. Validate no data loss. | 1 hour |
| **4.3.2 Seed production data** | Run `courses.seedCourses` on production DB. Verify all 24 required + electives present. | 30 min |
| **4.3.3 Smoke test** | Test critical flows on production (or staging): enroll, complete, check progress. | 30 min |
| **4.3.4 Documentation** | Update README, deployment guide, API docs. | 1 hour |
| **4.3.5 Announce to users** | Email: "Fellowship qualification system now live. Check your progress at /fellowship/progress." | 30 min |

**Subtotal:** ~3.5 hours

**Checkpoint:** Ready for launch.

---

## Timeline & Milestones

| Phase | Duration | Milestone | Checkpoint |
| --- | --- | --- | --- |
| **Phase 1: Data** | 2 days | All schema changes, 24 courses in DB | Seeded, no orphans |
| **Phase 2: Automation** | 3 days | All procedures working, tests passing | Pillars A/B/C validated |
| **Phase 3: UI** | 2 days | Dashboard complete, messaging clear | All components rendering |
| **Phase 4: Legal + Testing** | 2 days | Legal approved, all tests passing | Production ready |
| **TOTAL** | **~9 days** | **Fellowship qualification system live** | **Fellow badge visible** |

---

## Dependencies & Risks

### Dependencies

```
Phase 1 (Data) 
  ↓
Phase 2 (Automation) 
  ↓
Phase 3 (UI) — can start after Phase 2.1 (prerequisite)
  ↓
Phase 4 (Legal + Testing) — can run in parallel with Phase 3
```

### Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
| --- | --- | --- | --- |
| **Course data quality** | Medium | Wrong content blocks fellow qualification | Clinical review of all 24 courses before seeding |
| **Grace/streak logic bugs** | High | Users incorrectly reset or blocked | Comprehensive edge case testing, audit trail |
| **Performance degradation** | Medium | Dashboard slow with 1000+ users | Load test early, optimize queries |
| **Legal delays** | Low | Launch blocked | Start legal review in parallel with Phase 2 |
| **Data migration issues** | Low | Existing user data corrupted | Backup DB before migration, validate counts |

---

## Success Criteria

| Criterion | Target | Validation |
| --- | --- | --- |
| **All 24 PSOT courses** | In DB, seeded | `SELECT COUNT(*) FROM microCourses WHERE isRequired=true` = 24 |
| **Prerequisite enforcement** | 100% of tier II courses | Test: cannot enroll Course II without Course I pass |
| **Grace/catch-up/streak** | All rules working | Edge case tests passing |
| **Fellowship qualification** | Accurate pillar validation | Integration test: full journey → Fellow status |
| **Dashboard** | Responsive, accessible | E2E test on mobile/desktop, a11y audit |
| **Legal approval** | ToS/privacy updated | Counsel sign-off |
| **Test coverage** | ≥90% | `pnpm test` coverage report |
| **Performance** | <500ms response time | Load test with 100+ concurrent users |

---

## Execution Checklist

### Phase 1: Data & Schema

- [ ] Decide: keep extra courses as "elective" or remove

- [ ] Create 10 new course data files

- [ ] Update `microCourses` schema

- [ ] Add `isRequired` flag

- [ ] Run `pnpm db:push`

- [ ] Verify all 24 required + electives in DB

- [ ] Update `courses.seedCourses` mutation

- [ ] **Checkpoint:** Phase 1 complete

### Phase 2: Automation

- [ ] Implement prerequisite enforcement

- [ ] Implement Care Signal grace/catch-up/streak

- [ ] Create `fellowshipQualification` router

- [ ] Write all integration tests

- [ ] All tests passing

- [ ] **Checkpoint:** Phase 2 complete

### Phase 3: UI

- [ ] Build fellowship progress dashboard

- [ ] Build all 4 pillar components

- [ ] Add to learner dashboard

- [ ] Responsive design + accessibility

- [ ] **Checkpoint:** Phase 3 complete

### Phase 4: Legal + Testing

- [ ] Update privacy policy + ToS

- [ ] Document appeals process

- [ ] Legal review approved

- [ ] All unit/integration/E2E tests passing

- [ ] Performance test passing

- [ ] Security audit approved

- [ ] Data migration validated

- [ ] Smoke test on production

- [ ] **Checkpoint:** Ready for launch

---

## Next Steps

1. **Confirm decision:** Keep extra courses as "elective" or remove?

1. **Assign clinical review:** Who reviews the 10 new courses for accuracy?

1. **Start Phase 1:** Begin data schema work immediately.

1. **Parallel Phase 4:** Start legal review while Phase 2 is in progress.

---

## Appendix: Detailed Procedure Specs

### Procedure: `courses.checkPrerequisite`

```typescript
input: {
  userId: number,
  courseId: string
}

output: {
  isEligible: boolean,
  prerequisiteCourseId?: string,
  prerequisiteStatus: 'not_started' | 'in_progress' | 'passed' | 'failed',
  message: string
}

logic:
1. Get course from DB by courseId
2. If no prerequisiteId → isEligible = true
3. If prerequisiteId exists:
   a. Get user's enrollment for prerequisite course
   b. If no enrollment → status = 'not_started', isEligible = false
   c. If enrollment exists:
      - If quizScore >= 80 → status = 'passed', isEligible = true
      - If quizScore < 80 → status = 'failed', isEligible = false
      - If no quizScore yet → status = 'in_progress', isEligible = false
4. Return result with clear message
```

### Procedure: `careSignalEvents.validateMonthlyCompletion`

```typescript
input: {
  userId: number,
  eatCalendarMonth: string // 'YYYY-MM'
}

output: {
  status: 'complete' | 'grace_applied' | 'catch_up_required' | 'missed',
  eventCount: number,
  graceRemaining: number,
  message: string
}

logic:
1. Query careSignalEvents for userId in eatCalendarMonth
2. Count events where status = 'submitted'
3. If eventCount >= 1 → status = 'complete'
4. If eventCount = 0:
   a. Check graceUsage for userId, calendarYear
   b. If graceRemaining > 0 → status = 'grace_applied', decrement graceRemaining
   c. If graceRemaining = 0 → check if previous month was grace
      - If yes → status = 'catch_up_required'
      - If no → status = 'missed'
5. Return result
```

### Procedure: `fellowshipQualification.getFullProgress`

```typescript
input: {
  userId: number
}

output: {
  pillars: {
    A: {
      percentComplete: number,
      completedCourses: number,
      requiredCourses: number,
      missingCourses: string[],
      status: 'complete' | 'in_progress' | 'not_started'
    },
    B: {
      percentComplete: number,
      conditionsComplete: number,
      conditionsRequired: number,
      missingConditions: string[],
      status: 'complete' | 'in_progress' | 'not_started'
    },
    C: {
      monthsCompleted: number,
      monthsRequired: 24,
      currentStreak: number,
      graceUsedThisYear: number,
      graceRemaining: number,
      nextCatchUpRequired: boolean,
      status: 'complete' | 'in_progress' | 'not_started'
    }
  },
  overallStatus: 'complete' | 'in_progress' | 'not_started',
  isFellow: boolean, // all 3 pillars complete
  nextMilestone: string,
  estimatedCompletionDate: Date | null,
  lastUpdated: timestamp
}

logic:
1. Call getCoursePillarStatus(userId) → pillar A
2. Call getResusGPSPillarStatus(userId) → pillar B
3. Call getCareSIgnalPillarStatus(userId) → pillar C
4. Aggregate:
   - isFellow = (A.status === 'complete' && B.status === 'complete' && C.status === 'complete')
   - overallStatus = max(A.status, B.status, C.status) by completion
   - nextMilestone = determine which pillar is closest to completion
   - estimatedCompletionDate = calculate based on current pace
5. Update fellowshipProgress table with result
6. Return aggregated result
```

---

**End of Execution Plan**

