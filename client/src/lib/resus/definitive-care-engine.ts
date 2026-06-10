/**

 * Definitive Care — maps post-primary diagnosis to condition-based therapy steps

 * aligned with fellowship micro-courses (CST) and conditionProtocols engines.

 *

 * Credit gating: fellowship Pillar B awards only after all required steps complete.

 * Guidelines: ISPAD 2022 (DKA), WHO ETAT+ / SSC (sepsis), ILAE (SE), GINA (asthma).

 */



import {

  normalizeToFellowshipResusConditionId,

  getFellowshipMicrocourseResusConditionLabel,

  isFellowshipMicrocourseResusCondition,

} from '@shared/fellowship-microcourse-resus-conditions';

import {

  buildExtendedProtocol,

  type ConditionProtocol,

  type ExtendedConditionId,

  type ProtocolStep,

} from './conditionProtocols';

import { getAgeCategory } from './abcdeEngine';



/** Fellowship condition → extended protocol (full step-by-step engines). */

const FELLOWSHIP_TO_PROTOCOL: Partial<Record<string, ExtendedConditionId>> = {
  seriously_ill_child: 'seriously_ill_child',
  severe_asthma: 'severe_asthma',
  severe_pneumonia: 'severe_pneumonia',
  septic_shock: 'septic_shock',
  hypovolemic_shock: 'hypovolemic_shock',
  cardiogenic_shock: 'cardiogenic_shock',
  status_epilepticus: 'status_epilepticus',
  dka: 'dka',
  anaphylaxis: 'anaphylaxis',
  meningitis: 'meningitis',
  severe_malaria: 'severe_malaria',
  burns: 'burns',
  trauma: 'trauma',
  severe_anaemia: 'severe_anaemia',
  acute_kidney_injury: 'acute_kidney_injury',
};



export interface DefinitiveCareFallbackStep {

  id: string;

  phase: string;

  action: string;

  rationale?: string;

  safetyWarning?: string;

  isReassessment?: boolean;

  isCoDiagnosis?: boolean;

  isDischarge?: boolean;

}



export interface DefinitiveCareContext {

  fellowshipId: string;

  label: string;

  protocol: ConditionProtocol | null;

  /** Structured steps when no full protocol engine exists. */

  fallbackSteps: DefinitiveCareFallbackStep[];

  /** Co-diagnosis addon steps (e.g. sepsis antibiotics when DKA + sepsis). */

  coDiagnosisSteps: DefinitiveCareFallbackStep[];

  /** Condition-specific discharge / family education checklist. */

  dischargeSteps: DefinitiveCareFallbackStep[];

  hasFullProtocol: boolean;

  /** Unified step list for completion gating (protocol + addons + discharge). */

  allSteps: Array<{ id: string; isReassessment?: boolean }>;

}



function fb(

  fellowshipId: string,

  index: number,

  phase: string,

  action: string,

  extra?: Partial<DefinitiveCareFallbackStep>

): DefinitiveCareFallbackStep {

  return { id: `${fellowshipId}_fb_${index}`, phase, action, ...extra };

}



