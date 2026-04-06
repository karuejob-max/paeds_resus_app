/**
 * Multi-Diagnosis Support for ResusGPS
 * 
 * Enables concurrent diagnosis tracking (e.g., sepsis + DKA, asthma + pneumonia).
 * Current system forces single diagnosis → forces provider to choose → misses concurrent conditions.
 * 
 * Clinical rationale: Children often have multiple concurrent diagnoses.
 * System must support them all to ensure comprehensive care.
 */

export type DiagnosisConfidence = 'definite' | 'likely' | 'consider';

export interface Diagnosis {
  id: string;
  condition: string; // 'sepsis', 'dka', 'asthma', 'pneumonia', etc.
  confidence: DiagnosisConfidence; // Based on findings
  findings: string[]; // Which findings support this diagnosis
  interventions: string[]; // Which interventions target this diagnosis
  timestamp: number;
  resolved: boolean;
}

/**
 * Create a new diagnosis
 */
export function createDiagnosis(
  condition: string,
  confidence: DiagnosisConfidence = 'likely',
  findings: string[] = [],
  interventions: string[] = []
): Diagnosis {
  return {
    id: `diagnosis-${Date.now()}-${Math.random()}`,
    condition,
    confidence,
    findings,
    interventions,
    timestamp: Date.now(),
    resolved: false,
  };
}

/**
 * Add finding to diagnosis
 */
export function addFindingToDiagnosis(diagnosis: Diagnosis, findingId: string): Diagnosis {
  if (!diagnosis.findings.includes(findingId)) {
    return {
      ...diagnosis,
      findings: [...diagnosis.findings, findingId],
    };
  }
  return diagnosis;
}

/**
 * Add intervention to diagnosis
 */
export function addInterventionToDiagnosis(
  diagnosis: Diagnosis,
  interventionId: string
): Diagnosis {
  if (!diagnosis.interventions.includes(interventionId)) {
    return {
      ...diagnosis,
      interventions: [...diagnosis.interventions, interventionId],
    };
  }
  return diagnosis;
}

/**
 * Mark diagnosis as resolved
 */
export function resolveDiagnosis(diagnosis: Diagnosis): Diagnosis {
  return {
    ...diagnosis,
    resolved: true,
  };
}

/**
 * Get all active diagnoses (not resolved)
 */
export function getActiveDiagnoses(diagnoses: Diagnosis[]): Diagnosis[] {
  return diagnoses.filter((d) => !d.resolved);
}

/**
 * Get diagnoses by confidence level
 */
export function getDiagnosesByConfidence(
  diagnoses: Diagnosis[],
  confidence: DiagnosisConfidence
): Diagnosis[] {
  return diagnoses.filter((d) => d.confidence === confidence);
}

/**
 * Get diagnoses supporting a finding
 */
export function getDiagnosesForFinding(diagnoses: Diagnosis[], findingId: string): Diagnosis[] {
  return diagnoses.filter((d) => d.findings.includes(findingId));
}

/**
 * Get diagnoses targeting an intervention
 */
export function getDiagnosesForIntervention(
  diagnoses: Diagnosis[],
  interventionId: string
): Diagnosis[] {
  return diagnoses.filter((d) => d.interventions.includes(interventionId));
}

/**
 * Check if diagnosis already exists
 */
export function hasDiagnosis(diagnoses: Diagnosis[], condition: string): boolean {
  return diagnoses.some((d) => d.condition === condition && !d.resolved);
}

/**
 * Get diagnosis by condition name
 */
export function getDiagnosis(diagnoses: Diagnosis[], condition: string): Diagnosis | null {
  return diagnoses.find((d) => d.condition === condition && !d.resolved) || null;
}

/**
 * Format diagnosis for display with confidence indicator
 */
export function formatDiagnosis(diagnosis: Diagnosis): string {
  const confidenceEmoji = {
    definite: '✓',
    likely: '?',
    consider: '◇',
  };

  return `${confidenceEmoji[diagnosis.confidence]} ${diagnosis.condition}`;
}

/**
 * Get color class for confidence level (Tailwind)
 */
export function getConfidenceColorClass(confidence: DiagnosisConfidence): string {
  switch (confidence) {
    case 'definite':
      return 'bg-green-500/10 border-green-500/30 text-green-600';
    case 'likely':
      return 'bg-blue-500/10 border-blue-500/30 text-blue-600';
    case 'consider':
      return 'bg-amber-500/10 border-amber-500/30 text-amber-600';
  }
}

