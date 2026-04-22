/**
 * Voice Command Schema for ResusGPS
 * 
 * Defines all available voice commands and their mappings to clinical actions
 * Organized by emergency type and clinical workflow
 */

export interface VoiceCommandDefinition {
  phrases: string[];
  action: string;
  category: 'intervention' | 'assessment' | 'navigation' | 'system';
  emergencyTypes: string[];
  requiredParameters?: string[];
  description: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
}

export const VOICE_COMMAND_SCHEMA: Record<string, VoiceCommandDefinition> = {
  // ============ CPR INTERVENTIONS ============
  'epi_given': {
    phrases: ['epi given', 'epinephrine', 'epi', 'give epi', 'administer epi'],
    action: 'recordMedication',
    category: 'intervention',
    emergencyTypes: ['cpr', 'cardiac_arrest'],
    requiredParameters: ['medicationName', 'timestamp'],
    description: 'Record epinephrine administration during CPR',
    priority: 'critical',
  },

  'shock_delivered': {
    phrases: ['shock delivered', 'shock', 'delivered shock', 'give shock'],
    action: 'recordShock',
    category: 'intervention',
    emergencyTypes: ['cpr', 'cardiac_arrest'],
    requiredParameters: ['energy', 'timestamp'],
    description: 'Record defibrillation shock delivery',
    priority: 'critical',
  },

  'compressions_started': {
    phrases: ['compressions started', 'start compressions', 'compressions', 'begin compressions'],
    action: 'startCompressions',
    category: 'intervention',
    emergencyTypes: ['cpr', 'cardiac_arrest'],
    requiredParameters: ['timestamp'],
    description: 'Record start of chest compressions',
    priority: 'critical',
  },

  'compressions_stopped': {
    phrases: ['stop compressions', 'compressions stopped', 'pause compressions'],
    action: 'stopCompressions',
    category: 'intervention',
    emergencyTypes: ['cpr', 'cardiac_arrest'],
    requiredParameters: ['timestamp'],
    description: 'Record cessation of chest compressions',
    priority: 'critical',
  },

  'amiodarone_given': {
    phrases: ['amiodarone', 'amio', 'give amiodarone', 'amiodarone given'],
    action: 'recordMedication',
    category: 'intervention',
    emergencyTypes: ['cpr', 'cardiac_arrest'],
    requiredParameters: ['medicationName', 'timestamp'],
    description: 'Record amiodarone administration',
    priority: 'high',
  },

  // ============ RESPIRATORY INTERVENTIONS ============
  'oxygen_started': {
    phrases: ['oxygen on', 'oxygen', 'start oxygen', 'give oxygen'],
    action: 'recordOxygenTherapy',
    category: 'intervention',
    emergencyTypes: ['status_asthmaticus', 'bronchiolitis', 'pneumonia', 'ards', 'upper_airway'],
    requiredParameters: ['oxygenFlow', 'timestamp'],
    description: 'Record oxygen therapy initiation',
    priority: 'critical',
  },

  'intubation_done': {
    phrases: ['intubated', 'intubation', 'tube placed', 'intubate'],
    action: 'recordIntubation',
    category: 'intervention',
    emergencyTypes: ['status_asthmaticus', 'bronchiolitis', 'pneumonia', 'ards', 'upper_airway'],
    requiredParameters: ['tubeSize', 'timestamp'],
    description: 'Record endotracheal intubation',
    priority: 'critical',
  },

  'bag_mask_ventilation': {
    phrases: ['bag mask', 'bvm', 'bag ventilation', 'manual ventilation'],
    action: 'recordBagMask',
    category: 'intervention',
    emergencyTypes: ['status_asthmaticus', 'bronchiolitis', 'pneumonia', 'ards', 'upper_airway'],
    requiredParameters: ['timestamp'],
    description: 'Record bag-mask ventilation',
    priority: 'high',
  },

  'steroids_given': {
    phrases: ['steroids given', 'steroids', 'dexamethasone', 'dex', 'give steroids'],
    action: 'recordMedication',
    category: 'intervention',
    emergencyTypes: ['status_asthmaticus', 'bronchiolitis', 'upper_airway'],
    requiredParameters: ['medicationName', 'dose', 'timestamp'],
    description: 'Record steroid administration',
    priority: 'high',
  },

  'nebulizer_given': {
    phrases: ['nebulizer', 'neb', 'nebulized', 'give neb', 'albuterol'],
    action: 'recordNebulizer',
    category: 'intervention',
    emergencyTypes: ['status_asthmaticus', 'bronchiolitis'],
    requiredParameters: ['medication', 'timestamp'],
    description: 'Record nebulized medication administration',
    priority: 'high',
  },

  // ============ ANAPHYLAXIS INTERVENTIONS ============
  'epi_im': {
    phrases: ['epi im', 'epinephrine im', 'epi intramuscular', 'im epi'],
    action: 'recordMedication',
    category: 'intervention',
    emergencyTypes: ['anaphylaxis'],
    requiredParameters: ['medicationName', 'dose', 'timestamp'],
    description: 'Record intramuscular epinephrine for anaphylaxis',
    priority: 'critical',
  },

  'antihistamine_given': {
    phrases: ['antihistamine', 'benadryl', 'diphenhydramine', 'give antihistamine'],
    action: 'recordMedication',
    category: 'intervention',
    emergencyTypes: ['anaphylaxis'],
    requiredParameters: ['medicationName', 'dose', 'timestamp'],
    description: 'Record antihistamine administration',
    priority: 'high',
  },

  'iv_access': {
    phrases: ['iv access', 'iv in', 'line placed', 'iv placed'],
    action: 'recordIVAccess',
    category: 'intervention',
    emergencyTypes: ['anaphylaxis', 'septic_shock', 'dka', 'trauma'],
    requiredParameters: ['gauge', 'timestamp'],
    description: 'Record IV access establishment',
    priority: 'high',
  },

  // ============ SEPTIC SHOCK INTERVENTIONS ============
  'fluids_started': {
    phrases: ['fluids started', 'fluids', 'start fluids', 'give fluids'],
    action: 'recordFluidResuscitation',
    category: 'intervention',
    emergencyTypes: ['septic_shock', 'trauma'],
    requiredParameters: ['fluidType', 'volume', 'timestamp'],
    description: 'Record fluid resuscitation initiation',
    priority: 'critical',
  },

  'antibiotics_given': {
    phrases: ['antibiotics', 'antibiotics given', 'give antibiotics', 'start antibiotics'],
    action: 'recordMedication',
    category: 'intervention',
    emergencyTypes: ['septic_shock'],
    requiredParameters: ['medicationName', 'dose', 'timestamp'],
    description: 'Record antibiotic administration',
    priority: 'critical',
  },

  'vasopressor_started': {
    phrases: ['vasopressor', 'norepinephrine', 'dopamine', 'start vasopressor'],
    action: 'recordVasopressor',
    category: 'intervention',
    emergencyTypes: ['septic_shock'],
    requiredParameters: ['medicationName', 'timestamp'],
    description: 'Record vasopressor initiation',
    priority: 'high',
  },

  // ============ DKA INTERVENTIONS ============
  'insulin_started': {
    phrases: ['insulin started', 'insulin', 'start insulin', 'give insulin'],
    action: 'recordMedication',
    category: 'intervention',
    emergencyTypes: ['dka'],
    requiredParameters: ['medicationName', 'dose', 'timestamp'],
    description: 'Record insulin administration for DKA',
    priority: 'critical',
  },

  'potassium_given': {
    phrases: ['potassium', 'potassium given', 'give potassium', 'k plus'],
    action: 'recordMedication',
    category: 'intervention',
    emergencyTypes: ['dka'],
    requiredParameters: ['medicationName', 'dose', 'timestamp'],
    description: 'Record potassium supplementation',
    priority: 'high',
  },

  // ============ STATUS EPILEPTICUS INTERVENTIONS ============
  'benzodiazepine_given': {
    phrases: ['benzodiazepine', 'lorazepam', 'ativan', 'midazolam', 'give benzo'],
    action: 'recordMedication',
    category: 'intervention',
    emergencyTypes: ['status_epilepticus'],
    requiredParameters: ['medicationName', 'dose', 'timestamp'],
    description: 'Record benzodiazepine administration',
    priority: 'critical',
  },

  'second_line_antiepileptic': {
    phrases: ['levetiracetam', 'keppra', 'fosphenytoin', 'phenytoin', 'second line'],
    action: 'recordMedication',
    category: 'intervention',
    emergencyTypes: ['status_epilepticus'],
    requiredParameters: ['medicationName', 'dose', 'timestamp'],
    description: 'Record second-line antiepileptic administration',
    priority: 'high',
  },

  // ============ TRAUMA INTERVENTIONS ============
  'tourniquet_applied': {
    phrases: ['tourniquet', 'tourniquet applied', 'apply tourniquet'],
    action: 'recordTourniquet',
    category: 'intervention',
    emergencyTypes: ['trauma'],
    requiredParameters: ['location', 'timestamp'],
    description: 'Record tourniquet application',
    priority: 'critical',
  },

  'hemorrhage_control': {
    phrases: ['hemorrhage control', 'bleeding controlled', 'stop bleeding'],
    action: 'recordHemorrhageControl',
    category: 'intervention',
    emergencyTypes: ['trauma'],
    requiredParameters: ['method', 'timestamp'],
    description: 'Record hemorrhage control measure',
    priority: 'critical',
  },

  // ============ ASSESSMENT COMMANDS ============
  'check_pulse': {
    phrases: ['check pulse', 'pulse check', 'palpate pulse', 'feel pulse'],
    action: 'checkPulse',
    category: 'assessment',
    emergencyTypes: ['cpr', 'cardiac_arrest', 'trauma', 'septic_shock'],
    requiredParameters: ['timestamp'],
    description: 'Perform pulse check',
    priority: 'critical',
  },

  'check_breathing': {
    phrases: ['check breathing', 'breathing check', 'assess breathing'],
    action: 'checkBreathing',
    category: 'assessment',
    emergencyTypes: ['cpr', 'cardiac_arrest', 'status_asthmaticus', 'bronchiolitis', 'pneumonia', 'ards', 'upper_airway'],
    requiredParameters: ['timestamp'],
    description: 'Perform breathing assessment',
    priority: 'critical',
  },

  'check_airway': {
    phrases: ['check airway', 'airway check', 'assess airway'],
    action: 'checkAirway',
    category: 'assessment',
    emergencyTypes: ['cpr', 'cardiac_arrest', 'trauma', 'upper_airway'],
    requiredParameters: ['timestamp'],
    description: 'Perform airway assessment',
    priority: 'critical',
  },

  'check_circulation': {
    phrases: ['check circulation', 'circulation check', 'assess circulation'],
    action: 'checkCirculation',
    category: 'assessment',
    emergencyTypes: ['cpr', 'cardiac_arrest', 'trauma', 'septic_shock'],
    requiredParameters: ['timestamp'],
    description: 'Perform circulation assessment',
    priority: 'critical',
  },

  'check_disability': {
    phrases: ['check disability', 'disability check', 'neuro check', 'assess neuro'],
    action: 'checkDisability',
    category: 'assessment',
    emergencyTypes: ['cpr', 'cardiac_arrest', 'trauma', 'status_epilepticus'],
    requiredParameters: ['timestamp'],
    description: 'Perform neurological assessment',
    priority: 'high',
  },

  'rhythm_check': {
    phrases: ['check rhythm', 'rhythm check', 'rhythm', 'check monitor'],
    action: 'recordRhythmCheck',
    category: 'assessment',
    emergencyTypes: ['cpr', 'cardiac_arrest'],
    requiredParameters: ['rhythm', 'timestamp'],
    description: 'Perform cardiac rhythm check',
    priority: 'critical',
  },

  'shockable_rhythm': {
    phrases: ['shockable', 'vfib', 'pulseless vt', 'vf', 'vt'],
    action: 'recordRhythm',
    category: 'assessment',
    emergencyTypes: ['cpr', 'cardiac_arrest'],
    requiredParameters: ['rhythm', 'timestamp'],
    description: 'Identify shockable rhythm',
    priority: 'critical',
  },

  'non_shockable_rhythm': {
    phrases: ['asystole', 'pea', 'pulseless electrical activity', 'non shockable'],
    action: 'recordRhythm',
    category: 'assessment',
    emergencyTypes: ['cpr', 'cardiac_arrest'],
    requiredParameters: ['rhythm', 'timestamp'],
    description: 'Identify non-shockable rhythm',
    priority: 'critical',
  },

  // ============ NAVIGATION COMMANDS ============
  'next_step': {
    phrases: ['next', 'next step', 'continue', 'proceed'],
    action: 'navigateNext',
    category: 'navigation',
    emergencyTypes: [],
    description: 'Move to next step in workflow',
    priority: 'normal',
  },

  'previous_step': {
    phrases: ['back', 'previous', 'go back', 'previous step'],
    action: 'navigatePrevious',
    category: 'navigation',
    emergencyTypes: [],
    description: 'Move to previous step in workflow',
    priority: 'normal',
  },

  'home': {
    phrases: ['home', 'go home', 'main menu'],
    action: 'navigateHome',
    category: 'navigation',
    emergencyTypes: [],
    description: 'Navigate to home screen',
    priority: 'normal',
  },

  'view_summary': {
    phrases: ['summary', 'view summary', 'show summary'],
    action: 'viewSummary',
    category: 'navigation',
    emergencyTypes: [],
    description: 'View session summary',
    priority: 'normal',
  },

  // ============ SYSTEM COMMANDS ============
  'stop_listening': {
    phrases: ['stop listening', 'stop voice', 'stop', 'pause listening'],
    action: 'stopListening',
    category: 'system',
    emergencyTypes: [],
    description: 'Stop voice recognition',
    priority: 'normal',
  },

  'show_help': {
    phrases: ['help', 'voice help', 'show help', 'what can i say'],
    action: 'showHelp',
    category: 'system',
    emergencyTypes: [],
    description: 'Display available voice commands',
    priority: 'low',
  },

  'repeat_last': {
    phrases: ['repeat', 'say again', 'what was that'],
    action: 'repeatLast',
    category: 'system',
    emergencyTypes: [],
    description: 'Repeat last command',
    priority: 'low',
  },
};

export function getCommandsByEmergencyType(emergencyType: string): VoiceCommandDefinition[] {
  return Object.values(VOICE_COMMAND_SCHEMA).filter(cmd =>
    cmd.emergencyTypes.length === 0 || cmd.emergencyTypes.includes(emergencyType)
  );
}

export function getCommandsByCategory(category: 'intervention' | 'assessment' | 'navigation' | 'system'): VoiceCommandDefinition[] {
  return Object.values(VOICE_COMMAND_SCHEMA).filter(cmd => cmd.category === category);
}

export function getCommandsByPriority(priority: 'critical' | 'high' | 'normal' | 'low'): VoiceCommandDefinition[] {
  return Object.values(VOICE_COMMAND_SCHEMA).filter(cmd => cmd.priority === priority);
}

export function getAllPhrases(): string[] {
  const phrases: string[] = [];
  Object.values(VOICE_COMMAND_SCHEMA).forEach(cmd => {
    phrases.push(...cmd.phrases);
  });
  return phrases;
}