const FALLBACK_PROTOCOLS: Partial<Record<string, DefinitiveCareFallbackStep[]>> = {

  seriously_ill_child: [

    fb('sic', 1, 'Stabilise', 'Complete ABCDE — treat life threats before detailed history'),

    fb('sic', 2, 'Assess', 'Document perfusion, work of breathing, consciousness (AVPU/GCS)'),

    fb('sic', 3, 'Investigate', 'Targeted investigations per presentation — glucose, Hb, malaria RDT where endemic'),

    fb('sic', 4, 'Treat', '10 mL/kg crystalloid aliquots if shocked — reassess after each bolus (WHO ETAT+)'),

    fb('sic', 5, 'Reassess', 'Repeat ABCDE after each intervention', { isReassessment: true }),

    fb('sic', 6, 'Handoff', 'SBAR handoff with working diagnosis and pending results'),

  ],

  hypovolemic_shock: [

    fb('hvs', 1, 'Access', 'Two large-bore IV cannulae; send FBC, crossmatch if haemorrhage suspected'),

    fb('hvs', 2, 'Fluids', '10 mL/kg 0.9% NaCl over 15–20 min — reassess perfusion after each aliquot'),

    fb('hvs', 3, 'Source', 'Identify and treat source: haemorrhage control, ORS/NG if GI losses, anti-emetics'),

    fb('hvs', 4, 'Blood', 'Transfuse 10 mL/kg PRBC if haemorrhagic shock unresponsive to 2 boluses'),

    fb('hvs', 5, 'Reassess', 'Check CRT, HR, BP, urine output after each fluid aliquot', { isReassessment: true }),

  ],

  cardiogenic_shock: [

    fb('cgs', 1, 'Support', 'Supplemental O₂; minimise fluid boluses unless clear hypovolaemia'),

    fb('cgs', 2, 'Inotrope', 'Dopamine 5–10 mcg/kg/min OR adrenaline 0.05–0.3 mcg/kg/min per local protocol'),

    fb('cgs', 3, 'Diurese', 'Furosemide 1 mg/kg IV if pulmonary oedema — monitor urine output'),

    fb('cgs', 4, 'Cause', 'Treat underlying cause: myocarditis, arrhythmia, congenital lesion'),

    fb('cgs', 5, 'Escalate', 'PICU / cardiology referral; ECMO centre if refractory'),

  ],

  severe_pneumonia: [

    fb('pna', 1, 'Oxygen', 'SpO₂ target ≥94% — nasal cannula → HFNC → CPAP per escalation'),

    fb('pna', 2, 'Antibiotics', 'Ceftriaxone 50 mg/kg IV/IM (max 2 g) — add vancomycin if MRSA risk'),

    fb('pna', 3, 'Fluids', '10 mL/kg only if perfusion poor — watch for fluid overload in respiratory failure'),

    fb('pna', 4, 'Support', 'Bronchodilator trial if wheeze; chest physiotherapy if secretions'),

    fb('pna', 5, 'ARDS', 'Lung-protective ventilation if intubated — low tidal volume 6 mL/kg'),

    fb('pna', 6, 'Reassess', 'Repeat RR, work of breathing, SpO₂ after each intervention', { isReassessment: true }),

  ],

  meningitis: [

    fb('men', 1, 'Antibiotics', 'Ceftriaxone 100 mg/kg/day IV (max 4 g) — do NOT delay for LP if unstable'),

    fb('men', 2, 'Steroid', 'Dexamethasone 0.15 mg/kg IV q6h × 4 doses — give with or just before first antibiotic'),

    fb('men', 3, 'LP', 'Lumbar puncture when safe — contraindicated if signs of raised ICP or shock'),

    fb('men', 4, 'Isolation', 'Droplet precautions; chemoprophylaxis for close contacts per local policy'),

    fb('men', 5, 'Seizures', 'Treat seizures per status epilepticus protocol if present'),

  ],

  severe_malaria: [

    fb('mal', 1, 'Artesunate', 'IV/IM artesunate 3 mg/kg at 0, 12, 24 h then daily (WHO) — not IV artemether bolus'),

    fb('mal', 2, 'Glucose', 'Check glucose in mmol/L; treat if <3.3 — hypoglycaemia common'),

    fb('mal', 3, 'Fluids', '10 mL/kg crystalloid only if perfusion poor — reassess after each aliquot'),

    fb('mal', 4, 'Transfuse', '10 mL/kg PRBC if Hb <5 g/dL or <7 with symptoms — watch fluid overload'),

    fb('mal', 5, 'Complications', 'Manage cerebral malaria: head elevation, treat seizures, avoid hypoglycaemia'),

  ],

  burns: [

    fb('brn', 1, 'Airway', 'Assess inhalation injury — early intubation if stridor, soot, facial burns'),

    fb('brn', 2, 'Fluids', 'Parkland formula guide — titrate to urine output 0.5–1 mL/kg/hr in children'),

    fb('brn', 3, 'Wound', 'Clean and dress; topical silver sulfadiazine if available'),

    fb('brn', 4, 'Escharotomy', 'If circumferential full-thickness with compartment signs'),

    fb('brn', 5, 'Refer', 'Burn centre criteria: >10% TBSA, face/hands/genitalia, inhalation, electrical'),

  ],

  trauma: [

    fb('trm', 1, 'Haemorrhage', 'Direct pressure, tourniquet if life-threatening limb bleed'),

    fb('trm', 2, 'TXA', 'Tranexamic acid 15 mg/kg IV (max 1 g) within 3 hours if significant haemorrhage'),

    fb('trm', 3, 'Fluids', '10 mL/kg aliquots if shocked — blood early if haemorrhagic; reassess perfusion'),

    fb('trm', 4, 'C-spine', 'Maintain cervical spine protection until cleared clinically'),

    fb('trm', 5, 'Imaging', 'FAST / X-ray per mechanism; transfer when local resources exceeded'),

  ],

  severe_anaemia: [

    fb('ana', 1, 'Transfuse', '10 mL/kg PRBC over 3–4 h — not 20 mL/kg if cardiac failure signs'),

    fb('ana', 2, 'Diurese', 'Furosemide 1 mg/kg IV mid-transfusion if overload (hepatomegaly, gallop)'),

    fb('ana', 3, 'Cause', 'Treat malaria (artesunate), sickle crisis (hydration, analgesia), iron deficiency'),

    fb('ana', 4, 'Monitor', 'HR, RR, liver size during and after transfusion'),

  ],

  acute_kidney_injury: [

    fb('aki', 1, 'Cause', 'Identify pre-renal, renal, post-renal — treat obstruction, sepsis, nephrotoxins'),

    fb('aki', 2, 'Fluids', 'Small aliquots (5–10 mL/kg) only if hypovolaemic — reassess urine output'),

    fb('aki', 3, 'HyperK', 'K⁺ >6.5: calcium gluconate, insulin-dextrose, salbutamol per protocol'),

    fb('aki', 4, 'RRT', 'Refer for dialysis if refractory hyperkalaemia, fluid overload, or uraemic encephalopathy'),

  ],

};



