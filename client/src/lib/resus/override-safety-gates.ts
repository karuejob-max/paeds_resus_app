/**
 * Override Safety Gates
 * 
 * Implements Phase 4 safety gates for new clinical protocols.
 * Ensures mandatory justification capture and audit trail for all deviations.
 */

import type { EmergencyType } from '@/components/EmergencyTypeSelector';

export interface SafetyGateConfig {
  emergencyType: EmergencyType;
  requiresJustification: boolean;
  requiresSecondVerification: boolean;
  requiresPhysicianReview: boolean;
  auditLevel: 'standard' | 'enhanced' | 'critical';
  allowedJustificationCategories: string[];
}

export interface SafetyGateCheckResult {
  passed: boolean;
  requiresJustification: boolean;
  requiresSecondVerification: boolean;
  requiresPhysicianReview: boolean;
  auditLevel: string;
  message: string;
}

/**
 * Safety gate configurations by emergency type
 */
const SAFETY_GATE_CONFIGS: Record<EmergencyType, SafetyGateConfig> = {
  cpr: {
    emergencyType: 'cpr',
    requiresJustification: true,
    requiresSecondVerification: true,
    requiresPhysicianReview: true,
    auditLevel: 'critical',
    allowedJustificationCategories: [
      'resource_unavailable',
      'clinical_judgment',
      'patient_preference',
      'contraindication',
      'other',
    ],
  },
  respiratory: {
    emergencyType: 'respiratory',
    requiresJustification: true,
    requiresSecondVerification: false,
    requiresPhysicianReview: false,
    auditLevel: 'enhanced',
    allowedJustificationCategories: [
      'resource_unavailable',
      'clinical_judgment',
      'patient_allergy',
      'contraindication',
      'other',
    ],
  },
  anaphylaxis: {
    emergencyType: 'anaphylaxis',
    requiresJustification: true,
    requiresSecondVerification: true,
    requiresPhysicianReview: true,
    auditLevel: 'critical',
    allowedJustificationCategories: [
      'resource_unavailable',
      'clinical_judgment',
      'patient_allergy',
      'contraindication',
      'other',
    ],
  },
  septic_shock: {
    emergencyType: 'septic_shock',
    requiresJustification: true,
    requiresSecondVerification: false,
    requiresPhysicianReview: false,
    auditLevel: 'enhanced',
    allowedJustificationCategories: [
      'resource_unavailable',
      'clinical_judgment',
      'patient_allergy',
      'contraindication',
      'other',
    ],
  },
  dka: {
    emergencyType: 'dka',
    requiresJustification: true,
    requiresSecondVerification: false,
    requiresPhysicianReview: false,
    auditLevel: 'enhanced',
    allowedJustificationCategories: [
      'resource_unavailable',
      'clinical_judgment',
      'patient_allergy',
      'contraindication',
      'other',
    ],
  },
  status_epilepticus: {
    emergencyType: 'status_epilepticus',
    requiresJustification: true,
    requiresSecondVerification: false,
    requiresPhysicianReview: false,
    auditLevel: 'enhanced',
    allowedJustificationCategories: [
      'resource_unavailable',
      'clinical_judgment',
      'patient_allergy',
      'contraindication',
      'other',
    ],
  },
};

/**
 * Check if override passes safety gates
 */
export const checkSafetyGate = (
  emergencyType: EmergencyType,
  overrideType: string,
  justification?: string
): SafetyGateCheckResult => {
  const config = SAFETY_GATE_CONFIGS[emergencyType];

  if (!config) {
    return {
      passed: false,
      requiresJustification: false,
      requiresSecondVerification: false,
      requiresPhysicianReview: false,
      auditLevel: 'standard',
      message: `Unknown emergency type: ${emergencyType}`,
    };
  }

  if (config.requiresJustification && !justification) {
    return {
      passed: false,
      requiresJustification: true,
      requiresSecondVerification: config.requiresSecondVerification,
      requiresPhysicianReview: config.requiresPhysicianReview,
      auditLevel: config.auditLevel,
      message: 'Justification is required for this override',
    };
  }

  if (justification && justification.trim().length < 10) {
    return {
      passed: false,
      requiresJustification: true,
      requiresSecondVerification: config.requiresSecondVerification,
      requiresPhysicianReview: config.requiresPhysicianReview,
      auditLevel: config.auditLevel,
      message: 'Justification must be at least 10 characters',
    };
  }

  return {
    passed: true,
    requiresJustification: config.requiresJustification,
    requiresSecondVerification: config.requiresSecondVerification,
    requiresPhysicianReview: config.requiresPhysicianReview,
    auditLevel: config.auditLevel,
    message: 'Safety gate check passed',
  };
};

