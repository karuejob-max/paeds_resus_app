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
          detail: 'Use age-appropriate airway manoeuvres while protecting the cervical spine; suction blood/vomit. Escalate advanced airway only for inadequate airway protection or ventilation and only with appropriate expertise/equipment.',
          critical: true,
        },
        {
          id: 'ht_o2',
          action: 'HIGH-FLOW OXYGEN',
          detail: 'Give age-, size-, and severity-appropriate oxygen/ventilatory support if hypoxaemic and titrate to the selected clinical target.',
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
            preparation: 'Use only the selected age-, weight-, timing-, indication-, and local haemorrhage-protocol regimen; do not infer an adult infusion schedule.',
          },
          detail: 'Consider TXA only when the age-, weight-, timing-, injury-, contraindication-, and local haemorrhage-protocol criteria are met. Do not use an adult regimen for a child or neonate.',
          critical: true,
        },
        {
          id: 'ht_fluid',
          action: 'CONTROLLED FLUID/BLOOD RESUSCITATION',
          dose: {
            drug: 'Normal Saline 0.9%',
            dosePerKg: 0,
            unit: 'mL',
            route: 'IV/IO per protocol',
            preparation: 'Use small, age-, injury-, perfusion-, and capability-appropriate aliquots or blood products under a haemorrhage protocol. Do not apply a universal permissive-hypotension target to children or neonates.',
            frequency: 'Reassess after every aliquot; escalate early for blood, surgery, or higher-level care when indicated',
          },
          timer: 300,
          reassess: 'Is perfusion improving?',
          escalateIf: 'If perfusion remains poor or haemorrhage continues, escalate promptly under the age- and setting-specific haemorrhage/transfusion protocol.',
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
            preparation: 'Use emergency blood or component therapy only under the local age- and setting-specific transfusion protocol with compatibility, warming, monitoring, and senior oversight.',
          },
          detail: 'Activate the local haemorrhage/transfusion protocol early when indicated. Product choice, dose, ratio, compatibility, warming, and monitoring must be age- and setting-specific; do not use a universal ratio or emergency blood assumption.',
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
      detail: 'Use manual in-line stabilization and an age-/mechanism-appropriate spinal-protection plan until clinically cleared by a trained clinician; avoid unnecessary movement.',
      critical: true,
    },
    {
      id: 'tr_airway',
      action: 'AIRWAY: Jaw thrust (NO head tilt)',
      detail: 'Maintain spinal protection and suction if needed. Escalate the airway for inability to maintain patency, protect the airway, or ventilate—not from an isolated age-generalized GCS cutoff.',
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
      detail: 'Give age-, size-, and severity-appropriate oxygen/ventilatory support if hypoxaemic and titrate to the selected clinical target.',
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
      detail: 'AVPU or age-appropriate neurological assessment; pupils, glucose, and lateralizing signs. Use a validated age-appropriate GCS when a formal score is required—do not substitute a simplified score.',
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
