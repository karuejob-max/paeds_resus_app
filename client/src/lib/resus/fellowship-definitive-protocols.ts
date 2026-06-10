/**
 * Fellowship definitive-care protocols — full step-by-step engines for all
 * ResusGPS Pillar B conditions not covered by the original Phase 5.1 trio.
 * Gold standard: DKA / septic shock rigor (ISPAD, WHO ETAT+, SSC, APLS, GINA).
 */

import type { ConditionProtocol, ProtocolStep } from './conditionProtocols';

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function roundDose(n: number, maxDose?: number): number {
  const val = Math.round(n * 10) / 10;
  return maxDose ? Math.min(val, maxDose) : val;
}

function mgKg(dose: number, weight: number, maxDose?: number): string {
  return `${roundDose(dose * weight, maxDose)} mg`;
}

function mlKg(dose: number, weight: number, maxDose?: number): string {
  return `${roundDose(dose * weight, maxDose)} mL`;
}

function baseMeta(
  id: ConditionProtocol['id'],
  name: string,
  shortName: string,
  icon: string,
  color: string,
  bgColor: string,
  triggerFindings: string[],
  monitoringTargets: string[],
  keyPitfalls: string[],
  references: string[],
  steps: ProtocolStep[]
): ConditionProtocol {
  return {
    id,
    name,
    shortName,
    icon,
    color,
    bgColor,
    triggerFindings,
    steps,
    monitoringTargets,
    keyPitfalls,
    references,
  };
}

/** Seriously ill child — WHO ETAT+ / ABCDE stabilization + disposition */
export function buildSeriouslyIllChildProtocol(weight: number, _ageCategory: string): ConditionProtocol {
  const w = weight || 10;
  const steps: ProtocolStep[] = [
    {
      id: 'sic_01_abcde',
      phase: 'Immediate (0–5 min)',
      action: 'Complete ABCDE — treat life threats before detailed history (airway, breathing, circulation, disability, exposure).',
      rationale: 'WHO ETAT+: the first minutes determine survival.',
      status: 'pending',
    },
    {
      id: 'sic_02_avpu',
      phase: 'Immediate (0–5 min)',
      action: 'Document AVPU/GCS, work of breathing, perfusion (CRT, pulse, skin temperature gradient).',
      status: 'pending',
    },
    {
      id: 'sic_03_glucose',
      phase: 'Immediate (0–5 min)',
      action: 'Bedside glucose in mmol/L — treat hypoglycaemia immediately if <3.3 mmol/L.',
      doses: [
        {
          drug: '10% Dextrose',
          dose: '2–5 mL/kg IV bolus',
          calculated: `${mlKg(2, w)} – ${mlKg(5, w)} IV`,
          route: 'IV',
        },
      ],
      status: 'pending',
    },
    {
      id: 'sic_04_fluids',
      phase: 'Stabilise (5–20 min)',
      action: 'If shocked: 10 mL/kg 0.9% NaCl or balanced crystalloid over 15–20 min — reassess after EACH aliquot.',
      doses: [
        {
          drug: '0.9% NaCl / balanced crystalloid',
          dose: '10 mL/kg IV bolus',
          calculated: `${mlKg(10, w, 500)} mL IV over 15–20 min`,
          route: 'IV',
          notes: 'WHO ETAT+: repeat up to 40 mL/kg if still shocked; watch for fluid overload.',
        },
      ],
      safetyWarning: 'Do not give routine boluses if perfusion is adequate.',
      status: 'pending',
    },
    {
      id: 'sic_05_investigate',
      phase: 'Stabilise (5–20 min)',
      action: 'Targeted investigations: Hb, malaria RDT where endemic, blood glucose, lactate if available.',
      status: 'pending',
    },
    {
      id: 'sic_06_treat_cause',
      phase: 'Definitive (20–60 min)',
      action: 'Treat identified cause (antibiotics if sepsis suspected, antimalarial if positive RDT, anticonvulsant if seizing).',
      status: 'pending',
    },
    {
      id: 'sic_07_reassess',
      phase: 'Definitive (20–60 min)',
      action: '⟳ REASSESS: repeat ABCDE and vitals after each intervention.',
      isReassessment: true,
      status: 'pending',
    },
    {
      id: 'sic_08_disposition',
      phase: 'Disposition',
      action: 'Decide disposition: ward vs HDU/PICU — SBAR handoff with working diagnosis and pending results.',
      status: 'pending',
    },
  ];
  return baseMeta(
    'seriously_ill_child',
    'Seriously Ill Child (ABCDE)',
    'Seriously Ill',
    '🩺',
    'text-slate-700',
    'bg-slate-50',
    ['lethargy', 'poor_perfusion'],
    ['HR, RR, SpO₂, CRT, AVPU/GCS hourly until stable', 'Urine output if catheterised'],
    ['Skipping ABCDE for history', 'Repeated boluses without reassessment', 'Missing hypoglycaemia'],
    ['WHO ETAT+ 2016', 'AHA PALS 2020', 'APLS 6th ed.'],
    steps
  );
}

