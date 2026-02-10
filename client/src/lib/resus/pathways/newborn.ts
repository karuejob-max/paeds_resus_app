import type { Pathway } from '../stateMachine';

export const newbornPathway: Pathway = {
  id: 'newborn',
  name: 'Newborn Emergency',
  icon: '👶',
  description: 'Birth, neonatal distress, prematurity',
  clarifyingQuestions: [
    {
      id: 'breathing_effort',
      text: 'Is the newborn breathing or crying?',
      options: [
        { label: 'YES - Breathing/crying', value: 'yes' },
        { label: 'NO - Not breathing', value: 'no' },
        { label: 'GASPING only', value: 'gasping' },
      ],
    },
  ],
  subPathways: [
    {
      id: 'neonatal_resus',
      name: 'Neonatal Resuscitation (NRP)',
      matchCondition: (answers) => answers.breathing_effort === 'no' || answers.breathing_effort === 'gasping',
      steps: [
        {
          id: 'nr_warm',
          action: 'WARM, DRY, STIMULATE',
          detail: 'Place under radiant warmer. Dry thoroughly. Stimulate by rubbing back/flicking feet. Remove wet linen. Cover with warm dry towel. Plastic wrap for <32 weeks.',
          critical: true,
        },
        {
          id: 'nr_position',
          action: 'POSITION AIRWAY: Neutral "sniffing" position',
          detail: 'Slight neck extension. Shoulder roll if needed. Suction mouth then nose ONLY if obstructed (do NOT routine suction).',
          critical: true,
        },
        {
          id: 'nr_assess30',
          action: 'ASSESS AT 30 SECONDS: Breathing? Heart rate?',
          detail: 'If breathing and HR > 100: observe. If not breathing or HR < 100: start PPV.',
          timer: 30,
          reassess: 'Is the baby breathing? Is HR > 100?',
          escalateIf: 'Not breathing or HR < 100',
          critical: true,
        },
        {
          id: 'nr_ppv',
          action: 'POSITIVE PRESSURE VENTILATION (PPV)',
          detail: 'BVM with room air (21% O2 for term, 21-30% for preterm). Rate: 40-60 breaths/min. Watch for chest rise. MR SOPA if not rising: Mask adjust, Reposition, Suction, Open mouth, Pressure increase, Airway alternative.',
          critical: true,
        },
        {
          id: 'nr_assess60',
          action: 'ASSESS AFTER 30 SECONDS OF PPV',
          detail: 'Check HR by auscultation or pulse oximetry. If HR > 100: continue PPV until spontaneous breathing. If HR 60-100: continue PPV, consider O2. If HR < 60: START CHEST COMPRESSIONS.',
          timer: 30,
          reassess: 'What is the heart rate?',
          escalateIf: 'HR < 60 despite effective PPV',
          critical: true,
        },
        {
          id: 'nr_compressions',
          action: 'CHEST COMPRESSIONS: 3:1 ratio',
          detail: 'Two-thumb technique (preferred). Compress lower 1/3 of sternum. Depth: 1/3 of AP diameter. 3 compressions : 1 breath. Rate: 120 events/min (90 compressions + 30 breaths). Increase O2 to 100%.',
          critical: true,
        },
        {
          id: 'nr_uvc',
          action: 'UMBILICAL VENOUS CATHETER (UVC)',
          detail: 'If IV access needed: UVC is fastest. Insert into umbilical vein, advance until blood return (usually 2-4 cm in term).',
          critical: true,
        },
        {
          id: 'nr_epinephrine',
          action: 'EPINEPHRINE IF HR STILL < 60',
          dose: {
            drug: 'Epinephrine 1:10,000',
            dosePerKg: 0.02,
            unit: 'mg',
            maxDose: 0.03,
            route: 'IV/UVC (or 0.1 mg/kg via ETT)',
            concentration: '1:10,000 (0.1 mg/mL)',
            preparation: 'IV: 0.1-0.3 mL/kg of 1:10,000. ETT: 0.5-1 mL/kg of 1:10,000.',
            frequency: 'Repeat every 3-5 minutes',
          },
          detail: 'Give via UVC preferred. ETT route requires higher dose. Continue CPR.',
          critical: true,
        },
        {
          id: 'nr_volume',
          action: 'VOLUME EXPANSION IF BLOOD LOSS',
          dose: {
            drug: 'Normal Saline or O-neg blood',
            dosePerKg: 10,
            unit: 'mL',
            route: 'IV/UVC over 5-10 minutes',
            preparation: 'Use if suspected blood loss (placental abruption, cord accident). Can repeat.',
          },
          detail: 'Consider if poor response to resuscitation and history suggests blood loss.',
        },
      ],
    },
    {
      id: 'neonatal_breathing',
      name: 'Breathing Newborn - Supportive Care',
      matchCondition: (answers) => answers.breathing_effort === 'yes',
      steps: [
        {
          id: 'nb_warm',
          action: 'KEEP WARM AND DRY',
          detail: 'Dry thoroughly. Skin-to-skin with mother if stable. Hat on head.',
          critical: true,
        },
        {
          id: 'nb_assess',
          action: 'ASSESS: Color, tone, breathing effort',
          detail: 'Normal: pink centrally, good tone, regular breathing. Concerning: grunting, nasal flaring, retractions, cyanosis.',
          reassess: 'Is the newborn showing signs of distress?',
        },
        {
          id: 'nb_o2',
          action: 'OXYGEN IF SpO2 LOW FOR AGE',
          detail: 'Target SpO2: 1 min: 60-65%. 2 min: 65-70%. 3 min: 70-75%. 5 min: 80-85%. 10 min: 85-95%. Do NOT hyperoxgenate.',
        },
        {
          id: 'nb_glucose',
          action: 'CHECK GLUCOSE AT 30-60 MINUTES',
          dose: {
            drug: 'Dextrose 10%',
            dosePerKg: 2,
            unit: 'mL',
            route: 'IV',
            preparation: 'If glucose < 2.6 mmol/L: give D10W 2 mL/kg IV. Feed if able.',
          },
          detail: 'Neonatal hypoglycemia is common. Check early, especially if preterm, SGA, or diabetic mother.',
        },
        {
          id: 'nb_monitor',
          action: 'MONITOR AND SUPPORT',
          detail: 'Continuous pulse oximetry. Temperature. Feeding support. Watch for deterioration.',
        },
      ],
    },
  ],
  defaultSteps: [],
};