/**
 * Suggest diagnoses based on findings
 * Returns all matching diagnoses, not just top 1
 */
export function suggestDiagnoses(findings: string[]): Array<{
  condition: string;
  confidence: DiagnosisConfidence;
  matchedFindings: string[];
  rationale: string;
}> {
  // Diagnosis criteria based on findings
  const diagnosisCriteria: Record<
    string,
    {
      definite: string[];
      likely: string[];
      consider: string[];
      rationale: string;
    }
  > = {
    sepsis: {
      definite: ['fever', 'tachycardia', 'hypotension', 'altered_mental_status'],
      likely: ['fever', 'tachycardia', 'poor_perfusion'],
      consider: ['fever', 'tachycardia'],
      rationale: 'Systemic infection with inflammatory response',
    },
    dka: {
      definite: ['hyperglycemia', 'metabolic_acidosis', 'ketones', 'altered_mental_status'],
      likely: ['hyperglycemia', 'deep_breathing', 'fruity_breath'],
      consider: ['hyperglycemia', 'deep_breathing'],
      rationale: 'Diabetic ketoacidosis with metabolic derangement',
    },
    asthma: {
      definite: ['wheezing', 'respiratory_distress', 'hypoxia', 'history_asthma'],
      likely: ['wheezing', 'respiratory_distress'],
      consider: ['wheezing', 'cough'],
      rationale: 'Reactive airway disease with bronchospasm',
    },
    pneumonia: {
      definite: ['fever', 'cough', 'crackles', 'infiltrate_on_cxr'],
      likely: ['fever', 'cough', 'tachypnea'],
      consider: ['fever', 'cough'],
      rationale: 'Lower respiratory tract infection',
    },
    anaphylaxis: {
      definite: ['urticaria', 'angioedema', 'hypotension', 'respiratory_distress'],
      likely: ['urticaria', 'respiratory_distress', 'hypotension'],
      consider: ['urticaria', 'respiratory_distress'],
      rationale: 'Severe allergic reaction with multi-system involvement',
    },
    status_epilepticus: {
      definite: ['seizure', 'seizure', 'altered_mental_status'],
      likely: ['seizure', 'altered_mental_status'],
      consider: ['seizure'],
      rationale: 'Prolonged or recurrent seizures without recovery',
    },
    shock: {
      definite: ['hypotension', 'poor_perfusion', 'altered_mental_status', 'high_lactate'],
      likely: ['hypotension', 'poor_perfusion', 'tachycardia'],
      consider: ['poor_perfusion', 'tachycardia'],
      rationale: 'Inadequate tissue perfusion and oxygenation',
    },
  };

  const suggestions: Array<{
    condition: string;
    confidence: DiagnosisConfidence;
    matchedFindings: string[];
    rationale: string;
  }> = [];

  // Check each diagnosis
  for (const [condition, criteria] of Object.entries(diagnosisCriteria)) {
    // Check for definite diagnosis
    const definitiveMatches = criteria.definite.filter((f) => findings.includes(f));
    if (definitiveMatches.length === criteria.definite.length && criteria.definite.length > 0) {
      suggestions.push({
        condition,
        confidence: 'definite',
        matchedFindings: definitiveMatches,
        rationale: criteria.rationale,
      });
      continue;
    }

    // Check for likely diagnosis
    const likelyMatches = criteria.likely.filter((f) => findings.includes(f));
    if (likelyMatches.length >= Math.ceil(criteria.likely.length * 0.7)) {
      suggestions.push({
        condition,
        confidence: 'likely',
        matchedFindings: likelyMatches,
        rationale: criteria.rationale,
      });
      continue;
    }

    // Check for consider diagnosis
    const considerMatches = criteria.consider.filter((f) => findings.includes(f));
    if (considerMatches.length >= criteria.consider.length) {
      suggestions.push({
        condition,
        confidence: 'consider',
        matchedFindings: considerMatches,
        rationale: criteria.rationale,
      });
    }
  }

  // Sort by confidence (definite > likely > consider)
  const confidenceOrder = { definite: 0, likely: 1, consider: 2 };
  suggestions.sort((a, b) => confidenceOrder[a.confidence] - confidenceOrder[b.confidence]);

  return suggestions;
}
