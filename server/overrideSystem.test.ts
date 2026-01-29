import { describe, it, expect, beforeEach } from 'vitest';
import {
  canClinicianOverride,
  calculateOverrideSeverity,
  validateOverrideReason,
  calculateQualityScore,
  generateOverrideSummary,
  OverrideAuditTrail,
  OverrideRecord,
} from '@/lib/overrideSystem';

// Mock OverrideAuditTrail for testing
class MockOverrideAuditTrail {
  private overrides: OverrideRecord[] = [];

  recordOverride(override: Omit<OverrideRecord, 'id' | 'timestamp' | 'sessionId'>): OverrideRecord {
    const record: OverrideRecord = {
      ...override,
      id: `override_${Date.now()}`,
      timestamp: Date.now(),
      sessionId: 'test_session',
    };
    this.overrides.push(record);
    return record;
  }

  updateOutcome(
    overrideId: string,
    outcome: 'improved' | 'stable' | 'deteriorated' | 'unknown',
    notes?: string
  ): OverrideRecord | null {
    const override = this.overrides.find((o) => o.id === overrideId);
    if (!override) return null;
    override.patientOutcome = outcome;
    if (notes) override.outcomeNotes = notes;
    return override;
  }

  getSessionOverrides(): OverrideRecord[] {
    return [...this.overrides];
  }

  getStatistics() {
    return {
      totalOverrides: this.overrides.length,
      criticalCount: this.overrides.filter((o) => o.severity === 'critical').length,
      highCount: this.overrides.filter((o) => o.severity === 'high').length,
      mediumCount: this.overrides.filter((o) => o.severity === 'medium').length,
      lowCount: this.overrides.filter((o) => o.severity === 'low').length,
      improvedOutcomes: this.overrides.filter((o) => o.patientOutcome === 'improved').length,
      stableOutcomes: this.overrides.filter((o) => o.patientOutcome === 'stable').length,
      deterioratedOutcomes: this.overrides.filter((o) => o.patientOutcome === 'deteriorated').length,
      unknownOutcomes: this.overrides.filter((o) => !o.patientOutcome).length,
      outcomeImprovement: 0,
    };
  }
}

