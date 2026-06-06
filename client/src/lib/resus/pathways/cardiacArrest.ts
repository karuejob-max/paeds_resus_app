import type { Pathway } from '../stateMachine';

export const cardiacArrestPathway: Pathway = {
  id: 'cardiac_arrest',
  name: 'Cardiac Arrest',
  icon: '🫀',
  description: 'No breathing or no pulse detected',
  clarifyingQuestions: [],
  subPathways: [
    {
      id: 'no_breathing',
      name: 'Apnea - No Breathing',
      matchCondition: () => false, // resolved by triage
      steps: [
        {
          id: 'ca_open_airway',
          action: 'OPEN AIRWAY',
          detail: 'Head tilt-chin lift. If trauma suspected, use jaw thrust only.',
          critical: true,
        },
        {
          id: 'ca_initial_ventilations',
          action: 'GIVE 5 INITIAL VENTILATIONS',
          detail: 'Use bag-valve-mask. Watch for chest rise. ~1 second per breath.',
          critical: true,
        },
        {
          id: 'ca_check_pulse_after',
          action: 'CHECK PULSE NOW',
          detail: 'Feel for carotid (child) or brachial (infant) pulse for 10 seconds maximum.',
          reassess: 'Is there a pulse?',
          escalateIf: 'No pulse detected',
          critical: true,
        },
      ],
    },
    {
      id: 'no_pulse',
      name: 'Pulseless - Full CPR',
      matchCondition: () => false, // resolved by triage
      steps: [
        {
          id: 'cpr_start',
          action: 'START CHEST COMPRESSIONS',
          detail: 'Push hard, push fast. Rate: 100-120/min. Depth: at least 1/3 of chest depth. Full recoil between compressions.',
          critical: true,
        },
        {
          id: 'cpr_ratio',
          action: 'CPR RATIO: 15 compressions : 2 breaths',
          detail: 'If alone: 30:2. If two rescuers: 15:2. Minimize interruptions. Switch compressor every 2 minutes.',
          timer: 120,
          reassess: 'Check rhythm after 2 minutes of CPR',
          critical: true,
        },
        {
          id: 'cpr_access',
          action: 'GET IV/IO ACCESS',
          detail: 'IO is preferred if IV not immediately available. Proximal tibia (child) or distal femur (infant).',
          critical: true,
        },
        {
          id: 'cpr_epinephrine',
          action: 'GIVE EPINEPHRINE (ADRENALINE)',
          dose: {
            drug: 'Epinephrine 1:10,000',
            dosePerKg: 0.01,
            unit: 'mg',
            maxDose: 1,
            route: 'IV/IO',
            concentration: '1:10,000 (0.1 mg/mL)',
            preparation: 'Draw up 0.1 mL/kg of 1:10,000 solution',
            frequency: 'AHA 2025: as soon as feasible after 2nd shock attempt, then every 3-5 minutes',
          },
          critical: true,
        },
        {
          id: 'cpr_rhythm_check',
          action: 'CHECK RHYTHM - Is it shockable?',
          detail: 'VF or pulseless VT = SHOCKABLE. Asystole or PEA = NON-SHOCKABLE. Continue CPR while analyzing.',
          reassess: 'Is the rhythm shockable (VF/pVT)?',
          escalateIf: 'Shockable rhythm detected',
        },
        {
          id: 'cpr_shock',
          action: 'DEFIBRILLATE: 4 J/kg',
          dose: {
            drug: 'Defibrillation',
            dosePerKg: 4,
            unit: 'J',
            maxDose: 360,
            route: 'Defibrillator pads',
            preparation: 'Use pediatric pads if <10kg, adult pads if >10kg',
          },
          detail: 'AHA 2025: 2 J/kg first shock, 4 J/kg second shock, then max 10 J/kg or 360 J. Immediately resume CPR after shock.',
          critical: true,
        },
        {
          id: 'cpr_amiodarone',
          action: 'GIVE AMIODARONE (if shockable rhythm persists)',
          dose: {
            drug: 'Amiodarone',
            dosePerKg: 5,
            unit: 'mg',
            maxDose: 300,
            route: 'IV/IO',
            preparation: 'Dilute in 5% dextrose. Give as bolus.',
            frequency: 'Can repeat x2 (max 3 doses total: 15 mg/kg)',
          },
          detail: 'Give after 3rd shock. Can repeat after 5th shock.',
        },
        {
          id: 'cpr_reversible',
          action: 'TREAT REVERSIBLE CAUSES (4Hs and 4Ts)',
          detail: 'Hypoxia → ventilate. Hypovolemia → fluid bolus. Hypothermia → warm. Hypo/Hyperkalemia → check electrolytes. Tension pneumothorax → needle decompress. Tamponade → pericardiocentesis. Toxins → antidote. Thrombosis → consider thrombolytics.',
          critical: true,
        },
        {
          id: 'cpr_continue',
          action: 'CONTINUE CPR CYCLES',
          detail: '2 minutes CPR → rhythm check → epinephrine every 3-5 min → shock if shockable → repeat. Switch compressor every 2 minutes.',
          timer: 120,
          reassess: 'Check rhythm and pulse. Any ROSC?',
        },
      ],
    },
  ],
  defaultSteps: [
    // This is the fallback if somehow we get here without a sub-pathway
    {
      id: 'ca_default_cpr',
      action: 'START CPR: 15 compressions : 2 breaths',
      detail: 'Push hard, push fast. Rate 100-120/min. Minimize interruptions.',
      critical: true,
    },
    {
      id: 'ca_default_epi',
      action: 'GIVE EPINEPHRINE',
      dose: {
        drug: 'Epinephrine 1:10,000',
        dosePerKg: 0.01,
        unit: 'mg',
        maxDose: 1,
        route: 'IV/IO',
        frequency: 'Every 3-5 minutes',
      },
      critical: true,
    },
  ],
};