/** Hypovolemic shock — WHO ETAT+ fluid resuscitation */
export function buildHypovolemicShockProtocol(weight: number, _ageCategory: string): ConditionProtocol {
  const w = weight || 10;
  const steps: ProtocolStep[] = [
    {
      id: 'hvs_01_access',
      phase: 'Immediate (0–5 min)',
      action: 'Two large-bore IV cannulae; IO if IV fails. Send FBC, crossmatch if haemorrhage suspected.',
      status: 'pending',
    },
    {
      id: 'hvs_02_bolus1',
      phase: 'Fluid resuscitation',
      action: 'First fluid aliquot: 10 mL/kg 0.9% NaCl over 15–20 min.',
      doses: [
        {
          drug: '0.9% NaCl',
          dose: '10 mL/kg IV',
          calculated: `${mlKg(10, w, 500)} mL IV`,
          route: 'IV',
        },
      ],
      status: 'pending',
    },
    {
      id: 'hvs_03_reassess1',
      phase: 'Fluid resuscitation',
      action: '⟳ REASSESS perfusion after first bolus: CRT, HR, BP, pulse quality, urine output.',
      isReassessment: true,
      status: 'pending',
    },
    {
      id: 'hvs_04_source',
      phase: 'Treat cause',
      action: 'Identify and treat source: haemorrhage control, ORS/NG for GI losses, anti-emetics, treat burns.',
      status: 'pending',
    },
    {
      id: 'hvs_05_bolus2',
      phase: 'Fluid resuscitation',
      action: 'If still shocked: repeat 10 mL/kg aliquot (maximum 40 mL/kg without blood/escalation per WHO ETAT+).',
      doses: [
        {
          drug: '0.9% NaCl (repeat if shocked)',
          dose: '10 mL/kg IV',
          calculated: `${mlKg(10, w, 500)} mL IV`,
          route: 'IV',
        },
      ],
      safetyWarning: 'Watch for hepatomegaly, gallop, pulmonary oedema — stop boluses if overload.',
      status: 'pending',
    },
    {
      id: 'hvs_06_blood',
      phase: 'Haemorrhagic shock',
      action: 'If haemorrhagic and unresponsive to 2 boluses: transfuse 10 mL/kg PRBC over 3–4 h.',
      doses: [
        {
          drug: 'Packed red cells',
          dose: '10 mL/kg IV',
          calculated: `${mlKg(10, w)} mL PRBC`,
          route: 'IV',
        },
      ],
      status: 'pending',
    },
    {
      id: 'hvs_07_monitor',
      phase: 'Ongoing',
      action: 'Monitor HR, BP, urine output, Hb — escalate to PICU if fluid-refractory.',
      status: 'pending',
    },
  ];
  return baseMeta(
    'hypovolemic_shock',
    'Hypovolemic Shock',
    'Hypovolemic',
    '💧',
    'text-cyan-700',
    'bg-cyan-50',
    ['dehydration', 'haemorrhage'],
    ['CRT <3 sec target', 'Urine output >1 mL/kg/h', 'Total fluids mL/kg documented'],
    ['20 mL/kg boluses in resource-limited settings', 'Missing blood for haemorrhage', 'Ignoring fluid overload'],
    ['WHO ETAT+ 2016', 'SSC Paediatric Sepsis 2020', 'APLS'],
    steps
  );
}

