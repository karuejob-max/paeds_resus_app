# Phase 4: Safety Gates & Accountability Framework

## Overview

Phase 4 introduces safety gates and accountability mechanisms to ensure clinical integrity across the PaedsResusGPS platform. This document outlines the current safety infrastructure and roadmap for Phase 4 implementation.

## Current Safety Measures (Phase 3)

### 1. Server Idempotency
- **Location**: `server/routers/fellowship.ts`
- **Mechanism**: Deterministic session keys prevent duplicate records on network retry
- **Benefit**: Ensures data integrity under poor connectivity

### 2. Legacy Write Gating
- **Location**: `server/routers/cprClock.ts` with `legacyWriteGate` middleware
- **Environment Variable**: `CPR_CLOCK_LEGACY_WRITE_ENABLED` (default: false)
- **Benefit**: Forces all new CPR sessions through the canonical `cprSession` router
- **Clinical Benefit**: Ensures consistent event logging and medication timing

### 3. CPR Engine Extraction
- **Location**: `client/src/lib/resus/cpr-engine.ts`
- **Functions**:
  - `evaluateRhythmTransition()`: Determines next clinical phase based on rhythm
  - `evaluateMedicationEligibility()`: Validates medication timing per AHA guidelines
  - `calculateShockEnergy()`: Computes weight-based defibrillation energy
  - `calculateCprMedicationDose()`: Calculates weight-based medication doses
- **Benefit**: Single source of truth for clinical logic across Solo and Team modes

### 4. Unified Orchestration
- **Location**: `client/src/components/CPRClockUnified.tsx`
- **Feature**: Seamless mode switching without losing session context
- **Benefit**: Providers can transition from Solo to Team mode mid-resuscitation

### 5. Debriefing Coherence
- **Location**: `client/src/components/CPRDebriefing.tsx`
- **Metrics**: Compression Fraction, Time to First Epi/Shock, Rhythm Check Intervals
- **Benefit**: Accurate post-arrest quality metrics for continuous improvement

### 6. Admin Monitoring
- **Location**: `server/routers/admin-stats.ts`
- **Metrics**: Fellowship sessions and cases tracked in rolling 7-day window
- **Benefit**: Real-time visibility into platform reliability and usage

## Phase 4 Roadmap: Clinician Override with Accountability

### 4.1 Override Mechanism
When a clinician deviates from the recommended clinical pathway, the system must:
1. **Capture the Override**: Log the decision point and the override action
2. **Record Justification**: Prompt for brief reason (e.g., "Patient unstable", "Equipment unavailable")
3. **Timestamp**: Record exact time of override relative to arrest duration
4. **Audit Trail**: Store in `adminAuditLog` for quality review

### 4.2 High-Risk Override Scenarios
- **Skipping Rhythm Check**: Continuing compressions beyond 2-minute cycle without assessment
- **Medication Timing Deviation**: Administering medication outside recommended windows
- **Shock Energy Override**: Manually adjusting defibrillation energy
- **Antiarrhythmic Selection**: Choosing alternative medication without clinical indication

### 4.3 Implementation Requirements
- Add `overrideReason` field to `resusGPSCases` schema
- Create `cprSession.recordOverride()` mutation with mandatory reason
- Build admin dashboard to review overrides and identify patterns
- Implement alert system for critical overrides (e.g., skipped rhythm checks)

### 4.4 Quality Improvement Loop
1. **Aggregate Overrides**: Monthly review of override patterns
2. **Identify Gaps**: Determine if overrides indicate system limitations or training needs
3. **Iterate**: Update clinical logic or training based on findings
4. **Communicate**: Provide feedback to providers on override patterns

## Testing & Validation

### Unit Tests
- **Location**: `client/src/lib/resus/cpr-engine.test.ts`
- **Coverage**: Rhythm assessment, medication eligibility, dose calculations
- **Run**: `pnpm test cpr-engine.test.ts`

### Integration Tests (Planned)
- CPRClockUnified mode switching without data loss
- Fellowship session persistence across network interruptions
- Admin stats rollup accuracy

### Clinical Validation (Planned)
- Peer review of shock energy calculations against AHA guidelines
- Medication dose verification against pediatric dosing references
- Rhythm assessment logic validation with cardiologists

## Deployment Checklist

- [ ] Run all unit tests and verify pass rate ≥95%
- [ ] Enable `CPR_CLOCK_LEGACY_WRITE_ENABLED=false` in production
- [ ] Monitor admin stats for fellowship session anomalies
- [ ] Verify debriefing metrics align with real-world outcomes
- [ ] Brief clinical team on new cpr-engine logic
- [ ] Set up alerts for critical override patterns

## Next Steps

1. **Implement Phase 4 Override Mechanism** (Week 1-2)
   - Add override capture and logging
   - Build admin override review dashboard

2. **Expand Clinical Coverage** (Week 3-4)
   - Add shock refractory VF protocol (escalate energy after 3 unsuccessful shocks)
   - Implement post-ROSC targeted temperature management (TTM) checklist

3. **Continuous Monitoring** (Ongoing)
   - Weekly admin stats review
   - Monthly override pattern analysis
   - Quarterly clinical outcome correlation

## References

- AHA ECC Guidelines: https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines
- Pediatric Dosing: Harriet Lane Handbook (current edition)
- Platform Architecture: `/docs/CPR_CONTRACT.md`
