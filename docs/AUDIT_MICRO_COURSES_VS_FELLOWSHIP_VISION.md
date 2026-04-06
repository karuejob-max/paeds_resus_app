# Audit: Micro-Courses & Fellowship Qualification — Vision vs Reality

**Date:** 2026-04-06  
**Scope:** Compare PSOT §15-17 vision with current implementation  
**Status:** CRITICAL GAPS IDENTIFIED

---

## Executive Summary

The system has **foundational pieces** but is **missing critical automation** for the fellowship qualification model to work. Currently:

- ✅ **26 micro-courses** created (covers ~12 of 24 MECE slots from catalog backlog)
- ✅ **Care Signal** router exists (pillar C: monthly reporting)
- ✅ **Fellowship Pathways** router exists (pillar B: ResusGPS condition mapping)
- ✅ **Provider Intelligence** router exists (tracks ResusGPS mastery by condition)
- ❌ **NO** unified fellowship qualification dashboard
- ❌ **NO** automated grace/catch-up/streak reset logic
- ❌ **NO** course completion tracking linked to fellowship pillars
- ❌ **NO** "distance to Fellow" progress UI
- ❌ **NO** launch readiness checklist validation

---

## 1. Micro-Course Catalog Coverage vs PSOT §16.3-16.4

### PSOT Vision (24-slot MECE backlog)

Per [MICRO_COURSE_CATALOG_BACKLOG.md](./MICRO_COURSE_CATALOG_BACKLOG.md), the fellowship requires **all 24 courses**:

| Domain | Slots | PSOT Requirement |
|--------|-------|------------------|
| **Cross-cutting** | 2 | Systematic approach + Cardiac arrest |
| **A · Airway** | 4 | Upper airway, asthma, advanced airway, croup |
| **B · Respiratory** | 3 | Bronchiolitis, pneumonia, non-invasive support |
| **C · Circulatory** | 10 | Hypovolemic (2), septic, anaphylactic, neurogenic, cardiogenic (2), Tet spells, PE, tamponade |
| **D · Neurological** | 2 | Status epilepticus, altered consciousness |
| **E · Metabolic** | 2 | Hypoglycemia, DKA |
| **F · Trauma** | 2 | Primary survey, TBI + hemorrhage |
| **TOTAL** | **24** | All required for fellowship |

### Current Reality (26 courses created)

We created **26 courses** but they **do NOT align** with PSOT catalog:

| Domain | PSOT Slots | Courses Created | Match | Gap |
|--------|-----------|-----------------|-------|-----|
| **Cross-cutting** | 2 | 0 | ❌ | Missing: "Systematic approach," "Cardiac arrest" |
| **A · Airway** | 4 | 2 | ❌ | Have: Asthma I-II. Missing: Croup, upper airway, advanced airway |
| **B · Respiratory** | 3 | 2 | ❌ | Have: Pneumonia I-II. Missing: Bronchiolitis, non-invasive support |
| **C · Circulatory** | 10 | 6 | ❌ | Have: Septic shock I-II, hypovolemic shock I-II, trauma I-II. Missing: Anaphylaxis, neurogenic, cardiogenic, PE, tamponade, Tet spells |
| **D · Neurological** | 2 | 2 | ✅ | Have: Status epilepticus I-II, febrile seizure I |
| **E · Metabolic** | 2 | 6 | ⚠️ | Have: DKA I-II, hypoglycemia, electrolyte, AKI, anaemia (extras, not in PSOT) |
| **F · Trauma** | 2 | 2 | ✅ | Have: Trauma I-II |
| **Toxicology** | 0 (not in PSOT) | 3 | ⚠️ | Have: Poisoning, overdose, caustic ingestion (not in PSOT catalog) |
| **Burns** | 0 (not in PSOT) | 2 | ⚠️ | Have: Burns I-II (not in PSOT catalog) |
| **Infectious** | 0 (not in PSOT) | 2 | ⚠️ | Have: Meningitis, malaria (not in PSOT catalog) |
| **TOTAL** | 24 | 26 | ⚠️ | **Misaligned with PSOT MECE structure** |