/** Cardiogenic shock — fluids caution, inotropes, echo */
export function buildCardiogenicShockProtocol(weight: number, _ageCategory: string): ConditionProtocol {
  const w = weight || 10;
  const steps: ProtocolStep[] = [
    {
      id: 'cgs_01_support',
      phase: 'Immediate (0–5 min)',
      action: 'Supplemental O₂; minimise fluid boluses unless clear hypovolaemia (echo/clinical).',
      status: 'pending',
    },
    {
      id: 'cgs_02_echo',
      phase: 'Diagnose (0–15 min)',
      action: 'Bedside echo if available: contractility, pericardial effusion, valve function — document findings.',
      rationale: 'Fluid in cardiogenic shock worsens pulmonary oedema.',
      status: 'pending',
    },
    {
      id: 'cgs_03_inotrope',
      phase: 'Support circulation',
      action: 'Start inotrope if perfusion poor despite cautious fluids.',
      doses: [
        {
          drug: 'Dopamine',
          dose: '5–10 mcg/kg/min IV infusion',
          calculated: `${round1(5 * w)} – ${round1(10 * w)} mcg/min (titrate to perfusion)`,
          route: 'IV infusion',
          notes: 'Alternative: adrenaline 0.05–0.3 mcg/kg/min per local protocol.',
        },
      ],
      status: 'pending',
    },
    {
      id: 'cgs_04_diurese',
      phase: 'Support circulation',
      action: 'If pulmonary oedema: furosemide 1 mg/kg IV — monitor urine output.',
      doses: [
        {
          drug: 'Furosemide',
          dose: '1 mg/kg IV',
          calculated: `${mgKg(1, w, 40)} IV`,
          route: 'IV',
        },
      ],
      status: 'pending',
    },
    {
      id: 'cgs_05_cause',
      phase: 'Treat cause',
      action: 'Treat underlying cause: myocarditis, arrhythmia, congenital lesion, tamponade drainage.',
      status: 'pending',
    },
    {
      id: 'cgs_06_reassess',
      phase: 'Ongoing',
      action: '⟳ REASSESS: perfusion, work of breathing, lactate, urine output after each change.',
      isReassessment: true,
      status: 'pending',
    },
    {
      id: 'cgs_07_escalate',
      phase: 'Escalation',
      action: 'PICU / cardiology referral; ECMO centre if refractory cardiogenic shock.',
      status: 'pending',
    },
  ];
  return baseMeta(
    'cardiogenic_shock',
    'Cardiogenic Shock',
    'Cardiogenic',
    '❤️',
    'text-rose-700',
    'bg-rose-50',
    ['heart_failure', 'poor_perfusion'],
    ['Perfusion, SpO₂, urine output', 'Inotrope dose and response'],
    ['Aggressive fluid boluses', 'Missing tamponade', 'Delayed PICU referral'],
    ['AHA PALS 2020', 'SCCM Paediatric Shock', 'APLS'],
    steps
  );
}

