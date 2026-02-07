// Tier 2 Emergencies Data (Remaining 46 conditions)
// Condensed format for rapid implementation

export const tier2ConditionsData = {
  // RENAL (4 conditions)
  acute_kidney_injury: {
    name: 'Acute Kidney Injury (AKI, Anuria)',
    keyIndicators: ['oliguria', 'anuria', 'elevated_creatinine', 'hyperkalemia', 'metabolic_acidosis'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 180,
  },
  hemolytic_uremic_syndrome: {
    name: 'Hemolytic Uremic Syndrome (HUS)',
    keyIndicators: ['bloody_diarrhea', 'anemia', 'thrombocytopenia', 'aki', 'pallor'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 240,
  },
  nephrotic_syndrome: {
    name: 'Nephrotic Syndrome (Severe, Hypovolemia)',
    keyIndicators: ['edema', 'hypoalbuminemia', 'proteinuria', 'hypotension'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 360,
  },
  renal_failure: {
    name: 'Renal Failure (Acute on Chronic)',
    keyIndicators: ['oliguria', 'hyperkalemia', 'metabolic_acidosis', 'uremia'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 240,
  },

  // ENDOCRINE (4 conditions)
  thyroid_storm: {
    name: 'Thyroid Storm (Thyrotoxicosis)',
    keyIndicators: ['extreme_tachycardia', 'hyperthermia', 'altered_mental_status', 'hypertension'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 180,
  },
  adrenal_crisis: {
    name: 'Adrenal Crisis (Addisonian Crisis)',
    keyIndicators: ['hypotension', 'hyponatremia', 'hyperkalemia', 'hypoglycemia', 'shock'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 120,
  },
  hypercalcemia: {
    name: 'Hypercalcemia (Severe, Symptomatic)',
    keyIndicators: ['altered_mental_status', 'arrhythmias', 'polyuria', 'constipation'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 360,
  },
  siadh: {
    name: 'SIADH (Hyponatremia, Seizures)',
    keyIndicators: ['hyponatremia', 'seizures', 'altered_mental_status', 'euvolemia'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 180,
  },

  // HEMATOLOGIC (4 conditions)
  sickle_cell_crisis: {
    name: 'Sickle Cell Crisis (Vaso-occlusive, Acute Chest Syndrome)',
    keyIndicators: ['severe_pain', 'hypoxia', 'fever', 'chest_pain', 'known_sickle_cell'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 240,
  },
  hemophilia_bleeding: {
    name: 'Hemophilia Bleeding (Intracranial, Joint)',
    keyIndicators: ['bleeding', 'known_hemophilia', 'head_trauma', 'joint_swelling'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 180,
  },
  itp: {
    name: 'ITP (Immune Thrombocytopenia, Severe Bleeding)',
    keyIndicators: ['petechiae', 'purpura', 'bleeding', 'thrombocytopenia'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 240,
  },
  leukemia_complications: {
    name: 'Leukemia Complications (Tumor Lysis, Hyperleukocytosis)',
    keyIndicators: ['hyperkalemia', 'hypercalcemia', 'aki', 'extreme_wbc', 'known_leukemia'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 180,
  },

  // TOXICOLOGIC (8 conditions)
  paracetamol_overdose: {
    name: 'Paracetamol (Acetaminophen) Overdose',
    keyIndicators: ['ingestion_history', 'nausea', 'vomiting', 'elevated_alt_ast'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 480, // 8 hours for NAC
  },
  salicylate_overdose: {
    name: 'Salicylate (Aspirin) Overdose',
    keyIndicators: ['tinnitus', 'tachypnea', 'metabolic_acidosis', 'altered_mental_status'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 240,
  },
  iron_overdose: {
    name: 'Iron Overdose',
    keyIndicators: ['vomiting', 'bloody_diarrhea', 'abdominal_pain', 'shock', 'ingestion_history'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 240,
  },
  carbon_monoxide_poisoning: {
    name: 'Carbon Monoxide Poisoning',
    keyIndicators: ['headache', 'confusion', 'cherry_red_skin', 'exposure_history'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 180,
  },
  organophosphate_poisoning: {
    name: 'Organophosphate Poisoning',
    keyIndicators: ['salivation', 'lacrimation', 'urination', 'miosis', 'bradycardia', 'exposure_history'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 120,
  },
  caustic_ingestion: {
    name: 'Caustic Ingestion (Acid/Alkali)',
    keyIndicators: ['oral_burns', 'drooling', 'dysphagia', 'chest_pain', 'ingestion_history'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 240,
  },
  tricyclic_overdose: {
    name: 'Tricyclic Antidepressant Overdose',
    keyIndicators: ['altered_mental_status', 'seizures', 'arrhythmias', 'widened_qrs'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 120,
  },
  beta_blocker_overdose: {
    name: 'Beta-blocker/Calcium Channel Blocker Overdose',
    keyIndicators: ['bradycardia', 'hypotension', 'altered_mental_status', 'hypoglycemia'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 180,
  },

  // TRAUMA (6 conditions)
  traumatic_brain_injury: {
    name: 'Traumatic Brain Injury (TBI, Severe)',
    keyIndicators: ['head_trauma', 'altered_mental_status', 'gcs_low', 'pupil_abnormalities'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 180,
  },
  spinal_cord_injury: {
    name: 'Spinal Cord Injury',
    keyIndicators: ['trauma', 'paralysis', 'sensory_loss', 'neurogenic_shock'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 240,
  },
  abdominal_trauma: {
    name: 'Abdominal Trauma (Solid Organ Injury)',
    keyIndicators: ['abdominal_trauma', 'abdominal_pain', 'distension', 'shock'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 180,
  },
  pelvic_fracture: {
    name: 'Pelvic Fracture (Hemorrhage)',
    keyIndicators: ['pelvic_trauma', 'pelvic_instability', 'shock', 'hematuria'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 120,
  },
  long_bone_fracture: {
    name: 'Long Bone Fracture (Fat Embolism)',
    keyIndicators: ['long_bone_fracture', 'hypoxia', 'petechiae', 'altered_mental_status'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 240,
  },
  crush_injury: {
    name: 'Crush Injury (Compartment Syndrome, Rhabdomyolysis)',
    keyIndicators: ['crush_mechanism', 'severe_pain', 'swelling', 'dark_urine', 'hyperkalemia'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 180,
  },

  // NEONATAL (6 conditions)
  necrotizing_enterocolitis: {
    name: 'Necrotizing Enterocolitis (NEC)',
    keyIndicators: ['abdominal_distension', 'bloody_stools', 'feeding_intolerance', 'neonate'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 240,
  },
  congenital_heart_disease: {
    name: 'Congenital Heart Disease (Ductal-dependent Lesions)',
    keyIndicators: ['cyanosis', 'shock', 'neonate', 'murmur', 'differential_cyanosis'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 120,
  },
  inborn_errors_metabolism: {
    name: 'Inborn Errors of Metabolism (Metabolic Crisis)',
    keyIndicators: ['lethargy', 'vomiting', 'seizures', 'metabolic_acidosis', 'neonate'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 180,
  },
  neonatal_abstinence: {
    name: 'Neonatal Abstinence Syndrome (Severe Withdrawal)',
    keyIndicators: ['irritability', 'tremors', 'seizures', 'maternal_drug_use', 'neonate'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 360,
  },
  kernicterus_risk: {
    name: 'Hyperbilirubinemia (Kernicterus Risk)',
    keyIndicators: ['jaundice', 'extreme_bilirubin', 'lethargy', 'neonate'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 240,
  },
  congenital_diaphragmatic_hernia: {
    name: 'Congenital Diaphragmatic Hernia',
    keyIndicators: ['respiratory_distress', 'scaphoid_abdomen', 'bowel_sounds_chest', 'neonate'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 180,
  },

  // ENVIRONMENTAL (4 conditions)
  severe_hypothermia: {
    name: 'Hypothermia (Severe, <28°C)',
    keyIndicators: ['low_temperature', 'altered_mental_status', 'bradycardia', 'arrhythmias'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 180,
  },
  heat_stroke: {
    name: 'Hyperthermia (Heat Stroke)',
    keyIndicators: ['high_temperature', 'altered_mental_status', 'anhidrosis', 'heat_exposure'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 120,
  },
  drowning: {
    name: 'Drowning (Near-drowning, ARDS)',
    keyIndicators: ['submersion_history', 'hypoxia', 'altered_mental_status', 'pulmonary_edema'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 240,
  },
  electrical_injury: {
    name: 'Electrical Injury',
    keyIndicators: ['electrical_exposure', 'burns', 'arrhythmias', 'muscle_injury'],
    urgencyTier: 'tier_2_hours',
    timeToDeathMinutes: 180,
  },
};