**Gap Analysis:**
- ❌ **Missing 10+ PSOT-mandated courses** (croup, upper airway, advanced airway, bronchiolitis, HFNC/CPAP, anaphylaxis, neurogenic, cardiogenic, PE, tamponade, Tet spells, systematic approach, cardiac arrest)
- ⚠️ **6 extra courses** (toxicology, burns, infectious, metabolic) not in PSOT MECE backlog
- ⚠️ **No prerequisite gating** between I and II courses (should require I pass before II enrollment)

---

## 2. Fellowship Qualification Pillars — Implementation Status

Per [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md) §4, fellowship requires:

### Pillar A: Courses (BLS + ACLS + PALS + All ADF Micro-Courses)

**PSOT Vision:**
- Complete **BLS, ACLS, PALS** (legacy credentials)
- Complete **every ADF micro-course** in the active MECE catalog
- Single source of truth: `certificates` / `enrollments` / completion flags per course row

**Current Reality:**
- ✅ `microCourseEnrollments` table exists with `enrollmentStatus` and `quizScore`
- ✅ `courses.seedCourses` mutation can populate all 26 courses
- ✅ `courses.completeCourse` mutation marks enrollment as completed (80%+ quiz score)
- ❌ **NO** link between micro-course completion and fellowship pillar A tracking
- ❌ **NO** query to check "user completed all required courses"
- ❌ **NO** prerequisite enforcement (Course II requires Course I pass)
- ❌ **NO** BLS/ACLS/PALS integration with micro-courses for pillar A

**Missing Implementation:**
```typescript
// Need: Get user's course completion status for fellowship
fellowshipQualification.getCoursePillarStatus(userId) → {
  requiredCourses: [...],
  completedCourses: [...],
  percentComplete: number,
  missingCourses: [...],
  status: 'not_started' | 'in_progress' | 'complete'
}
```

---

### Pillar B: ResusGPS (≥3 attributable cases per condition)

**PSOT Vision:**
- For **each taught condition** in portfolio, **≥3 attributable cases** where learner **used ResusGPS**
- Pathway/session IDs, user ID, **minimum depth** thresholds (anti-gaming)
- Map **condition ↔ pathway** in config

**Current Reality:**
- ✅ `fellowshipPathwaysRouter` exists with condition ↔ pathway mapping
- ✅ `providerIntelligenceRouter.getProgress` tracks ResusGPS sessions by condition
- ✅ `PATHWAY_DEPTH_THRESHOLDS` defined in `pathway-condition-mapping.ts`
- ✅ `resusSessionRecords` table captures sessions with `attributedConditions`
- ❌ **NO** query to validate "user has ≥3 valid sessions per condition"
- ❌ **NO** anti-gaming enforcement (depth threshold validation on session)
- ❌ **NO** link between micro-course completion and condition eligibility

**Missing Implementation:**
```typescript
// Need: Validate pillar B completion
fellowshipQualification.getResusGPSPillarStatus(userId) → {
  conditions: [{
    condition: 'septic_shock',
    sessionsCompleted: 3,
    sessionsRequired: 3,
    averageDepth: 85,
    lastPracticed: '2026-04-05',
    status: 'complete' | 'in_progress' | 'not_started'
  }],
  percentComplete: number,
  status: 'complete' | 'in_progress' | 'not_started'
}
```

---

### Pillar C: Care Signal (24 consecutive qualifying months)

**PSOT Vision:**
- **24 consecutive qualifying months** of monthly reporting
- ≥1 eligible Care Signal submission **created** per month (EAT calendar)
- **Grace budget:** 2 per calendar year
- **Catch-up rule:** After grace month, next month must have ≥3 events
- **Streak reset:** 3rd missed month (without grace) resets to zero

**Current Reality:**
- ✅ `careSignalEventsRouter.logEvent` exists
- ✅ `careSignalEvents` table captures submissions with `eventDate`, `status`
- ✅ Validation for `chainOfSurvival`, `systemGaps`, `outcome`
- ❌ **NO** monthly bucketing logic (EAT calendar months)
- ❌ **NO** grace tracking (budget, usage, reset)
- ❌ **NO** catch-up validation (≥3 events after grace month)
- ❌ **NO** streak reset logic
- ❌ **NO** query to check "user has 24 consecutive qualifying months"