/** Severe pneumonia / ARDS — oxygen, antibiotics, ventilation thresholds */
export function buildSeverePneumoniaProtocol(weight: number, _ageCategory: string): ConditionProtocol {
  const w = weight || 10;
  const steps: ProtocolStep[] = [
    {
      id: 'pna_01_o2',
      phase: 'Immediate (0–5 min)',
      action: 'Supplemental O₂ — target SpO₂ ≥94% (WHO). Nasal cannula → HFNC → CPAP per escalation.',
      status: 'pending',
    },
    {
      id: 'pna_02_access',
      phase: 'Immediate (0–5 min)',
      action: 'IV access; blood culture if febrile before antibiotics when it will not delay first dose.',
      status: 'pending',
    },
    {
      id: 'pna_03_abx',
      phase: 'Antibiotics (within 1 h)',
      action: 'Ceftriaxone 50 mg/kg IV/IM (max 2 g) — add vancomycin if MRSA risk.',
      doses: [
        {
          drug: 'Ceftriaxone',
          dose: '50 mg/kg IV/IM',
          calculated: `${mgKg(50, w, 2000)} IV/IM`,
          route: 'IV/IM',
          maxDose: '2000 mg',
        },
      ],
      safetyWarning: 'Do not delay antibiotics for imaging or LP if child is unstable.',
      status: 'pending',
    },
    {
      id: 'pna_04_fluids',
      phase: 'Support',
      action: '10 mL/kg crystalloid ONLY if perfusion poor — watch for fluid overload in respiratory failure.',
      doses: [
        {
          drug: '0.9% NaCl',
          dose: '10 mL/kg IV (if shocked only)',
          calculated: `${mlKg(10, w, 500)} mL IV`,
          route: 'IV',
        },
      ],
      status: 'pending',
    },
    {
      id: 'pna_05_bronchodilator',
      phase: 'Support',
      action: 'Bronchodilator trial if wheeze; chest physiotherapy if secretions and tolerated.',
      status: 'pending',
    },
    {
      id: 'pna_06_ards',
      phase: 'ARDS / ventilation',
      action: 'If intubated: lung-protective ventilation — tidal volume 6 mL/kg ideal body weight, limit plateau pressure.',
      rationale: 'ARDSnet principles adapted for paediatrics.',
      status: 'pending',
    },
    {
      id: 'pna_07_reassess',
      phase: 'Ongoing',
      action: '⟳ REASSESS RR, work of breathing, SpO₂ after each intervention.',
      isReassessment: true,
      status: 'pending',
    },
    {
      id: 'pna_08_escalate',
      phase: 'Escalation',
      action: 'PICU if increasing work of breathing, SpO₂ <94% on high-flow, or exhaustion.',
      status: 'pending',
    },
  ];
  return baseMeta(
    'severe_pneumonia',
    'Severe Pneumonia / ARDS',
    'Pneumonia',
    '🫁',
    'text-indigo-700',
    'bg-indigo-50',
    ['pneumonia', 'hypoxia'],
    ['SpO₂ ≥94%', 'RR and work of breathing', 'Fluid balance'],
    ['Fluid overload in respiratory failure', 'Delayed antibiotics', 'Missing PICU escalation'],
    ['WHO Pocket Book of Hospital Care for Children', 'PALS 2020', 'Surviving Sepsis Campaign'],
    steps
  );
}

/** Meningitis — antibiotics, dexamethasone, LP timing */
export function buildMeningitisProtocol(weight: number, _ageCategory: string): ConditionProtocol {
  const w = weight || 10;
  const steps: ProtocolStep[] = [
    {
      id: 'men_01_abx',
      phase: 'Immediate (0–15 min)',
      action: 'Ceftriaxone 100 mg/kg/day IV divided (max 4 g/day) — do NOT delay for LP if unstable.',
      doses: [
        {
          drug: 'Ceftriaxone',
          dose: '100 mg/kg/day IV (loading 50 mg/kg if severe)',
          calculated: `${mgKg(50, w, 2000)} IV loading dose`,
          route: 'IV',
          maxDose: '2000 mg per dose',
        },
      ],
      safetyWarning: 'Give antibiotics within 1 hour of recognition — LP must not delay treatment.',
      status: 'pending',
    },
    {
      id: 'men_02_steroid',
      phase: 'Immediate (0–15 min)',
      action: 'Dexamethasone 0.15 mg/kg IV q6h × 4 doses — give with or just before first antibiotic.',
      doses: [
        {
          drug: 'Dexamethasone',
          dose: '0.15 mg/kg IV',
          calculated: `${mgKg(0.15, w, 10)} IV`,
          route: 'IV',
          notes: '4 doses total if bacterial meningitis confirmed or strongly suspected.',
        },
      ],
      status: 'pending',
    },
    {
      id: 'men_03_fluids',
      phase: 'Stabilise',
      action: '10 mL/kg crystalloid if shocked — reassess perfusion; avoid overload if raised ICP suspected.',
      doses: [
        {
          drug: '0.9% NaCl',
          dose: '10 mL/kg IV (if shocked)',
          calculated: `${mlKg(10, w, 500)} mL IV`,
          route: 'IV',
        },
      ],
      status: 'pending',
    },
    {
      id: 'men_04_lp',
      phase: 'Diagnosis',
      action: 'Lumbar puncture when safe — contraindicated if signs of raised ICP, shock, or coagulopathy.',
      rationale: 'Document opening pressure, cell count, glucose, protein, Gram stain.',
      status: 'pending',
    },
    {
      id: 'men_05_isolation',
      phase: 'Infection control',
      action: 'Droplet precautions; chemoprophylaxis for close contacts per local meningococcal policy.',
      status: 'pending',
    },
    {
      id: 'men_06_seizures',
      phase: 'Complications',
      action: 'If seizures: treat per status epilepticus protocol (benzodiazepine → second-line AED).',
      status: 'pending',
    },
    {
      id: 'men_07_reassess',
      phase: 'Ongoing',
      action: '⟳ REASSESS GCS, perfusion, rash, fontanelle tension hourly.',
      isReassessment: true,
      status: 'pending',
    },
  ];
  return baseMeta(
    'meningitis',
    'Meningitis',
    'Meningitis',
    '🧠',
    'text-violet-700',
    'bg-violet-50',
    ['meningitis', 'neck_stiffness'],
    ['GCS hourly', 'Perfusion', 'Seizure activity'],
    ['Delaying antibiotics for LP', 'Missing petechial rash', 'No contact prophylaxis'],
    ['WHO Pocket Book', 'NICE CG102', 'AHA PALS 2020'],
    steps
  );
}

