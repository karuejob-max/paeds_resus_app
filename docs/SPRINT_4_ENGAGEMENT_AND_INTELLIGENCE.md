# Sprint 4: Fellowship Engagement & Institutional Intelligence

**Objective:** Drive daily Pillar B practice through gamification, provide institutional leaders with training gap visibility, and enhance ResusGPS completion feedback.

**Strategic Alignment:** 
- Pillar B: Daily streak practice → mastery → fellowship readiness
- Pillar C: Institutional training gaps → facility improvement → reduced preventable deaths
- Analytics: Every session emits to `analyticsEvents` for real-time visibility

---

## Phase 4.2: Practice Streak Gamification

### Overview
Tracks consecutive days of practice per condition to drive engagement and identify facility training gaps.

### Components

#### `server/lib/streak-tracking.ts`
Core streak calculation engine with EAT timezone support (UTC+3).

**Key Functions:**
- `calculateStreak(userId, condition)` — Returns current streak, longest streak, milestone badge
- `getFacilityStreakLeaderboard(institutionId)` — Top 10 conditions by average facility streak
- `getUserStreakMilestones(userId)` — All conditions with active streaks (7+ days)

**Milestone Badges:**
- 🟡 Silver: 7-day streak
- 🟠 Gold: 14-day streak  
- 👑 Platinum: 30-day streak

**Timezone Handling:**
- All calculations use EAT (UTC+3) for consistency across East African facilities
- Daily practice window: 00:00 - 23:59 EAT
- Streak resets if no practice for 24+ hours

#### `server/routers/streak-tracking.ts`
tRPC procedures for frontend consumption.

**Procedures:**
- `getConditionStreak` — Get streak for specific condition
- `getUserMilestones` — Get all active streaks for user
- `getFacilityLeaderboard` — Get facility-level rankings
- `getTopStreaks` — Get top 3 streaks for dashboard quick view

#### `client/src/components/StreakBadge.tsx`
Visual streak display component with milestone indicators.

**Props:**
- `currentStreak` — Current consecutive days
- `milestone` — Badge type (silver/gold/platinum)
- `condition` — Condition name
- `compact` — Compact mode for dashboard cards

**Features:**
- Flame icon for active streaks
- Trophy/Star/Zap icons for milestones
- Leaderboard component showing facility-level rankings

### Integration Points

1. **FellowshipProgressCard** — Embed StreakBadge for each condition with ≥7-day streak
2. **ResusGPS Completion** — Award streak point when session is valid
3. **Admin Dashboard** — Show facility-level leaderboard and gap analysis

### Testing

- Streak calculation across month boundaries
- Timezone edge cases (midnight EAT transitions)
- Leaderboard anonymization (no PII exposure)
- Performance: <500ms for 100+ staff facility

---

## Phase 4.3: Facility Admin Dashboard

### Overview
Institutional intelligence dashboard showing training gaps, staff engagement, and facility benchmarking.

### Components

#### `client/src/pages/FacilityTrainingGaps.tsx`
Admin dashboard for facility leaders.

**Sections:**

1. **Staff Engagement Overview**
   - Total staff
   - Active last week / last month
   - Avg sessions per week
   - Avg conditions per staff
   - Critical gaps count

2. **Training Gaps by Timeframe**
   - Conditions not practiced in 30/60/90 days
   - Risk levels: Critical (red), High (orange), Low (green)
   - Staff affected count
   - Recommended actions
   - Drill-down to view affected staff

3. **Facility Benchmark**
   - Compare to anonymized similar-sized hospitals
   - Avg sessions/week
   - Staff engagement %
   - Critical gaps count

4. **Recommended Actions**
   - Immediate: Mandatory training for critical gaps
   - This week: Engagement targets
   - This month: Balanced practice rotation

### Data Model

```typescript
interface TrainingGap {
  condition: string;
  lastPracticed: number; // days ago
  staffCount: number;
  riskLevel: 'critical' | 'high' | 'low';
  recommendation: string;
}

interface FacilityEngagement {
  totalStaff: number;
  activeLastWeek: number;
  activeLastMonth: number;
  avgSessionsPerWeek: number;
  avgConditionsPerStaff: number;
}
```

### Integration Points

1. **Admin Routes** — Wire to `/admin/institutional-analytics`
2. **Streak Leaderboard** — Show top 10 conditions by facility average streak
3. **Care Signal Integration** — Link gaps to reported care gaps
4. **Export** — Generate PDF report for hospital leadership

### Testing

- Edge cases: New facility (no practice data), single staff member
- Performance: <1s load for 100+ staff
- Anonymization: No PII in benchmarks
- PDF export with facility branding

---

## Phase 4.4: ResusGPS Completion Notifications

### Overview
Enhanced toast notifications with validation feedback, next recommendation, and session summary.

### Changes to `client/src/pages/ResusGPS.tsx`

**Enhanced `handleExport` function:**

```typescript
// Valid session with conditions and next recommendation
toast.success(
  `Session Valid: Septic Shock, Meningitis +1 Practice next: Anaphylaxis`,
  { duration: 5000 }
);

// Shallow session (depth < 50%)
toast.warning(
  `Session recorded (depth: 42%). 1 more interaction needed for fellowship credit.`,
  { duration: 5000 }
);

// Session recorded but not valid
toast.success('Session recorded for fellowship tracking', { duration: 3000 });
```

**Notification Content:**
- ✅ Validation status (valid/shallow/recorded)
- 📊 Attributed conditions (top 3, +N more)
- 🎯 Next recommended condition
- 📈 Depth score and improvement suggestions

### Integration Points

1. **recommendationEngine** — Fetch next recommended condition
2. **analyticsEvents** — Emit `resusGps_session_completed` with conditions
3. **FellowshipProgressCard** — Show recommended condition in next steps

---

## Data Flow

```
ResusGPS Session Completion
    ↓
recordSession() mutation
    ↓
validatePathwaySession() [fellowship-pathways]
    ↓
Calculate depth score, attribute conditions
    ↓
Emit analyticsEvent: resusGps_session_completed
    ↓
Update FellowshipProgressCard with:
  - Streak count
  - Next recommended condition
  - Milestone badges
    ↓
Facility admin sees:
  - Condition practice frequency
  - Staff engagement
  - Training gaps
```

---

## Success Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| Daily active users | +30% | Streak gamification drives habit |
| Avg sessions/week | 2.5+ | Facility engagement improves |
| Critical gaps identified | <2 per facility | Training gaps visible to leaders |
| Streak milestones achieved | 40%+ of staff | 7+ day streaks normalize |
| Admin dashboard adoption | 80%+ of institutions | Leaders use insights for training |

---

## Security & Privacy

- **Leaderboard:** Anonymized (no names, only condition + streak count)
- **Facility Comparison:** Anonymized (vs "similar-sized hospitals")
- **Staff Drill-down:** Admin only, audit logged
- **Timezone:** All calculations in EAT to prevent timezone-based gaming

---

## Next Steps

1. **Wire FacilityTrainingGaps to admin routes** — Add to `/admin/institutional-analytics`
2. **Implement PDF export** — Generate facility reports with branding
3. **Add facility comparison API** — Match by size, region, practice patterns
4. **Create admin onboarding** — Guide leaders through dashboard interpretation
5. **Monitor adoption** — Track admin dashboard usage, identify UX gaps