**Missing Implementation:**
```typescript
// Need: Validate pillar C completion with grace/catch-up/streak
fellowshipQualification.getCareSIgnalPillarStatus(userId) → {
  monthsCompleted: 12,
  monthsRequired: 24,
  currentStreak: 12,
  graceUsedThisYear: 1,
  graceRemaining: 1,
  nextCatchUpRequired: false,
  catchUpEventsNeeded: 0,
  monthlyStatus: [{
    month: '2026-01',
    eventsSubmitted: 2,
    status: 'complete' | 'grace' | 'catch_up_required' | 'missed'
  }],
  status: 'complete' | 'in_progress' | 'not_started'
}
```

---

## 3. Fellowship Progress Dashboard — Missing

**PSOT Vision (§6):**
- One surfaced progress model (dashboard / hub) that **aggregates**:
  - Course completion (% of required catalog)
  - ResusGPS condition checklist (% conditions meeting ≥3 cases)
  - Care Signal **current streak** / **months completed** toward 24, and **grace** state
- **Copy:** Discipline in logging is leadership behaviour training — aligned with safe fluid and escalation decisions

**Current Reality:**
- ✅ `FellowshipProgressCard.tsx` component exists
- ❌ **NO** unified dashboard page (e.g., `/dashboard/fellowship` or `/fellowship/progress`)
- ❌ **NO** aggregated query combining all 3 pillars
- ❌ **NO** grace/streak messaging
- ❌ **NO** missing course list
- ❌ **NO** condition checklist with case counts

**Missing Implementation:**
```typescript
// Need: Single aggregated fellowship progress query
fellowshipQualification.getFullProgress(userId) → {
  pillars: {
    A: { percentComplete, missingCourses, status },
    B: { percentComplete, missingConditions, status },
    C: { monthsCompleted, streak, grace, status }
  },
  overallStatus: 'not_started' | 'in_progress' | 'complete',
  isFellow: boolean,
  nextMilestone: string,
  estimatedCompletionDate: Date | null
}
```

---

## 4. Launch Readiness Checklist (§11) — NOT MET

Per [FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md](./FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md) §11, **do not launch Fellow title until all rows pass**:

### 11.1 Data & Automation

- [ ] ❌ **Care Signal** product live: create/list with **server validation**, **EAT month** bucketing, **immutable** timestamps
  - **Status:** Care Signal router exists but **NO EAT month bucketing** or grace/streak logic
  
- [ ] ❌ **No** dependency on manual admin toggles for Fellow
  - **Status:** No fellowship qualification system exists yet
  
- [ ] ❌ **ResusGPS** → user → pathway → **condition map**; **≥3** sessions per condition with **depth** rules
  - **Status:** Mapping exists, but **NO validation query** for "user has ≥3 valid sessions per condition"
  
- [ ] ❌ **Course completion** pipeline complete for **all** catalog courses in scope
  - **Status:** 26 courses created but **NOT aligned with PSOT MECE** (missing 10+, have 6 extras)
  
- [ ] ❌ **Grace / catch-up / annual grace count / streak reset** implemented and **integration-tested**
  - **Status:** **COMPLETELY MISSING**

### 11.2 UX & Fairness

- [ ] ❌ **Single dashboard**: distance to Fellow (A/B/C pillars)
  - **Status:** **MISSING**
  
- [ ] ❌ **Clear** messaging: grace **remaining**, catch-up **3 in next month**, **reset** when triggered
  - **Status:** **MISSING**
  
- [ ] ❌ **Staff** flows **never** titled Safe-Truth; parent Safe-Truth **unchanged**
  - **Status:** Care Signal router correctly separates staff from parent, but **NO UI implementation**

### 11.3 Legal & Policy

- [ ] ❌ Privacy policy + ToS + **consent** flows reviewed (counsel)
  - **Status:** **MISSING**
  
- [ ] ❌ **Appeals** path for **system errors** only
  - **Status:** **MISSING**

### 11.4 Accredited Facilities (if launching list)

- [ ] ❌ **Accreditation criteria** documented; **not** a ranking; **disclaimers**; **governance** approval
  - **Status:** **ASPIRATIONAL** per PSOT; not blocking v1