/** Severe malaria — WHO artesunate, glucose, transfusion */
export function buildSevereMalariaProtocol(weight: number, _ageCategory: string): ConditionProtocol {
  const w = weight || 10;
  const steps: ProtocolStep[] = [
    {
      id: 'mal_01_artesunate',
      phase: 'Immediate (0–1 h)',
      action: 'IV/IM artesunate 3 mg/kg at 0, 12, 24 h then daily (WHO) — NOT IV artemether bolus.',
      doses: [
        {
          drug: 'Artesunate',
          dose: '3 mg/kg IV/IM',
          calculated: `${mgKg(3, w)} IV/IM at 0 h, repeat 12 h and 24 h`,
          route: 'IV/IM',
          notes: 'Complete with ACT oral course when able to swallow.',
        },
      ],
      status: 'pending',
    },
    {
      id: 'mal_02_glucose',
      phase: 'Immediate (0–1 h)',
      action: 'Check glucose in mmol/L — treat if <3.3; recheck frequently (hypoglycaemia common).',
      doses: [
        {
          drug: '10% Dextrose',
          dose: '2–5 mL/kg IV if hypoglycaemic',
          calculated: `${mlKg(2, w)} – ${mlKg(5, w)} IV`,
          route: 'IV',
        },
      ],
      status: 'pending',
    },
    {
      id: 'mal_03_fluids',
      phase: 'Support',
      action: '10 mL/kg crystalloid only if perfusion poor — reassess after each aliquot; avoid overload.',
      doses: [
        {
          drug: '0.9% NaCl',
          dose: '10 mL/kg IV (if shocked)',
          calculated: `${mlKg(10, w, 500)} mL IV`,
          route: 'IV',
        },
      ],
      status: 'pending',
    },
    {
      id: 'mal_04_transfuse',
      phase: 'Anaemia',
      action: 'Transfuse 10 mL/kg PRBC if Hb <5 g/dL or <7 g/dL with symptoms — monitor for fluid overload.',
      doses: [
        {
          drug: 'Packed red cells',
          dose: '10 mL/kg over 3–4 h',
          calculated: `${mlKg(10, w)} mL PRBC`,
          route: 'IV',
        },
      ],
      status: 'pending',
    },
    {
      id: 'mal_05_cerebral',
      phase: 'Complications',
      action: 'Cerebral malaria: head elevation 30°, treat seizures, avoid hypoglycaemia, correct acidosis.',
      status: 'pending',
    },
    {
      id: 'mal_06_reassess',
      phase: 'Ongoing',
      action: '⟳ REASSESS consciousness, glucose, urine output, respiratory rate.',
      isReassessment: true,
      status: 'pending',
    },
    {
      id: 'mal_07_act',
      phase: 'Completion',
      action: 'Transition to full course of ACT (artemether-lumefantrine or local first-line) when oral intake possible.',
      status: 'pending',
    },
  ];
  return baseMeta(
    'severe_malaria',
    'Severe Malaria',
    'Malaria',
    '🦟',
    'text-lime-700',
    'bg-lime-50',
    ['malaria', 'fever'],
    ['Glucose q1–2h initially', 'Hb and parasitaemia', 'GCS if cerebral malaria'],
    ['Artemether bolus', 'Missing hypoglycaemia', 'Excessive fluids'],
    ['WHO Severe Malaria Guidelines 2022', 'WHO ETAT+'],
    steps
  );
}