/**
 * Get allowed justification categories for emergency type
 */
export const getAllowedJustificationCategories = (emergencyType: EmergencyType): string[] => {
  const config = SAFETY_GATE_CONFIGS[emergencyType];
  return config?.allowedJustificationCategories || [];
};

/**
 * Validate justification category
 */
export const validateJustificationCategory = (
  emergencyType: EmergencyType,
  category: string
): { valid: boolean; message: string } => {
  const allowed = getAllowedJustificationCategories(emergencyType);

  if (!allowed.includes(category)) {
    return {
      valid: false,
      message: `Invalid justification category: ${category}. Allowed: ${allowed.join(', ')}`,
    };
  }

  return {
    valid: true,
    message: 'Justification category is valid',
  };
};

/**
 * Get safety gate configuration for emergency type
 */
export const getSafetyGateConfig = (emergencyType: EmergencyType): SafetyGateConfig | null => {
  return SAFETY_GATE_CONFIGS[emergencyType] || null;
};

/**
 * Check if emergency type requires second verification
 */
export const requiresSecondVerification = (emergencyType: EmergencyType): boolean => {
  const config = SAFETY_GATE_CONFIGS[emergencyType];
  return config?.requiresSecondVerification || false;
};

/**
 * Check if emergency type requires physician review
 */
export const requiresPhysicianReview = (emergencyType: EmergencyType): boolean => {
  const config = SAFETY_GATE_CONFIGS[emergencyType];
  return config?.requiresPhysicianReview || false;
};

/**
 * Get audit level for emergency type
 */
export const getAuditLevel = (emergencyType: EmergencyType): string => {
  const config = SAFETY_GATE_CONFIGS[emergencyType];
  return config?.auditLevel || 'standard';
};

/**
 * Generate audit trail entry
 */
export interface AuditTrailEntry {
  timestamp: number;
  emergencyType: EmergencyType;
  overrideType: string;
  justificationCategory: string;
  justificationText: string;
  providerId: string;
  providerName: string;
  secondVerificationProviderId?: string;
  secondVerificationProviderName?: string;
  physicianReviewProviderId?: string;
  physicianReviewProviderName?: string;
  status: 'pending' | 'verified' | 'reviewed' | 'approved' | 'rejected';
}

/**
 * Create audit trail entry
 */
export const createAuditTrailEntry = (
  emergencyType: EmergencyType,
  overrideType: string,
  justificationCategory: string,
  justificationText: string,
  providerId: string,
  providerName: string
): AuditTrailEntry => {
  return {
    timestamp: Math.floor(Date.now() / 1000),
    emergencyType,
    overrideType,
    justificationCategory,
    justificationText,
    providerId,
    providerName,
    status: 'pending',
  };
};

/**
 * Update audit trail entry with verification
 */
export const updateAuditTrailWithVerification = (
  entry: AuditTrailEntry,
  secondVerificationProviderId: string,
  secondVerificationProviderName: string
): AuditTrailEntry => {
  return {
    ...entry,
    secondVerificationProviderId,
    secondVerificationProviderName,
    status: 'verified',
  };
};

/**
 * Update audit trail entry with physician review
 */
export const updateAuditTrailWithPhysicianReview = (
  entry: AuditTrailEntry,
  physicianReviewProviderId: string,
  physicianReviewProviderName: string,
  approved: boolean
): AuditTrailEntry => {
  return {
    ...entry,
    physicianReviewProviderId,
    physicianReviewProviderName,
    status: approved ? 'approved' : 'rejected',
  };
};
