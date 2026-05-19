/**
 * Test suite for override-safety-gates.ts
 * Validates Phase 4 safety gate implementation
 */

import { describe, it, expect } from 'vitest';
import {
  checkSafetyGate,
  getAllowedJustificationCategories,
  validateJustificationCategory,
  getSafetyGateConfig,
  requiresSecondVerification,
  requiresPhysicianReview,
  getAuditLevel,
  createAuditTrailEntry,
  updateAuditTrailWithVerification,
  updateAuditTrailWithPhysicianReview,
} from './override-safety-gates';

describe('Override Safety Gates - CPR', () => {
  it('should require justification for CPR override', () => {
    const result = checkSafetyGate('cpr', 'skipped_initial_rhythm', undefined);
    expect(result.passed).toBe(false);
    expect(result.requiresJustification).toBe(true);
  });

  it('should reject justification < 10 characters', () => {
    const result = checkSafetyGate('cpr', 'skipped_initial_rhythm', 'too short');
    expect(result.passed).toBe(false);
    expect(result.message).toContain('at least 10 characters');
  });

  it('should accept valid CPR override justification', () => {
    const result = checkSafetyGate('cpr', 'skipped_initial_rhythm', 'Patient already in VF, started CPR immediately');
    expect(result.passed).toBe(true);
    expect(result.requiresSecondVerification).toBe(true);
    expect(result.requiresPhysicianReview).toBe(true);
  });

  it('should flag CPR overrides as critical audit level', () => {
    const result = checkSafetyGate('cpr', 'delayed_epinephrine', 'Epinephrine unavailable at time');
    expect(result.auditLevel).toBe('critical');
  });
});

describe('Override Safety Gates - Respiratory', () => {
  it('should require justification for respiratory override', () => {
    const result = checkSafetyGate('respiratory', 'no_oxygen_severe_asthma', undefined);
    expect(result.passed).toBe(false);
    expect(result.requiresJustification).toBe(true);
  });

  it('should accept valid respiratory override justification', () => {
    const result = checkSafetyGate('respiratory', 'no_oxygen_severe_asthma', 'Oxygen equipment malfunction, manual ventilation initiated');
    expect(result.passed).toBe(true);
    expect(result.requiresSecondVerification).toBe(false);
  });

  it('should flag respiratory overrides as enhanced audit level', () => {
    const result = checkSafetyGate('respiratory', 'no_salbutamol_life_threatening', 'Salbutamol not available');
    expect(result.auditLevel).toBe('enhanced');
  });
});

describe('Justification Categories', () => {
  it('should return allowed categories for CPR', () => {
    const categories = getAllowedJustificationCategories('cpr');
    expect(categories).toContain('resource_unavailable');
    expect(categories).toContain('clinical_judgment');
    expect(categories).toContain('patient_preference');
    expect(categories).toContain('contraindication');
  });

  it('should validate correct justification category', () => {
    const result = validateJustificationCategory('cpr', 'resource_unavailable');
    expect(result.valid).toBe(true);
  });

  it('should reject invalid justification category', () => {
    const result = validateJustificationCategory('cpr', 'invalid_category');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('Invalid justification category');
  });
});

describe('Safety Gate Configuration', () => {
  it('should return config for valid emergency type', () => {
    const config = getSafetyGateConfig('cpr');
    expect(config).not.toBeNull();
    expect(config?.emergencyType).toBe('cpr');
    expect(config?.requiresJustification).toBe(true);
  });

  it('should return null for invalid emergency type', () => {
    const config = getSafetyGateConfig('invalid' as any);
    expect(config).toBeNull();
  });

  it('should correctly identify second verification requirement', () => {
    expect(requiresSecondVerification('cpr')).toBe(true);
    expect(requiresSecondVerification('respiratory')).toBe(false);
  });

  it('should correctly identify physician review requirement', () => {
    expect(requiresPhysicianReview('cpr')).toBe(true);
    expect(requiresPhysicianReview('respiratory')).toBe(false);
  });

  it('should return correct audit level', () => {
    expect(getAuditLevel('cpr')).toBe('critical');
    expect(getAuditLevel('respiratory')).toBe('enhanced');
    expect(getAuditLevel('anaphylaxis')).toBe('critical');
  });
});

describe('Audit Trail', () => {
  it('should create audit trail entry', () => {
    const entry = createAuditTrailEntry(
      'cpr',
      'skipped_initial_rhythm',
      'clinical_judgment',
      'Patient was already in VF when I arrived',
      'provider_001',
      'Dr. Jane Smith'
    );

    expect(entry.emergencyType).toBe('cpr');
    expect(entry.overrideType).toBe('skipped_initial_rhythm');
    expect(entry.justificationCategory).toBe('clinical_judgment');
    expect(entry.providerId).toBe('provider_001');
    expect(entry.providerName).toBe('Dr. Jane Smith');
    expect(entry.status).toBe('pending');
    expect(entry.timestamp).toBeGreaterThan(0);
  });

  it('should update audit trail with second verification', () => {
    const entry = createAuditTrailEntry(
      'cpr',
      'delayed_epinephrine',
      'resource_unavailable',
      'Epinephrine was not available',
      'provider_001',
      'Nurse John'
    );

    const updated = updateAuditTrailWithVerification(entry, 'provider_002', 'Dr. Mary Johnson');

    expect(updated.secondVerificationProviderId).toBe('provider_002');
    expect(updated.secondVerificationProviderName).toBe('Dr. Mary Johnson');
    expect(updated.status).toBe('verified');
  });

  it('should update audit trail with physician review - approved', () => {
    const entry = createAuditTrailEntry(
      'anaphylaxis',
      'delayed_epinephrine_anaphylaxis',
      'clinical_judgment',
      'Patient was in severe shock',
      'provider_001',
      'Nurse Sarah'
    );

    const reviewed = updateAuditTrailWithPhysicianReview(entry, 'provider_003', 'Dr. Robert Lee', true);

    expect(reviewed.physicianReviewProviderId).toBe('provider_003');
    expect(reviewed.physicianReviewProviderName).toBe('Dr. Robert Lee');
    expect(reviewed.status).toBe('approved');
  });

  it('should update audit trail with physician review - rejected', () => {
    const entry = createAuditTrailEntry(
      'cpr',
      'inappropriate_shock',
      'clinical_judgment',
      'Patient was in asystole',
      'provider_001',
      'Nurse Tom'
    );

    const reviewed = updateAuditTrailWithPhysicianReview(entry, 'provider_003', 'Dr. Alice Brown', false);

    expect(reviewed.status).toBe('rejected');
  });
});