/** Co-diagnosis addon steps when concurrent fellowship conditions documented. */

const CO_DIAGNOSIS_ADDONS: Partial<Record<string, DefinitiveCareFallbackStep[]>> = {

  septic_shock: [

    fb('co_sepsis', 1, 'Co-diagnosis: Sepsis', 'Blood culture before antibiotics if it will not delay first dose', { isCoDiagnosis: true }),

    fb('co_sepsis', 2, 'Co-diagnosis: Sepsis', 'Ceftriaxone 50 mg/kg IV/IM (max 2 g) — broaden per local antibiogram', { isCoDiagnosis: true }),

    fb('co_sepsis', 3, 'Co-diagnosis: Sepsis', '10 mL/kg crystalloid if perfusion poor — reassess after each aliquot', { isCoDiagnosis: true }),

    fb('co_sepsis', 4, 'Co-diagnosis: Sepsis', 'Source control: drain abscess, debride wound, remove infected device', { isCoDiagnosis: true }),

  ],

  severe_pneumonia: [

    fb('co_pna', 1, 'Co-diagnosis: Pneumonia', 'Supplemental O₂ to SpO₂ ≥94%', { isCoDiagnosis: true }),

    fb('co_pna', 2, 'Co-diagnosis: Pneumonia', 'Antibiotics per local pneumonia guideline', { isCoDiagnosis: true }),

  ],

  meningitis: [
    fb('co_men', 1, 'Co-diagnosis: Meningitis', 'Dexamethasone 0.15 mg/kg with first antibiotic dose', { isCoDiagnosis: true }),
    fb('co_men', 2, 'Co-diagnosis: Meningitis', 'Ceftriaxone 100 mg/kg/day — do not delay if LP pending', { isCoDiagnosis: true }),
  ],
  hypovolemic_shock: [
    fb('co_hvs', 1, 'Co-diagnosis: Hypovolemia', '10 mL/kg aliquots with reassessment — identify fluid/blood loss source', { isCoDiagnosis: true }),
  ],
  severe_malaria: [
    fb('co_mal', 1, 'Co-diagnosis: Malaria', 'IV/IM artesunate if severe malaria criteria met (WHO)', { isCoDiagnosis: true }),
    fb('co_mal', 2, 'Co-diagnosis: Malaria', 'Monitor glucose frequently — treat hypoglycaemia', { isCoDiagnosis: true }),
  ],
  trauma: [
    fb('co_trm', 1, 'Co-diagnosis: Trauma', 'TXA 15 mg/kg within 3 h if significant haemorrhage (APLS)', { isCoDiagnosis: true }),
  ],
  status_epilepticus: [
    fb('co_se', 1, 'Co-diagnosis: Seizures', 'Benzodiazepine per status epilepticus protocol if seizing', { isCoDiagnosis: true }),
  ],
};



