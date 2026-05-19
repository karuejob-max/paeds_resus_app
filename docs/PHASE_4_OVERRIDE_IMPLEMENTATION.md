# Phase 4: Clinician Override with Accountability - Implementation Guide

## Overview

Phase 4 implements a comprehensive override mechanism that allows clinicians to deviate from system recommendations while maintaining accountability through mandatory justification logging and admin review. This creates a quality improvement feedback loop without restricting clinical judgment.

## Architecture

### 1. Database Schema (drizzle/schema-override.ts)

Three new tables support the override mechanism:

**cprOverrideLogs**: Captures each override event with full clinical context
- Override type (skip_rhythm_check, medication_timing, shock_energy, etc.)
- Clinical state at time of override (shock count, epi doses, rhythm type)
- Recommended vs. actual action
- Mandatory justification from clinician
- Clinician accountability (userId, timestamp)
- Admin review tracking

**overrideStatistics**: Aggregated metrics for dashboard
- Counts by override type
- High-risk override tracking
- Provider statistics
- Trend analysis

**overrideJustificationTemplates**: Pre-defined reasons for common overrides
- Standardizes documentation
- Speeds up clinician workflow
- Enables pattern analysis

### 2. Server Router (server/routers/cpr-override.ts)

tRPC procedures for override management:

**logOverride**: Called when clinician deviates from recommendation
- Validates CPR session exists
- Determines if override is high-risk
- Logs with full clinical context
- Returns override ID and risk level

**getOverrides**: Retrieves overrides with optional filtering
- Filter by session, provider, type, date range
- Supports pagination
- Ordered by most recent first

**reviewOverride**: Admin review of override
- Records admin feedback
- Flags high-risk overrides
- Triggers quality improvement workflow

**getStatistics**: Aggregated metrics for dashboard
- Calculates override percentages
- Identifies top overriding providers
- Tracks high-risk patterns

**getJustificationTemplates**: Provides UI with pre-defined reasons

### 3. Client Components

**OverrideJustificationModal** (client/src/components/OverrideJustificationModal.tsx)
- Triggered when override is detected
- Shows recommended vs. actual action
- Provides template suggestions
- Requires free-text justification
- Displays accountability notice
- High-risk overrides show warning banner

**AdminOverrideReviewDashboard** (client/src/components/AdminOverrideReviewDashboard.tsx)
- Statistics cards (total, high-risk, providers, period)
- Tabbed interface (All, High-Risk, By Type)
- Override table with filtering
- Review dialog for admin feedback
- High-risk flagging capability

### 4. Override Detection Engine (client/src/lib/resus/cpr-override-engine.ts)

Pure functions that detect deviations from protocol:

**detectSkippedRhythmCheck**: Identifies when rhythm assessment is skipped
- Tracks time since last rhythm check
- Flags if >2 minutes without assessment
- High-risk override

**detectMedicationTimingDeviation**: Validates medication timing
- Epinephrine: after 2nd shock, then every 3-5 minutes
- Antiarrhythmic: after 3rd and 5th shock
- Detects premature or delayed doses

**detectShockEnergyDeviation**: Validates defibrillation energy
- Initial: 2 J/kg (max 200 J)
- Subsequent: 4 J/kg (max 360 J)
- Allows 10 J tolerance

**detectAntiarrhythmicDeviation**: Tracks antiarrhythmic selection
- Both amiodarone and lidocaine acceptable
- Logs if different from recommendation

**detectSkippedMedication**: Identifies when medication is declined
- Tracks clinician decision to skip

**detectExtendedCpr**: Detects CPR beyond protocol
- Standard termination: 30 minutes or 2 unsuccessful shocks in asystole
- High-risk override

**detectOverride**: Main function that orchestrates detection
- Analyzes current action against engine state
- Returns override context if deviation detected
- Provides recommended and actual action strings

## Integration Points

### CPRClockStreamlined Integration

When clinician performs an action that deviates from recommendation:

```typescript
// In handleRhythmCheck or other action handlers
const override = detectOverride(
  engineState,
  arrestDurationSeconds,
  patientWeight,
  currentAction,
  actionDetails
);

if (override) {
  setShowOverrideModal(true);
  setOverrideContext(override);
}
```

### CPRClockUnified Integration

Override detection works seamlessly across Solo and Team modes:
- Same engine functions used in both modes
- Override context includes mode information
- Audit trail captures which mode was active

### Admin Dashboard Integration

Admins access override review via dedicated route:
- `/admin/overrides` - Dashboard with statistics
- Filter by date range, provider, override type
- Review individual overrides with notes
- Flag for quality improvement investigation

## Workflow

### Clinician Workflow