/** Burns — Parkland, airway, escharotomy */
export function buildBurnsProtocol(weight: number, _ageCategory: string): ConditionProtocol {
  const w = weight || 10;
  const parkland24h = round1(w * 4 * 30); // example TBSA 30% placeholder — learner documents actual TBSA
  const steps: ProtocolStep[] = [
    {
      id: 'brn_01_airway',
      phase: 'Immediate (0–15 min)',
      action: 'Assess inhalation injury — early intubation if stridor, soot in mouth, facial burns, or progressive oedema.',
      safetyWarning: 'Airway oedema can progress rapidly in inhalation injury.',
      status: 'pending',
    },
    {
      id: 'brn_02_tbsa',
      phase: 'Assessment',
      action: 'Calculate TBSA burned (rule of nines / Lund-Browder) — document % and depth.',
      status: 'pending',
    },
    {
      id: 'brn_03_fluids',
      phase: 'Fluid resuscitation',
      action: 'Parkland formula guide: 4 mL × kg × %TBSA in first 24 h — half in first 8 h from time of burn.',
      doses: [
        {
          drug: '0.9% NaCl / balanced crystalloid',
          dose: '4 mL/kg/%TBSA over 24 h',
          calculated: `Example at 30% TBSA: ~${parkland24h} mL/24h — titrate to urine output 0.5–1 mL/kg/h`,
          route: 'IV infusion',
          notes: 'Titrate to urine output; avoid over-resuscitation.',
        },
      ],
      status: 'pending',
    },
    {
      id: 'brn_04_wound',
      phase: 'Wound care',
      action: 'Clean and dress burns; topical silver sulfadiazine if available; tetanus prophylaxis.',
      status: 'pending',
    },
    {
      id: 'brn_05_escharotomy',
      phase: 'Surgical',
      action: 'Escharotomy if circumferential full-thickness burn with compartment signs (doppler loss, tight eschar).',
      status: 'pending',
    },
    {
      id: 'brn_06_reassess',
      phase: 'Ongoing',
      action: '⟳ REASSESS urine output, perfusion, and fluid rate after each adjustment.',
      isReassessment: true,
      status: 'pending',
    },
    {
      id: 'brn_07_refer',
      phase: 'Referral',
      action: 'Burn centre criteria: >10% TBSA, face/hands/genitalia, inhalation, electrical, circumferential.',
      status: 'pending',
    },
  ];
  return baseMeta(
    'burns',
    'Major Burns',
    'Burns',
    '🔥',
    'text-orange-700',
    'bg-orange-50',
    ['burns'],
    ['Urine output 0.5–1 mL/kg/h', 'TBSA and fluid totals', 'Airway patency'],
    ['Over-resuscitation', 'Missing inhalation injury', 'Delayed escharotomy'],
    ['ABA / APLS Burns', 'WHO Surgical Care at the District Hospital'],
    steps
  );
}

