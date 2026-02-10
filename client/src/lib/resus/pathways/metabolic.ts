import type { Pathway } from '../stateMachine';

export const metabolicPathway: Pathway = {
  id: 'metabolic',
  name: 'DKA / Metabolic Emergency',
  icon: '🔬',
  description: 'Vomiting, deep breathing, high glucose',
  clarifyingQuestions: [
    {
      id: 'glucose_level',
      text: 'What is the blood glucose?',
      options: [
        { label: 'HIGH (>14 mmol/L / 250 mg/dL)', value: 'high' },
        { label: 'LOW (<3 mmol/L / 54 mg/dL)', value: 'low' },
        { label: 'NORMAL or UNKNOWN', value: 'normal' },
      ],
    },
  ],
  subPathways: [
    {
      id: 'dka',
      name: 'Diabetic Ketoacidosis',
      matchCondition: (answers) => answers.glucose_level === 'high',
      steps: [
        {
          id: 'dka_o2',
          action: 'OXYGEN IF NEEDED',
          detail: 'Monitor SpO2. Give O2 if < 94%. Kussmaul breathing is compensatory — do NOT intubate for this alone.',
          critical: true,
        },
        {
          id: 'dka_access',
          action: 'IV ACCESS - 2 LINES',
          detail: 'One for fluids, one for insulin. Draw bloods: glucose, ketones, pH/gas, electrolytes, urea.',
          critical: true,
        },
        {
          id: 'dka_fluid_bolus',
          action: 'FLUID BOLUS ONLY IF SHOCKED',
          dose: {
            drug: 'Normal Saline 0.9%',
            dosePerKg: 10,
            unit: 'mL',
            route: 'IV over 30-60 minutes',
            preparation: 'ONLY if signs of shock (poor perfusion, hypotension). Max 10 mL/kg per bolus. Can repeat x1.',
          },
          detail: 'CAUTION: Aggressive fluids increase cerebral edema risk. Only bolus if hemodynamically unstable.',
          critical: true,
        },
        {
          id: 'dka_maintenance',
          action: 'START MAINTENANCE FLUIDS',
          dose: {
            drug: 'Normal Saline 0.9%',
            dosePerKg: 0,
            unit: 'mL/hr',
            route: 'IV',
            preparation: 'Calculate: Maintenance + deficit replacement over 48 hours. Deficit = degree dehydration × weight × 10. Subtract any boluses given. Use 0.9% NaCl initially, add KCl 40 mmol/L once K+ known and patient passing urine.',
          },
          detail: 'Rehydrate SLOWLY over 48 hours. Rapid rehydration increases cerebral edema risk (ISPAD guidelines).',
          critical: true,
        },
        {
          id: 'dka_insulin',
          action: 'START INSULIN INFUSION',
          dose: {
            drug: 'Regular Insulin',
            dosePerKg: 0.05,
            unit: 'units/kg/hr',
            route: 'IV continuous infusion',
            preparation: 'Start at 0.05-0.1 units/kg/hr. Do NOT bolus. Start 1-2 hours AFTER fluids begun.',
            frequency: 'Adjust to drop glucose by 3-5 mmol/L per hour (max)',
          },
          detail: 'Do NOT start insulin before fluids. Do NOT bolus insulin. Target glucose drop: 3-5 mmol/L/hr. If glucose drops too fast → reduce rate, add dextrose.',
          critical: true,
        },
        {
          id: 'dka_potassium',
          action: 'REPLACE POTASSIUM',
          dose: {
            drug: 'Potassium Chloride (KCl)',
            dosePerKg: 40,
            unit: 'mmol/L',
            route: 'IV (add to maintenance fluids)',
            preparation: 'K+ < 3.5: 40 mmol/L. K+ 3.5-5.5: 20 mmol/L. K+ > 5.5: hold KCl. Check K+ every 1-2 hours.',
          },
          detail: 'Insulin drives K+ into cells. ALL DKA patients are total body K+ depleted even if serum K+ is normal/high.',
          critical: true,
        },
        {
          id: 'dka_monitor',
          action: 'HOURLY MONITORING',
          detail: 'Every hour: glucose, neuro status (GCS). Every 2 hours: blood gas, electrolytes, ketones. Watch for cerebral edema: headache, bradycardia, hypertension, decreased GCS, pupil changes.',
          timer: 3600,
          reassess: 'Check glucose, ketones, pH, electrolytes, neuro status',
          critical: true,
        },
        {
          id: 'dka_cerebral_edema',
          action: 'IF CEREBRAL EDEMA SUSPECTED',
          dose: {
            drug: 'Hypertonic Saline 3%',
            dosePerKg: 5,
            unit: 'mL',
            route: 'IV over 10-15 minutes',
            preparation: 'Alternative: Mannitol 0.5-1 g/kg IV over 20 min. Elevate head 30°. Reduce IV fluids by 1/3. Call neurosurgery.',
          },
          detail: 'EMERGENCY: If GCS drops ≥2 points, new headache, bradycardia, hypertension, pupil changes → treat immediately. Do NOT wait for imaging.',
          critical: true,
        },
      ],
    },
    {
      id: 'hypoglycemia',
      name: 'Severe Hypoglycemia',
      matchCondition: (answers) => answers.glucose_level === 'low',
      steps: [
        {
          id: 'hypo_dextrose',
          action: 'GIVE DEXTROSE IMMEDIATELY',
          dose: {
            drug: 'Dextrose 10%',
            dosePerKg: 5,
            unit: 'mL',
            route: 'IV',
            preparation: 'D10W: 2-5 mL/kg IV push. If no IV: Glucagon IM (< 25kg: 0.5mg, ≥25kg: 1mg).',
          },
          detail: 'Treat immediately. Do NOT wait for lab confirmation if symptomatic.',
          critical: true,
        },
        {
          id: 'hypo_recheck',
          action: 'RECHECK GLUCOSE IN 15 MINUTES',
          timer: 900,
          reassess: 'Is glucose > 4 mmol/L (72 mg/dL)?',
          escalateIf: 'Still < 3 mmol/L → repeat dextrose bolus',
          critical: true,
        },
        {
          id: 'hypo_maintenance',
          action: 'START DEXTROSE INFUSION',
          dose: {
            drug: 'Dextrose 10%',
            dosePerKg: 0,
            unit: 'mL/hr',
            route: 'IV continuous',
            preparation: 'Run D10W at maintenance rate. Target glucose 4-8 mmol/L.',
          },
          detail: 'Prevent rebound hypoglycemia. Feed as soon as safe to do so.',
        },
        {
          id: 'hypo_cause',
          action: 'INVESTIGATE CAUSE',
          detail: 'Neonatal: sepsis, inborn errors of metabolism. Child: insulin overdose, adrenal insufficiency, liver failure, sepsis, poisoning (alcohol, oral hypoglycemics). Send critical sample BEFORE correcting if possible.',
        },
      ],
    },
  ],
  defaultSteps: [
    {
      id: 'met_glucose',
      action: 'CHECK BLOOD GLUCOSE',
      detail: 'Point-of-care glucose test. This determines the next step.',
      critical: true,
    },
    {
      id: 'met_gas',
      action: 'GET BLOOD GAS AND ELECTROLYTES',
      detail: 'Check pH, bicarbonate, potassium, sodium, lactate. Guides diagnosis and treatment.',
      critical: true,
    },
    {
      id: 'met_support',
      action: 'SUPPORTIVE CARE',
      detail: 'IV access. Monitor. Oxygen if needed. Treat specific cause once identified.',
    },
  ],
};