1. **CPR Session Active**: Clinician performs resuscitation
2. **Override Detected**: System detects deviation from protocol
3. **Modal Triggered**: Justification modal appears with context
4. **Template Selection**: Clinician can select pre-defined reason (optional)
5. **Custom Justification**: Clinician provides free-text explanation
6. **Submission**: Override logged with accountability
7. **Continuation**: CPR session continues with override recorded

### Admin Workflow

1. **Dashboard Access**: Admin navigates to override review dashboard
2. **Statistics Review**: Views aggregate metrics and trends
3. **Override Selection**: Selects specific override to review
4. **Context Review**: Reads clinician justification and clinical context
5. **Feedback**: Adds admin notes and flags if high-risk
6. **Quality Action**: Initiates training, protocol update, or investigation

## High-Risk Overrides

Certain overrides are automatically flagged as high-risk:

| Override Type | Risk Level | Rationale |
|---|---|---|
| Skip Rhythm Check | HIGH | Delays critical assessment, impacts treatment decisions |
| Extended CPR Beyond Protocol | HIGH | May indicate difficulty accepting futility |
| Medication Timing (Premature) | MEDIUM | Could lead to overdosing |
| Shock Energy Deviation | LOW | Clinician judgment may be appropriate |
| Antiarrhythmic Selection | LOW | Both options are evidence-based |

High-risk overrides:
- Display warning banner in modal
- Automatically flagged in admin dashboard
- Trigger quality review workflow
- May require clinical leadership approval

## Testing

Comprehensive test suite in `cpr-override-engine.test.ts`:

- **Skipped Rhythm Check**: 3 tests
- **Medication Timing**: 4 tests
- **Shock Energy**: 3 tests
- **Antiarrhythmic Selection**: 2 tests
- **Skipped Medication**: 2 tests
- **Extended CPR**: 3 tests
- **Main Function**: 4 tests
- **High-Risk Identification**: 3 tests

Total: 24 tests covering all override types and edge cases

Run tests:
```bash
pnpm test cpr-override-engine.test.ts
```

## Quality Improvement Loop

### Weekly Review
- Aggregate override statistics
- Identify patterns (e.g., specific provider, specific scenario)
- Discuss with clinical team

### Monthly Analysis
- Trend analysis across all overrides
- Identify system gaps (e.g., if many providers override medication timing)
- Update protocols or templates based on findings

### Quarterly Audit
- Deep dive into high-risk overrides
- Assess clinical outcomes vs. override decisions
- Validate that overrides were clinically appropriate
- Provide feedback to providers

## API Reference

### Log Override
```typescript
api.cprOverride.logOverride.mutate({
  cprSessionId: 123,
  overrideType: 'skip_rhythm_check',
  arrestDurationSeconds: 180,
  rhythmType: 'vf_pvt',
  shockCount: 2,
  epiDoseCount: 1,
  recommendedAction: 'Perform rhythm check',
  actualAction: 'Continued compressions',
  justification: 'Patient unstable, unable to safely assess rhythm'
})
```

### Get Overrides
```typescript
api.cprOverride.getOverrides.useQuery({
  cprSessionId: 123,
  overrideType: 'skip_rhythm_check',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  limit: 50,
  offset: 0
})
```

### Review Override
```typescript
api.cprOverride.reviewOverride.mutate({
  overrideLogId: 456,
  reviewNotes: 'Clinically appropriate given patient instability',
  isHighRisk: false
})
```

### Get Statistics
```typescript
api.cprOverride.getStatistics.useQuery({
  periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  periodEnd: new Date()
})
```

## Deployment Checklist

- [ ] Database migrations applied (cprOverrideLogs, overrideStatistics, overrideJustificationTemplates)
- [ ] tRPC router registered in main router
- [ ] UI components integrated into CPRClockStreamlined and CPRClockUnified
- [ ] Override detection engine tested (24 tests passing)
- [ ] Admin dashboard accessible to admin users
- [ ] Default justification templates created
- [ ] Clinical team trained on override workflow
- [ ] Monitoring configured for high-risk overrides
- [ ] Quality improvement process documented

## Next Steps

1. **Override UI Refinement**: Gather clinician feedback on modal UX
2. **Template Expansion**: Add more pre-defined justification templates
3. **Outcome Correlation**: Link overrides to session outcomes for analysis
4. **Machine Learning**: Identify patterns in overrides to improve system
5. **Mobile Optimization**: Ensure override modal works on mobile devices
6. **Integration with Training**: Use override data to personalize training

## References

- AHA PALS Guidelines: https://cpr.heart.org/
- Pediatric Dosing: Harriet Lane Handbook
- Override Detection Logic: See `cpr-override-engine.ts`
- Database Schema: See `schema-override.ts`