/** Condition-specific discharge / family education (ISPAD, WHO, local). */

const DISCHARGE_EDUCATION: Partial<Record<string, DefinitiveCareFallbackStep[]>> = {

  dka: [

    fb('dc_dka', 1, 'Discharge education', 'Insulin administration technique — demonstrate and observe return demonstration', { isDischarge: true }),

    fb('dc_dka', 2, 'Discharge education', 'Sick-day rules: never stop insulin; check ketones if unwell; seek care if vomiting', { isDischarge: true }),

    fb('dc_dka', 3, 'Discharge education', 'Hypoglycaemia recognition and treatment (15 g fast-acting glucose)', { isDischarge: true }),

    fb('dc_dka', 4, 'Discharge education', 'Follow-up diabetes clinic within 1–2 weeks; HbA1c target discussed', { isDischarge: true }),

  ],

  septic_shock: [

    fb('dc_sepsis', 1, 'Discharge education', 'Warning signs to return: fever, poor feeding, reduced wet nappies, lethargy', { isDischarge: true }),

    fb('dc_sepsis', 2, 'Discharge education', 'Complete full antibiotic course — do not stop early', { isDischarge: true }),

  ],

  severe_asthma: [

    fb('dc_asthma', 1, 'Discharge education', 'Spacer technique demonstrated; written action plan provided', { isDischarge: true }),

    fb('dc_asthma', 2, 'Discharge education', 'When to return: persistent wheeze, accessory muscle use, SpO₂ <94%', { isDischarge: true }),

  ],

  status_epilepticus: [

    fb('dc_se', 1, 'Discharge education', 'Seizure first aid for caregivers; safety at home (bath, heights)', { isDischarge: true }),

    fb('dc_se', 2, 'Discharge education', 'Rescue medication plan if prescribed (buccal midazolam)', { isDischarge: true }),

  ],

  anaphylaxis: [

    fb('dc_anaphyl', 1, 'Discharge education', 'Adrenaline auto-injector training; carry two devices', { isDischarge: true }),

    fb('dc_anaphyl', 2, 'Discharge education', 'Allergen avoidance plan; medical alert identification', { isDischarge: true }),

  ],

  severe_malaria: [
    fb('dc_mal', 1, 'Discharge education', 'Complete full course of ACT; insecticide-treated net use', { isDischarge: true }),
    fb('dc_mal', 2, 'Discharge education', 'Return if fever recurs, jaundice, dark urine, confusion', { isDischarge: true }),
  ],
  seriously_ill_child: [
    fb('dc_sic', 1, 'Discharge education', 'Warning signs to return: poor feeding, reduced wet nappies, fast breathing, lethargy', { isDischarge: true }),
    fb('dc_sic', 2, 'Discharge education', 'Follow-up plan and emergency contact number provided', { isDischarge: true }),
  ],
  hypovolemic_shock: [
    fb('dc_hvs', 1, 'Discharge education', 'ORS use at home if diarrhoea — demonstrate preparation', { isDischarge: true }),
    fb('dc_hvs', 2, 'Discharge education', 'Return if vomiting, no urine, or worsening lethargy', { isDischarge: true }),
  ],
  cardiogenic_shock: [
    fb('dc_cgs', 1, 'Discharge education', 'Medication compliance and fluid/salt restriction if heart failure', { isDischarge: true }),
    fb('dc_cgs', 2, 'Discharge education', 'Cardiology follow-up arranged before discharge', { isDischarge: true }),
  ],
  severe_pneumonia: [
    fb('dc_pna', 1, 'Discharge education', 'Complete antibiotic course; spacer technique if wheeze', { isDischarge: true }),
    fb('dc_pna', 2, 'Discharge education', 'Return if fast breathing, chest indrawing, or SpO₂ <94%', { isDischarge: true }),
  ],
  meningitis: [
    fb('dc_men', 1, 'Discharge education', 'Complete antibiotic course; hearing check arranged', { isDischarge: true }),
    fb('dc_men', 2, 'Discharge education', 'Contact prophylaxis instructions for household', { isDischarge: true }),
  ],
  burns: [
    fb('dc_brn', 1, 'Discharge education', 'Wound care and dressing change schedule explained', { isDischarge: true }),
    fb('dc_brn', 2, 'Discharge education', 'Return if fever, increasing pain, or wound odour', { isDischarge: true }),
  ],
  trauma: [
    fb('dc_trm', 1, 'Discharge education', 'Activity restriction and wound care per injury', { isDischarge: true }),
    fb('dc_trm', 2, 'Discharge education', 'Return if vomiting, headache, or behaviour change (head injury)', { isDischarge: true }),
  ],
  severe_anaemia: [
    fb('dc_sma', 1, 'Discharge education', 'Iron supplementation if indicated; malaria prevention', { isDischarge: true }),
    fb('dc_sma', 2, 'Discharge education', 'Return if pallor worsens, breathlessness, or fever', { isDischarge: true }),
  ],
  acute_kidney_injury: [
    fb('dc_aki', 1, 'Discharge education', 'Fluid intake/output monitoring instructions', { isDischarge: true }),
    fb('dc_aki', 2, 'Discharge education', 'Avoid nephrotoxins; nephrology follow-up arranged', { isDischarge: true }),
  ],
};