/** Trauma — APLS haemorrhage control, TXA, imaging */
export function buildTraumaProtocol(weight: number, _ageCategory: string): ConditionProtocol {
  const w = weight || 10;
  const steps: ProtocolStep[] = [
    {
      id: 'trm_01_primary',
      phase: 'Primary survey',
      action: 'ABCDE with haemorrhage control — direct pressure, tourniquet if life-threatening limb bleed.',
      status: 'pending',
    },
    {
      id: 'trm_02_txa',
      phase: 'Immediate (within 3 h)',
      action: 'Tranexamic acid if significant haemorrhage — within 3 hours of injury.',
      doses: [
        {
          drug: 'Tranexamic acid',
          dose: '15 mg/kg IV (max 1 g)',
          calculated: `${mgKg(15, w, 1000)} IV over 10 min`,
          route: 'IV',
          maxDose: '1000 mg',
        },
      ],
      status: 'pending',
    },
    {
      id: 'trm_03_fluids',
      phase: 'Circulation',
      action: '10 mL/kg aliquots if shocked — blood early if haemorrhagic; reassess perfusion after each.',
      doses: [
        {
          drug: '0.9% NaCl / blood',
          dose: '10 mL/kg IV',
          calculated: `${mlKg(10, w, 500)} mL IV or PRBC`,
          route: 'IV',
        },
      ],
      status: 'pending',
    },
    {
      id: 'trm_04_cspine',
      phase: 'C-spine',
      action: 'Maintain cervical spine protection until cleared clinically or imaged per mechanism.',
      status: 'pending',
    },
    {
      id: 'trm_05_imaging',
      phase: 'Investigations',
      action: 'FAST / X-ray / CT per mechanism and stability — do not delay haemorrhage control for imaging.',
      status: 'pending',
    },
    {
      id: 'trm_06_reassess',
      phase: 'Ongoing',
      action: '⟳ REASSESS perfusion, GCS, and bleeding after each intervention.',
      isReassessment: true,
      status: 'pending',
    },
    {
      id: 'trm_07_transfer',
      phase: 'Disposition',
      action: 'Transfer to trauma centre when local surgical / ICU resources exceeded — SBAR handoff.',
      status: 'pending',
    },
  ];
  return baseMeta(
    'trauma',
    'Major Trauma',
    'Trauma',
    '🚑',
    'text-stone-700',
    'bg-stone-50',
    ['trauma', 'haemorrhage'],
    ['Perfusion, GCS, bleeding control', 'Total fluids and blood products'],
    ['Delayed TXA', 'Crystalloid-only resuscitation in haemorrhage', 'Missed C-spine injury'],
    ['APLS 6th ed.', 'CRASH-2 (TXA)', 'ATLS principles'],
    steps
  );
}

/** Severe anaemia — transfusion thresholds, malaria workup */
export function buildSevereAnaemiaProtocol(weight: number, _ageCategory: string): ConditionProtocol {
  const w = weight || 10;
  const steps: ProtocolStep[] = [
    {
      id: 'sma_01_assess',
      phase: 'Assessment',
      action: 'Document Hb, perfusion, respiratory distress, cardiac failure signs (gallop, hepatomegaly).',
      status: 'pending',
    },
    {
      id: 'sma_02_transfuse',
      phase: 'Transfusion',
      action: 'Transfuse 10 mL/kg PRBC over 3–4 h if Hb <4 g/dL or <6 g/dL with shock — NOT 20 mL/kg if heart failure.',
      doses: [
        {
          drug: 'Packed red cells',
          dose: '10 mL/kg over 3–4 h',
          calculated: `${mlKg(10, w)} mL PRBC`,
          route: 'IV',
        },
      ],
      safetyWarning: 'Transfusion-associated circulatory overload kills — monitor HR, RR, liver size.',
      status: 'pending',
    },
    {
      id: 'sma_03_diurese',
      phase: 'Transfusion',
      action: 'Furosemide 1 mg/kg IV mid-transfusion if overload signs develop.',
      doses: [
        {
          drug: 'Furosemide',
          dose: '1 mg/kg IV',
          calculated: `${mgKg(1, w, 40)} IV`,
          route: 'IV',
        },
      ],
      status: 'pending',
    },
    {
      id: 'sma_04_malaria',
      phase: 'Treat cause',
      action: 'Malaria RDT/smear — if positive treat with artesunate per severe malaria protocol.',
      status: 'pending',
    },
    {
      id: 'sma_05_sickle',
      phase: 'Treat cause',
      action: 'Sickle crisis: hydration, analgesia, oxygen if hypoxic — exchange transfusion if stroke/ACS per protocol.',
      status: 'pending',
    },
    {
      id: 'sma_06_monitor',
      phase: 'Ongoing',
      action: 'Monitor HR, RR, liver size, SpO₂ during and after transfusion.',
      status: 'pending',
    },
    {
      id: 'sma_07_reassess',
      phase: 'Ongoing',
      action: '⟳ REASSESS Hb response and perfusion 1 h post-transfusion.',
      isReassessment: true,
      status: 'pending',
    },
  ];
  return baseMeta(
    'severe_anaemia',
    'Severe Anaemia',
    'Anaemia',
    '🩸',
    'text-red-700',
    'bg-red-50',
    ['anaemia', 'pallor'],
    ['Hb post-transfusion', 'Signs of overload', 'Malaria workup'],
    ['20 mL/kg bolus transfusion', 'Missing malaria', 'Ignoring heart failure'],
    ['WHO Blood Transfusion Safety', 'WHO Severe Anaemia guidelines'],
    steps
  );
}

