export interface OverrideDetectionResult {
  detected: boolean;
  overrideType: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
  requiresJustification: boolean;
}

export const detectOverrides = (emergencyType: string, findings: Record<string, any>): OverrideDetectionResult[] => {
  const overrides: OverrideDetectionResult[] = [];
  
  if (emergencyType === 'cpr' && findings.cprDurationSeconds > 180 && !findings.firstEpiGiven) {
    overrides.push({
      detected: true,
      overrideType: 'delayed_epinephrine',
      severity: 'high',
      description: 'CPR duration > 3 minutes without epinephrine',
      recommendation: 'Give epinephrine immediately',
      requiresJustification: true,
    });
  }
  
  if (emergencyType === 'respiratory' && findings.severity === 'severe' && !findings.oxygenStarted) {
    overrides.push({
      detected: true,
      overrideType: 'no_oxygen_severe_asthma',
      severity: 'high',
      description: 'Severe asthma without supplemental oxygen',
      recommendation: 'Start high-flow oxygen',
      requiresJustification: true,
    });
  }
  
  if (emergencyType === 'anaphylaxis' && findings.severity !== 'mild' && findings.epinephrineDoses === 0 && findings.timeSinceOnset > 60) {
    overrides.push({
      detected: true,
      overrideType: 'delayed_epinephrine_anaphylaxis',
      severity: 'high',
      description: 'Anaphylaxis > 1 minute without epinephrine IM',
      recommendation: 'Give epinephrine IM IMMEDIATELY',
      requiresJustification: true,
    });
  }
  
  return overrides;
};

export const hasHighRiskOverrides = (overrides: OverrideDetectionResult[]): boolean => {
  return overrides.some((o) => o.severity === 'high');
};