const DEFAULT_DISCHARGE: DefinitiveCareFallbackStep[] = [

  fb('dc_gen', 1, 'Discharge education', 'Written discharge instructions in language family understands', { isDischarge: true }),

  fb('dc_gen', 2, 'Discharge education', 'Warning signs to return immediately — explained and understood', { isDischarge: true }),

  fb('dc_gen', 3, 'Discharge education', 'Follow-up appointment and contact number provided', { isDischarge: true }),

];



function appendCoDiagnosisSteps(
  protocol: ConditionProtocol,
  coIds: string[]
): ConditionProtocol {
  const addons: ProtocolStep[] = [];
  for (const coId of coIds) {
    const steps = CO_DIAGNOSIS_ADDONS[coId];
    if (!steps) continue;
    for (const s of steps) {
      addons.push({
        id: s.id,
        phase: s.phase,
        action: s.action,
        rationale: s.rationale,
        safetyWarning: s.safetyWarning,
        status: 'pending',
      });
    }
  }
  if (addons.length === 0) return protocol;
  return { ...protocol, steps: [...protocol.steps, ...addons] };
}



function buildAllSteps(ctx: Omit<DefinitiveCareContext, 'allSteps'>): Array<{ id: string; isReassessment?: boolean }> {

  const steps: Array<{ id: string; isReassessment?: boolean }> = [];

  if (ctx.protocol) {

    for (const s of ctx.protocol.steps) {

      steps.push({ id: s.id, isReassessment: s.isReassessment });

    }

  } else {

    for (const s of ctx.fallbackSteps) {

      steps.push({ id: s.id, isReassessment: s.isReassessment });

    }

  }

  for (const s of ctx.coDiagnosisSteps) {

    steps.push({ id: s.id, isReassessment: s.isReassessment });

  }

  for (const s of ctx.dischargeSteps) {

    steps.push({ id: s.id, isReassessment: s.isReassessment });

  }

  return steps;

}