/** AKI — fluids, hyperkalaemia, dialysis criteria */
export function buildAcuteKidneyInjuryProtocol(weight: number, _ageCategory: string): ConditionProtocol {
  const w = weight || 10;
  const steps: ProtocolStep[] = [
    {
      id: 'aki_01_cause',
      phase: 'Assessment',
      action: 'Classify pre-renal, renal, post-renal — treat obstruction, sepsis, nephrotoxins.',
      status: 'pending',
    },
    {
      id: 'aki_02_fluids',
      phase: 'Fluids',
      action: 'Small aliquots (5–10 mL/kg) only if hypovolaemic — reassess urine output after each.',
      doses: [
        {
          drug: '0.9% NaCl',
          dose: '5–10 mL/kg IV (if hypovolaemic)',
          calculated: `${mlKg(5, w)} – ${mlKg(10, w)} mL IV`,
          route: 'IV',
        },
      ],
      safetyWarning: 'Avoid fluid overload if oliguric with pulmonary oedema.',
      status: 'pending',
    },
    {
      id: 'aki_03_hyperk',
      phase: 'Electrolytes',
      action: 'If K⁺ >6.5 mmol/L: calcium gluconate, insulin-dextrose, salbutamol nebuliser per protocol.',
      doses: [
        {
          drug: '10% Calcium gluconate',
          dose: '0.5 mL/kg IV (max 20 mL)',
          calculated: `${mlKg(0.5, w, 20)} mL IV over 5–10 min`,
          route: 'IV',
          notes: 'Cardioprotection — does not lower K⁺ alone.',
        },
      ],
      status: 'pending',
    },
    {
      id: 'aki_04_monitor',
      phase: 'Monitoring',
      action: 'Strict fluid balance: intake/output; daily weight; avoid nephrotoxins (NSAIDs, aminoglycosides).',
      status: 'pending',
    },
    {
      id: 'aki_05_nutrition',
      phase: 'Support',
      action: 'Maintain nutrition; adjust medications for renal function.',
      status: 'pending',
    },
    {
      id: 'aki_06_rrt',
      phase: 'Escalation',
      action: 'Refer for dialysis if refractory hyperkalaemia, fluid overload, or uraemic encephalopathy.',
      status: 'pending',
    },
    {
      id: 'aki_07_reassess',
      phase: 'Ongoing',
      action: '⟳ REASSESS urine output, K⁺, acid-base, and volume status.',
      isReassessment: true,
      status: 'pending',
    },
  ];
  return baseMeta(
    'acute_kidney_injury',
    'Acute Kidney Injury',
    'AKI',
    '🫘',
    'text-amber-700',
    'bg-amber-50',
    ['oliguria', 'aki'],
    ['Urine output mL/kg/h', 'K⁺ and creatinine trend', 'Fluid balance'],
    ['Large fluid boluses in oliguria', 'Missing hyperkalaemia treatment', 'Delayed RRT referral'],
    ['KDIGO AKI guidelines', 'WHO Pocket Book'],
    steps
  );
}
