/**
 * Definitive Care — maps post-primary diagnosis to condition-based therapy steps
 * aligned with fellowship micro-courses (CST) and conditionProtocols engines.
 */

import {
  normalizeToFellowshipResusConditionId,
  getFellowshipMicrocourseResusConditionLabel,
} from '@shared/fellowship-microcourse-resus-conditions';
import {
  buildExtendedProtocol,
  type ConditionProtocol,
  type ExtendedConditionId,
} from './conditionProtocols';
import { getAgeCategory } from './abcdeEngine';

/** Fellowship condition → extended protocol (MVP mapped conditions). */
const FELLOWSHIP_TO_PROTOCOL: Partial<Record<string, ExtendedConditionId>> = {
  septic_shock: 'septic_shock',
  hypovolemic_shock: 'septic_shock',
  cardiogenic_shock: 'septic_shock',
  severe_pneumonia: 'septic_shock',
  meningitis: 'septic_shock',
  status_epilepticus: 'status_epilepticus',
  dka: 'dka',
  severe_asthma: 'severe_asthma',
  anaphylaxis: 'anaphylaxis',
};

export interface DefinitiveCareContext {
  fellowshipId: string;
  label: string;
  protocol: ConditionProtocol | null;
  /** When no full protocol exists — short CST-aligned bullets. */
  fallbackSteps: string[];
  hasFullProtocol: boolean;
}

const FALLBACK_STEPS: Partial<Record<string, string[]>> = {
  severe_malaria: [
    'IV/IM artesunate 3 mg/kg (WHO) — not IV artemether bolus',
    'Check glucose in mmol/L; treat if <3.3',
    '10 mL/kg crystalloid only if perfusion poor — reassess after each aliquot',
    'Transfuse if severe anaemia (Hb context); watch for fluid overload',
  ],
  burns: [
    'Airway assessment for inhalation injury',
    'Parkland estimate — titrate to urine output 0.5–1 mL/kg/hr',
    'Escharotomy if circumferential full-thickness with compartment signs',
    'Refer to burn centre when criteria met',
  ],
  trauma: [
    'Control haemorrhage; TXA within 3 h if indicated',
    '10 mL/kg aliquots if shocked — reassess perfusion; blood early if haemorrhagic',
    'Maintain SpO₂ and temperature; log resource gaps for Care Signal',
  ],
  severe_anaemia: [
    '10 mL/kg PRBC if transfusion indicated — not 20 mL/kg if cardiac failure',
    'Furosemide 1 mg/kg mid-transfusion if overload signs',
    'Treat malaria concurrently if endemic — do not defer transfusion',
  ],
  acute_kidney_injury: [
    'Identify cause; avoid nephrotoxins',
    'Fluids only if hypovolaemic — small aliquots with reassessment',
    'Hyperkalaemia / acidosis management per local protocol',
  ],
};

/**
 * Resolve definitive-care content from primary diagnosis + patient context.
 */
export function resolveDefinitiveCare(
  diagnosis: string | null,
  weightKg: number,
  patientAge: string | null
): DefinitiveCareContext | null {
  if (!diagnosis?.trim()) return null;

  const fellowshipId = normalizeToFellowshipResusConditionId(diagnosis);
  const label = getFellowshipMicrocourseResusConditionLabel(fellowshipId);
  const ageCategory = getAgeCategory(patientAge);
  const protocolId = FELLOWSHIP_TO_PROTOCOL[fellowshipId];

  if (protocolId) {
    return {
      fellowshipId,
      label,
      protocol: buildExtendedProtocol(protocolId, weightKg || 10, ageCategory),
      fallbackSteps: [],
      hasFullProtocol: true,
    };
  }

  const fallbackSteps = FALLBACK_STEPS[fellowshipId] ?? [
    'Continue monitoring and reassessment per ABCDE',
    'Document interventions and handoff (SBAR)',
    'Complete fellowship Save when case documentation is done',
  ];

  return {
    fellowshipId,
    label,
    protocol: null,
    fallbackSteps,
    hasFullProtocol: false,
  };
}