/**

 * Resolve definitive-care content from primary diagnosis, co-diagnoses, and patient context.

 */

export function resolveDefinitiveCare(

  diagnosis: string | null,

  weightKg: number,

  patientAge: string | null,

  concurrentDiagnoses: string[] = []

): DefinitiveCareContext | null {

  if (!diagnosis?.trim()) return null;



  const fellowshipId = normalizeToFellowshipResusConditionId(diagnosis);

  const label = getFellowshipMicrocourseResusConditionLabel(fellowshipId);

  const ageCategory = getAgeCategory(patientAge);

  const protocolId = FELLOWSHIP_TO_PROTOCOL[fellowshipId];



  const coIds = concurrentDiagnoses

    .map((d) => normalizeToFellowshipResusConditionId(d))

    .filter((id) => isFellowshipMicrocourseResusCondition(id) && id !== fellowshipId);



  const coDiagnosisSteps: DefinitiveCareFallbackStep[] = [];

  for (const coId of coIds) {

    const addons = CO_DIAGNOSIS_ADDONS[coId];

    if (addons) coDiagnosisSteps.push(...addons);

  }



  const dischargeSteps = DISCHARGE_EDUCATION[fellowshipId] ?? DEFAULT_DISCHARGE;



  if (protocolId) {
    let protocol = buildExtendedProtocol(protocolId, weightKg || 10, ageCategory);
    protocol = appendCoDiagnosisSteps(protocol, coIds);

    const dischargeProtocolSteps: ProtocolStep[] = dischargeSteps.map((s) => ({
      id: s.id,
      phase: s.phase,
      action: s.action,
      status: 'pending' as const,
    }));
    protocol = { ...protocol, steps: [...protocol.steps, ...dischargeProtocolSteps] };

    const ctx: Omit<DefinitiveCareContext, 'allSteps'> = {
      fellowshipId,
      label,
      protocol,
      fallbackSteps: [],
      coDiagnosisSteps: [],
      dischargeSteps: [],
      hasFullProtocol: true,
    };
    return { ...ctx, allSteps: buildAllSteps(ctx) };
  }



  const fallbackSteps = FALLBACK_PROTOCOLS[fellowshipId] ?? [

    fb(fellowshipId, 1, 'Monitor', 'Continue monitoring and reassessment per ABCDE'),

    fb(fellowshipId, 2, 'Document', 'Document interventions and handoff (SBAR)'),

    fb(fellowshipId, 3, 'Reassess', 'Repeat vital signs and perfusion after each intervention', { isReassessment: true }),

  ];



  const ctx: Omit<DefinitiveCareContext, 'allSteps'> = {

    fellowshipId,

    label,

    protocol: null,

    fallbackSteps: [...fallbackSteps, ...coDiagnosisSteps, ...dischargeSteps],

    coDiagnosisSteps: [],

    dischargeSteps: [],

    hasFullProtocol: false,

  };

  return { ...ctx, allSteps: buildAllSteps(ctx) };

}


