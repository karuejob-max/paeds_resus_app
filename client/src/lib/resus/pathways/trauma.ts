import type { Pathway } from '../stateMachine';

export const traumaPathway: Pathway = {
  id: 'trauma',
  name: 'Trauma / Injury',
  icon: '🩹',
  description: 'Injury, bleeding, mechanism of injury',
  clarifyingQuestions: [
    {
      id: 'major_bleeding',
      text: 'Is there major external bleeding?',
      options: [
        { label: 'YES - Active hemorrhage', value: 'yes' },
        { label: 'NO', value: 'no' },
      ],
    },
  ],
  subPathways: [
    {
      id: 'hemorrhagic_trauma',
      name: 'Hemorrhagic Trauma',
      matchCondition: (answers) => answers.major_bleeding === 'yes',
      steps: [
        {
          id: 'ht_bleed',
          action: 'STOP THE BLEEDING — NOW',
          detail: 'Direct pressure with both hands. Pack wound if deep. Tourniquet for limb hemorrhage if direct pressure fails. Do NOT remove impaled objects.',
          critical: true,
        },
        {
          id: 'ht_cspine',
          action: 'C-SPINE IMMOBILIZATION',
          detail: 'Manual in-line stabilization. Assume C-spine injury until proven otherwise. Do NOT move patient unnecessarily.',
          critical: true,
        },
        {
          id: 'ht_airway',
          action: 'SECURE AIRWAY (jaw thrust only)',
          detail: 'Jaw thrust — NO head tilt. Suction blood/vomit. Consider intubation if GCS ≤ 8.',
          critical: true,
        },
        {
          id: 'ht_o2',
          action: 'HIGH-FLOW OXYGEN',
          detail: 'Non-rebreather at 15 L/min.',
          critical: true,
        },
        {
          id: 'ht_access',
          action: 'IV/IO ACCESS — 2 LARGE BORE LINES',
          detail: 'IO if IV not obtained in 90 seconds. Draw blood for crossmatch, Hb, coags.',
          critical: true,
        },
        {
          id: 'ht_txa',
          action: 'TRANEXAMIC ACID (TXA)',
          dose: {
            drug: 'Tranexamic Acid',
            dosePerKg: 15,
            unit: 'mg',
            maxDose: 1000,
            route: 'IV over 10 minutes',
            preparation: 'Give within 3 hours of injury. Follow with 2 mg/kg/hr infusion for 8 hours.',
          },
          detail: 'Give EARLY. Reduces mortality in hemorrhagic trauma. Most effective within 1 hour.',
          critical: true,
        },
        {
          id: 'ht_fluid',
          action: 'FLUID RESUSCITATION: 20 mL/kg',
          dose: {
            drug: 'Normal Saline 0.9%',
            dosePerKg: 20,
            unit: 'mL',
            route: 'IV rapid push',
            preparation: 'Permissive hypotension: target systolic 80-90 mmHg (not normal). Avoid over-resuscitation.',
            frequency: 'Max 40 mL/kg crystalloid, then switch to blood',
          },
          timer: 300,
          reassess: 'Is perfusion improving?',
          escalateIf: 'Still hypotensive after 40 mL/kg → give blood products',
          critical: true,
        },
        {
          id: 'ht_blood',
          action: 'BLOOD PRODUCTS',
          dose: {
            drug: 'Packed Red Blood Cells',
            dosePerKg: 10,
            unit: 'mL',
            route: 'IV',
            preparation: 'O-negative if crossmatch unavailable. Consider massive transfusion protocol: 1:1:1 ratio (pRBC:FFP:platelets).',
          },
          detail: 'Switch to blood early. Don\'t wait for lab results in active hemorrhage.',
          critical: true,
        },
        {
          id: 'ht_surgery',
          action: 'SURGICAL CONSULTATION',
          detail: 'If hemorrhage not controlled with direct pressure → surgical intervention needed. Activate trauma team/surgical team.',
          critical: true,
        },
      ],
    },
  ],
  defaultSteps: [
    // Non-hemorrhagic trauma (blunt, no active bleeding)
    {
      id: 'tr_cspine',
      action: 'C-SPINE IMMOBILIZATION',
      detail: 'Manual in-line stabilization. Collar if available. Assume injury until cleared.',
      critical: true,
    },
    {
      id: 'tr_airway',
      action: 'AIRWAY: Jaw thrust (NO head tilt)',
      detail: 'Maintain C-spine. Suction if needed. Intubate if GCS ≤ 8.',
      critical: true,
    },
    {
      id: 'tr_breathing',
      action: 'ASSESS BREATHING',
      detail: 'Look: chest wall movement, symmetry, wounds. Listen: air entry bilaterally. Feel: tracheal position, crepitus. Tension pneumothorax? → needle decompress.',
      reassess: 'Is there a tension pneumothorax?',
      critical: true,
    },
    {
      id: 'tr_o2',
      action: 'HIGH-FLOW OXYGEN',
      detail: 'Non-rebreather at 15 L/min.',
    },
    {
      id: 'tr_circulation',
      action: 'ASSESS CIRCULATION',
      detail: 'Check pulse, cap refill, BP. Look for signs of internal bleeding: abdominal distension, pelvic instability, long bone deformity.',
      critical: true,
    },
    {
      id: 'tr_access',
      action: 'IV ACCESS',
      detail: '2 large bore IVs. Draw bloods: crossmatch, Hb, coags.',
    },
    {
      id: 'tr_disability',
      action: 'ASSESS DISABILITY',
      detail: 'GCS/AVPU. Pupils: size, reactivity, symmetry. Blood glucose. Lateralizing signs.',
      critical: true,
    },
    {
      id: 'tr_exposure',
      action: 'EXPOSURE: Full examination',
      detail: 'Log roll (maintain C-spine). Check back, perineum. Temperature — prevent hypothermia (warm blankets, warm fluids).',
    },
    {
      id: 'tr_imaging',
      action: 'IMAGING',
      detail: 'Trauma series: CXR, pelvis XR, FAST ultrasound. CT head/C-spine if indicated. Do NOT delay resuscitation for imaging.',
    },
  ],
};