---

## 5. Database Schema Gaps

### Missing Tables/Columns

| Table | Missing | Impact |
|-------|---------|--------|
| `microCourseEnrollments` | `courseId` (FK to microCourses) | Can't query "user completed course X" |
| `microCourseEnrollments` | `prerequisiteValidated` | Can't enforce "Course II requires Course I pass" |
| `careSignalEvents` | `eatCalendarMonth` (YYYY-MM) | Can't bucket by EAT month for grace logic |
| `careSignalEvents` | `graceApplied` (boolean) | Can't track grace usage |
| `careSignalEvents` | `catchUpRequired` (boolean) | Can't enforce catch-up rule |
| `careSignalEvents` | `streakResetDate` (timestamp) | Can't track when streak reset |
| **NEW TABLE** | `fellowshipProgress` | Track pillar A/B/C status per user |
| **NEW TABLE** | `fellowshipGraceUsage` | Track grace budget per user per year |
| **NEW TABLE** | `fellowshipStreakResets` | Audit trail of streak resets |

---

## 6. Router/Procedure Gaps

### Missing tRPC Procedures

| Router | Procedure | Purpose |
|--------|-----------|---------|
| `fellowshipQualification` | `getCoursePillarStatus` | Check pillar A completion |
| `fellowshipQualification` | `getResusGPSPillarStatus` | Check pillar B completion |
| `fellowshipQualification` | `getCareSIgnalPillarStatus` | Check pillar C with grace/streak |
| `fellowshipQualification` | `getFullProgress` | Aggregate all 3 pillars |
| `fellowshipQualification` | `isFellow` | Boolean: user is a fellow? |
| `careSignalEvents` | `validateMonthlyCompletion` | Check if month has ≥1 event (or grace applied) |
| `careSignalEvents` | `processCatchUp` | Validate catch-up month has ≥3 events |
| `careSignalEvents` | `checkStreakReset` | Detect if 3rd missed month triggers reset |
| `courses` | `enforcePrerequisite` | Block Course II enrollment if Course I not passed |
| `courses` | `getCourseCompletionStatus` | Get user's completion for all required courses |

---

## 7. UI/Component Gaps

### Missing Pages/Components

| Component | Purpose | Status |
|-----------|---------|--------|
| `/fellowship/progress` | Main dashboard: pillars A/B/C, grace, streak, missing courses | ❌ MISSING |
| `FellowshipProgressDashboard.tsx` | Aggregated view with all 3 pillars | ❌ MISSING |
| `CareSIgnalMonthlyStatus.tsx` | Show monthly events, grace applied, catch-up required | ❌ MISSING |
| `CoursePillarStatus.tsx` | Show required courses, completed, missing | ❌ MISSING |
| `ResusGPSConditionChecklist.tsx` | Show conditions, case counts, % complete | ❌ MISSING |
| `FellowshipBadge.tsx` | Display "Fellow" status in header/profile | ❌ MISSING |
| `StreakResetAlert.tsx` | Show when streak resets (3rd missed month) | ❌ MISSING |

---

## 8. Recommended Execution Order (Priority)

### Phase 1: Data & Automation Foundation (2-3 days)

1. **Align micro-course catalog with PSOT MECE** (§1 gap)
   - [ ] Add missing 10+ courses (croup, upper airway, anaphylaxis, neurogenic, cardiogenic, PE, tamponade, Tet spells, systematic approach, cardiac arrest)
   - [ ] Remove or reclassify extra courses (toxicology, burns, infectious) — decide: keep as "elective" or move to separate catalog
   - [ ] Update `microCourses` table with correct `emergencyType` enums to match PSOT domains

2. **Implement course prerequisite enforcement**
   - [ ] Add `prerequisiteValidated` column to `microCourseEnrollments`
   - [ ] Update `courses.enrollWithMpesa` to check prerequisite completion before allowing enrollment
   - [ ] Add `courses.checkPrerequisite` query

3. **Implement Care Signal monthly bucketing & grace logic**
   - [ ] Add `eatCalendarMonth`, `graceApplied`, `catchUpRequired`, `streakResetDate` columns to `careSignalEvents`
   - [ ] Create `careSignalMonthlyStatus` view (aggregate events by month)
   - [ ] Implement grace/catch-up/streak reset logic in `careSignalEvents` router