describe('Override System with Accountability', () => {
  let auditTrail: MockOverrideAuditTrail;

  beforeEach(() => {
    auditTrail = new MockOverrideAuditTrail();
  });

  // Test 1: Role-based permissions
  describe('Role-Based Permissions', () => {
    it('should allow senior doctors to override high severity actions', () => {
      const permissions = canClinicianOverride('senior_doctor', 'high');
      expect(permissions.canOverride).toBe(true);
      expect(permissions.maxSeverityLevel).toBe('high');
    });

    it('should allow consultants to override critical actions', () => {
      const permissions = canClinicianOverride('consultant', 'critical');
      expect(permissions.canOverride).toBe(true);
      expect(permissions.maxSeverityLevel).toBe('critical');
    });

    it('should not allow junior doctors to override', () => {
      const permissions = canClinicianOverride('junior_doctor', 'low');
      expect(permissions.canOverride).toBe(false);
    });

    it('should not allow nurses to override', () => {
      const permissions = canClinicianOverride('nurse', 'medium');
      expect(permissions.canOverride).toBe(false);
    });

    it('should require approval for senior doctor critical overrides', () => {
      const permissions = canClinicianOverride('senior_doctor', 'critical');
      expect(permissions.requiresApproval).toBe(true);
      expect(permissions.approvalRequired.critical).toBe(true);
    });

    it('should not require approval for consultant critical overrides', () => {
      const permissions = canClinicianOverride('consultant', 'critical');
      expect(permissions.requiresApproval).toBe(false);
    });
  });

  // Test 2: Override severity calculation
  describe('Override Severity Calculation', () => {
    it('should classify airway intubation as critical', () => {
      const severity = calculateOverrideSeverity('respiratory-failure', 'airway-intubation');
      expect(severity).toBe('critical');
    });

    it('should classify fluid bolus as critical', () => {
      const severity = calculateOverrideSeverity('septic-shock', 'fluid-bolus');
      expect(severity).toBe('critical');
    });

    it('should classify seizure management as high', () => {
      const severity = calculateOverrideSeverity('status-epilepticus', 'seizure-management');
      expect(severity).toBe('high');
    });

    it('should classify DKA insulin as high', () => {
      const severity = calculateOverrideSeverity('dka', 'insulin-infusion');
      expect(severity).toBe('high');
    });

    it('should classify cardiogenic shock as medium', () => {
      const severity = calculateOverrideSeverity('cardiogenic-shock', 'generic-action');
      expect(severity).toBe('medium');
    });

    it('should classify other actions as low', () => {
      const severity = calculateOverrideSeverity('other-engine', 'other-action');
      expect(severity).toBe('low');
    });
  });

  // Test 3: Override reason validation
  describe('Override Reason Validation', () => {
    it('should accept valid clinical judgment reason', () => {
      const validation = validateOverrideReason(
        'clinical_judgment',
        'Based on 20 years of experience in pediatric resuscitation',
        'high'
      );
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should require detailed explanation for critical overrides', () => {
      const validation = validateOverrideReason('clinical_judgment', 'Too short', 'critical');
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should require allergy mention for allergy/contraindication reason', () => {
      const validation = validateOverrideReason(
        'allergy_contraindication',
        'Patient has a reaction',
        'high'
      );
      expect(validation.valid).toBe(false);
    });

    it('should accept allergy reason with allergy mention', () => {
      const validation = validateOverrideReason(
        'allergy_contraindication',
        'Patient has documented allergy to penicillin class antibiotics',
        'high'
      );
      expect(validation.valid).toBe(true);
    });

    it('should require resource specification for resource unavailable reason', () => {
      const validation = validateOverrideReason(
        'resource_unavailable',
        'Not available right now',
        'high'
      );
      expect(validation.valid).toBe(false);
    });

    it('should accept resource reason with resource mention', () => {
      const validation = validateOverrideReason(
        'resource_unavailable',
        'Ventilator resource not available in this facility',
        'high'
      );
      expect(validation.valid).toBe(true);
    });
  });

  // Test 4: Override recording and tracking
  describe('Override Recording and Tracking', () => {
    it('should record override with all details', () => {
      const override = auditTrail.recordOverride({
        clinicianId: 'doc_001',
        clinicianName: 'Dr. Smith',
        clinicianRole: 'senior_doctor',
        engineId: 'septic-shock',
        engineName: 'Septic Shock Engine',
        actionId: 'fluid-bolus',
        actionTitle: 'Fluid Bolus 20 mL/kg',
        recommendedAction: 'Give RL 20 mL/kg over 15 minutes',
        overriddenAction: 'Gave NS 10 mL/kg due to facility protocol',
        reason: 'facility_protocol',
        reasonDetails: 'Facility uses NS for all fluid resuscitation',
        severity: 'critical',
        patientAge: 5,
        patientWeight: 18,
        clinicalContext: 'Septic shock with fever and hypotension',
        followUpRequired: true,
      });

      expect(override.id).toBeDefined();
      expect(override.timestamp).toBeDefined();
      expect(override.clinicianName).toBe('Dr. Smith');
      expect(override.severity).toBe('critical');
    });

    it('should track override outcome', () => {
      const override = auditTrail.recordOverride({
        clinicianId: 'doc_001',
        clinicianName: 'Dr. Smith',
        clinicianRole: 'senior_doctor',
        engineId: 'status-epilepticus',
        engineName: 'Status Epilepticus Engine',
        actionId: 'seizure-management',
        actionTitle: 'Diazepam IV',
        recommendedAction: 'Diazepam 0.1-0.3 mg/kg IV',
        overriddenAction: 'Gave lorazepam instead',
        reason: 'facility_protocol',
        reasonDetails: 'Facility prefers lorazepam',
        severity: 'high',
        patientAge: 8,
        patientWeight: 25,
        clinicalContext: 'Active seizures',
        followUpRequired: false,
      });

      const updated = auditTrail.updateOutcome(override.id, 'improved', 'Seizures stopped within 2 minutes');
      expect(updated?.patientOutcome).toBe('improved');
      expect(updated?.outcomeNotes).toBe('Seizures stopped within 2 minutes');
    });

    it('should retrieve all session overrides', () => {
      auditTrail.recordOverride({
        clinicianId: 'doc_001',
        clinicianName: 'Dr. Smith',
        clinicianRole: 'senior_doctor',
        engineId: 'septic-shock',
        engineName: 'Septic Shock Engine',
        actionId: 'fluid-bolus',
        actionTitle: 'Fluid Bolus',
        recommendedAction: 'RL 20 mL/kg',
        overriddenAction: 'NS 10 mL/kg',
        reason: 'facility_protocol',
        reasonDetails: 'Facility protocol',
        severity: 'critical',
        patientAge: 5,
        patientWeight: 18,
        clinicalContext: 'Septic shock',
        followUpRequired: true,
      });

      auditTrail.recordOverride({
        clinicianId: 'doc_002',
        clinicianName: 'Dr. Jones',
        clinicianRole: 'consultant',
        engineId: 'respiratory-failure',
        engineName: 'Respiratory Failure Engine',
        actionId: 'airway-intubation',
        actionTitle: 'Intubation',
        recommendedAction: 'ETT size 4.0',
        overriddenAction: 'ETT size 3.5',
        reason: 'patient_specific_factors',
        reasonDetails: 'Smaller airway anatomy',
        severity: 'critical',
        patientAge: 3,
        patientWeight: 12,
        clinicalContext: 'Respiratory failure',
        followUpRequired: false,
      });

      const overrides = auditTrail.getSessionOverrides();
      expect(overrides.length).toBe(2);
    });
  });

  // Test 5: Quality scoring
  describe('Quality Scoring', () => {
    it('should calculate quality score based on overrides and outcomes', () => {
      const auditData = {
        totalOverrides: 5,
        overridesByReason: {} as any,
        overrideBySeverity: { critical: 1, high: 2, medium: 1, low: 1 } as any,
        overridesByEngine: {} as any,
        overridesByClinic: {} as any,
        averageOutcomeImprovement: 80,
        qualityScore: 0,
      };

      const score = calculateQualityScore(auditData);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should penalize high number of overrides', () => {
      const auditData1 = {
        totalOverrides: 10,
        overridesByReason: {} as any,
        overrideBySeverity: { critical: 0, high: 0, medium: 0, low: 0 } as any,
        overridesByEngine: {} as any,
        overridesByClinic: {} as any,
        averageOutcomeImprovement: 50,
        qualityScore: 0,
      };

      const auditData2 = {
        totalOverrides: 100,
        overridesByReason: {} as any,
        overrideBySeverity: { critical: 0, high: 0, medium: 0, low: 0 } as any,
        overridesByEngine: {} as any,
        overridesByClinic: {} as any,
        averageOutcomeImprovement: 50,
        qualityScore: 0,
      };

      const score1 = calculateQualityScore(auditData1);
      const score2 = calculateQualityScore(auditData2);

      expect(score1).toBeGreaterThan(score2);
    });

    it('should penalize critical overrides', () => {
      const auditData1 = {
        totalOverrides: 5,
        overridesByReason: {} as any,
        overrideBySeverity: { critical: 0, high: 5, medium: 0, low: 0 } as any,
        overridesByEngine: {} as any,
        overridesByClinic: {} as any,
        averageOutcomeImprovement: 50,
        qualityScore: 0,
      };

      const auditData2 = {
        totalOverrides: 5,
        overridesByReason: {} as any,
        overrideBySeverity: { critical: 5, high: 0, medium: 0, low: 0 } as any,
        overridesByEngine: {} as any,
        overridesByClinic: {} as any,
        averageOutcomeImprovement: 50,
        qualityScore: 0,
      };

      const score1 = calculateQualityScore(auditData1);
      const score2 = calculateQualityScore(auditData2);

      expect(score1).toBeGreaterThan(score2);
    });

    it('should reward good outcomes', () => {
      const auditData1 = {
        totalOverrides: 5,
        overridesByReason: {} as any,
        overrideBySeverity: { critical: 1, high: 1, medium: 1, low: 2 } as any,
        overridesByEngine: {} as any,
        overridesByClinic: {} as any,
        averageOutcomeImprovement: 40,
        qualityScore: 0,
      };

      const auditData2 = {
        totalOverrides: 5,
        overridesByReason: {} as any,
        overrideBySeverity: { critical: 1, high: 1, medium: 1, low: 2 } as any,
        overridesByEngine: {} as any,
        overridesByClinic: {} as any,
        averageOutcomeImprovement: 80,
        qualityScore: 0,
      };

      const score1 = calculateQualityScore(auditData1);
      const score2 = calculateQualityScore(auditData2);

      expect(score2).toBeGreaterThan(score1);
    });
  });

  // Test 6: Override summary generation
  describe('Override Summary Generation', () => {
    it('should generate summary for no overrides', () => {
      const summary = generateOverrideSummary([]);
      expect(summary).toBe('No clinical overrides recorded.');
    });

    it('should generate comprehensive summary with critical overrides', () => {
      const overrides: OverrideRecord[] = [
        {
          id: '1',
          timestamp: Date.now(),
          clinicianId: 'doc_001',
          clinicianName: 'Dr. Smith',
          clinicianRole: 'senior_doctor',
          engineId: 'septic-shock',
          engineName: 'Septic Shock',
          actionId: 'fluid-bolus',
          actionTitle: 'Fluid Bolus',
          recommendedAction: 'RL 20 mL/kg',
          overriddenAction: 'NS 10 mL/kg',
          reason: 'facility_protocol',
          reasonDetails: 'Facility uses NS',
          severity: 'critical',
          patientAge: 5,
          patientWeight: 18,
          clinicalContext: 'Septic shock',
          patientOutcome: 'improved',
          followUpRequired: true,
          sessionId: 'test',
        },
      ];

      const summary = generateOverrideSummary(overrides);
      expect(summary).toContain('Clinical Overrides Summary');
      expect(summary).toContain('Total overrides: 1');
      expect(summary).toContain('Critical overrides: 1');
      expect(summary).toContain('Improved outcomes: 1');
    });
  });

  // Test 7: Complete override workflow
  describe('Complete Override Workflow', () => {
    it('should handle complete override workflow from record to outcome', () => {
      // 1. Record override
      const override = auditTrail.recordOverride({
        clinicianId: 'doc_001',
        clinicianName: 'Dr. Smith',
        clinicianRole: 'senior_doctor',
        engineId: 'anaphylaxis',
        engineName: 'Anaphylaxis Engine',
        actionId: 'epinephrine-im',
        actionTitle: 'Epinephrine IM 0.01 mg/kg',
        recommendedAction: 'IM injection 0.3-0.5 mg',
        overriddenAction: 'IV epinephrine instead',
        reason: 'clinical_judgment',
        reasonDetails: 'Patient in severe shock, IV access already established',
        severity: 'critical',
        patientAge: 6,
        patientWeight: 20,
        clinicalContext: 'Anaphylaxis with hypotension',
        followUpRequired: true,
      });

      // 2. Verify override recorded
      expect(override.id).toBeDefined();
      expect(override.severity).toBe('critical');

      // 3. Update outcome
      const updated = auditTrail.updateOutcome(override.id, 'improved', 'BP restored to normal');
      expect(updated?.patientOutcome).toBe('improved');

      // 4. Verify in session overrides
      const overrides = auditTrail.getSessionOverrides();
      expect(overrides.length).toBe(1);
      expect(overrides[0].patientOutcome).toBe('improved');
    });
  });
});