4. **Create fellowship qualification router**
   - [ ] `fellowshipQualification.getCoursePillarStatus` → check pillar A
   - [ ] `fellowshipQualification.getResusGPSPillarStatus` → check pillar B
   - [ ] `fellowshipQualification.getCareSIgnalPillarStatus` → check pillar C with grace/streak
   - [ ] `fellowshipQualification.getFullProgress` → aggregate all 3
   - [ ] `fellowshipQualification.isFellow` → boolean

### Phase 2: UI & Dashboard (2-3 days)

5. **Build fellowship progress dashboard**
   - [ ] Create `/fellowship/progress` page
   - [ ] Build `FellowshipProgressDashboard.tsx` with all 3 pillars
   - [ ] Add `CoursePillarStatus`, `ResusGPSConditionChecklist`, `CareSIgnalMonthlyStatus` components
   - [ ] Show grace remaining, catch-up required, streak status

6. **Add fellowship badge & messaging**
   - [ ] Create `FellowshipBadge.tsx` component
   - [ ] Add to user profile / header when `isFellow` is true
   - [ ] Create `StreakResetAlert.tsx` for notifications

### Phase 3: Legal & Governance (1-2 days)

7. **Document fellowship criteria & launch gates**
   - [ ] Update ToS/privacy policy for Care Signal, grace rules, streak reset
   - [ ] Document appeals process for system errors
   - [ ] Get legal/counsel review

### Phase 4: Testing & Launch (1-2 days)

8. **Integration testing**
   - [ ] Test full fellowship journey: enroll courses → complete → ResusGPS sessions → Care Signal reporting → Fellow status
   - [ ] Test grace/catch-up/streak reset logic with edge cases
   - [ ] Test prerequisite enforcement
   - [ ] Load test: 100+ concurrent users

---

## 9. Summary of Critical Gaps

| Gap | PSOT Requirement | Current Status | Impact | Priority |
|-----|------------------|-----------------|--------|----------|
| **Micro-course alignment** | 24 MECE courses | 26 misaligned courses | Fellowship pillar A broken | 🔴 CRITICAL |
| **Course prerequisites** | Enforce I before II | No enforcement | Users can skip foundational courses | 🔴 CRITICAL |
| **Care Signal grace/streak** | Automated grace, catch-up, reset | Completely missing | Fellowship pillar C cannot be validated | 🔴 CRITICAL |
| **Fellowship qualification** | Automated pillar A/B/C check | No system exists | Cannot determine who is a fellow | 🔴 CRITICAL |
| **Fellowship dashboard** | Single aggregated progress view | Missing | Users don't see progress toward fellow | 🟠 HIGH |
| **ResusGPS pillar B validation** | ≥3 valid sessions per condition | Query missing | Cannot validate pillar B completion | 🟠 HIGH |
| **Legal & consent** | Privacy policy, appeals process | Missing | Compliance risk | 🟠 HIGH |
| **Accredited facilities** | Future governance model | Aspirational | Not blocking v1 | 🟡 LOW |

---

## 10. Conclusion

**The micro-course system is ~40% complete for fellowship qualification.**

**What's working:**
- ✅ 26 courses created (though misaligned with PSOT)
- ✅ Care Signal router exists
- ✅ ResusGPS pathway mapping exists
- ✅ Provider intelligence tracking exists

**What's missing (blocking fellowship launch):**
- ❌ Micro-course catalog alignment with PSOT MECE
- ❌ Course prerequisite enforcement
- ❌ Care Signal grace/catch-up/streak automation
- ❌ Fellowship qualification system (pillars A/B/C validation)
- ❌ Fellowship progress dashboard
- ❌ Legal/consent flows

**Recommendation:** Complete Phase 1 (data & automation) before launching any "Fellow" title or progress UI. Otherwise, the system cannot accurately determine who qualifies.

---

**Next Action:** Prioritize Phase 1 (2-3 days) to unblock fellowship qualification automation. Then Phase 2 (UI) can proceed in parallel with Phase 3 (legal).
