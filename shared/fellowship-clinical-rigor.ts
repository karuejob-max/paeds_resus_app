/**
 * Fellowship condition clinical rigor — structured SAMPLE, symptoms, diagnostic evidence.
 * DKA is the gold template; all 15 fellowship conditions have condition-specific fields.
 */

import {
  FELLOWSHIP_MICROCOURSE_RESUS_CONDITIONS,
  normalizeToFellowshipResusConditionId,
} from "./fellowship-microcourse-resus-conditions";
import type { ClinicalEvidenceFieldDef } from "./clinical-evidence";

export type SecondarySurveyStep = "sample" | "evidence" | "diagnosis";

export interface FellowshipClinicalRigorPack {
  fellowshipId: string;
  symptoms: ClinicalEvidenceFieldDef[];
  sampleFields: ClinicalEvidenceFieldDef[];
  diagnosticEvidence: ClinicalEvidenceFieldDef[];
}

function sym(id: string, label: string): ClinicalEvidenceFieldDef {
  return { id, label, type: "presence", presenceOptions: true, phase: "Symptoms" };
}

function sample(id: string, label: string, placeholder?: string): ClinicalEvidenceFieldDef {
  return { id, label, type: "text", placeholder, phase: "SAMPLE" };
}

function lab(id: string, label: string, unit: string, placeholder?: string): ClinicalEvidenceFieldDef {
  return { id, label, type: "numeric", unit, placeholder, phase: "Diagnostic evidence" };
}

const DKA_PACK: FellowshipClinicalRigorPack = {
  fellowshipId: "dka",
  symptoms: [
    sym("dka_sym_polyuria", "Polyuria"),
    sym("dka_sym_polydipsia", "Polydipsia"),
    sym("dka_sym_polyphagia", "Polyphagia"),
    sym("dka_sym_abdominal_pain", "Abdominal pain"),
    sym("dka_sym_vomiting", "Vomiting"),
    sym("dka_sym_weight_loss", "Weight loss / poor growth"),
  ],
  sampleFields: [
    sample("dka_sample_t1dm", "Known type 1 diabetes?", "Yes — on insulin / No / newly diagnosed"),
    sample("dka_sample_allergies", "Allergies", "e.g. penicillin, latex"),
    sample("dka_sample_meds", "Current medications", "e.g. insulin regimen, last dose"),
    sample("dka_sample_past", "Past medical history", "e.g. previous DKA admissions"),
    sample("dka_sample_last_meal", "Last meal / oral intake", "Time and content"),
    sample("dka_sample_events", "Events leading to presentation", "e.g. missed insulin, intercurrent illness"),
  ],
  diagnosticEvidence: [
    lab("dka_ev_glucose", "Blood glucose", "mmol/L", "e.g. 28"),
    lab("dka_ev_ketones", "Blood or urine ketones", "mmol/L or +", "e.g. 4.2 or 3+"),
    lab("dka_ev_ph", "Venous pH", "", "e.g. 7.15"),
    lab("dka_ev_hco3", "Bicarbonate (HCO₃)", "mmol/L", "e.g. 8"),
    lab("dka_ev_hba1c", "HbA1c", "% or mmol/mol", "e.g. 11.5%"),
    lab("dka_ev_potassium", "Serum potassium", "mmol/L", "e.g. 4.8"),
    lab("dka_ev_urea", "Urea / creatinine", "mmol/L", "Renal function"),
  ],
};

const SEPTIC_SHOCK_PACK: FellowshipClinicalRigorPack = {
  fellowshipId: "septic_shock",
  symptoms: [
    sym("sep_sym_fever", "Fever or hypothermia"),
    sym("sep_sym_lethargy", "Lethargy / reduced consciousness"),
    sym("sep_sym_poor_feeding", "Poor feeding / reduced intake"),
    sym("sep_sym_rash", "Rash or petechiae"),
    sym("sep_sym_focal", "Focal infection signs"),
  ],
  sampleFields: [
    sample("sep_sample_immunization", "Immunization status", "Up to date / incomplete"),
    sample("sep_sample_meds", "Recent antibiotics", "Drug, dose, timing"),
    sample("sep_sample_past", "Past medical history", "Immunocompromise, sickle cell, etc."),
    sample("sep_sample_events", "Events / exposure", "Travel, sick contacts, wound"),
  ],
  diagnosticEvidence: [
    lab("sep_ev_lactate", "Lactate", "mmol/L", "e.g. 4.5"),
    lab("sep_ev_wcc", "White cell count", "×10⁹/L", ""),
    lab("sep_ev_crp", "CRP", "mg/L", ""),
    lab("sep_ev_glucose", "Blood glucose", "mmol/L", ""),
    lab("sep_ev_culture", "Blood culture obtained", "before antibiotics", "Time sent"),
  ],
};

const STATUS_EPI_PACK: FellowshipClinicalRigorPack = {
  fellowshipId: "status_epilepticus",
  symptoms: [
    sym("se_sym_duration", "Seizure duration >5 min documented"),
    sym("se_sym_focal", "Focal features"),
    sym("se_sym_postictal", "Post-ictal state"),
    sym("se_sym_fever", "Fever during seizure"),
  ],
  sampleFields: [
    sample("se_sample_epilepsy", "Known epilepsy?", "Diagnosis, AEDs"),
    sample("se_sample_meds", "Antiepileptic medications", "Last doses"),
    sample("se_sample_past", "Previous seizure history", ""),
    sample("se_sample_events", "Events / triggers", "Trauma, toxin, illness"),
  ],
  diagnosticEvidence: [
    lab("se_ev_glucose", "Blood glucose", "mmol/L", "Rule out hypoglycaemia"),
    lab("se_ev_sodium", "Sodium", "mmol/L", ""),
    lab("se_ev_calcium", "Calcium", "mmol/L", ""),
    lab("se_ev_lactate", "Lactate", "mmol/L", ""),
  ],
};

const ASTHMA_PACK: FellowshipClinicalRigorPack = {
  fellowshipId: "severe_asthma",
  symptoms: [
    sym("ast_sym_wheeze", "Wheeze"),
    sym("ast_sym_cough", "Cough"),
    sym("ast_sym_accessory", "Accessory muscle use"),
    sym("ast_sym_speech", "Unable to speak in sentences"),
  ],
  sampleFields: [
    sample("ast_sample_asthma", "Known asthma?", "Controller therapy"),
    sample("ast_sample_allergies", "Allergies / triggers", ""),
    sample("ast_sample_meds", "Inhaled / oral medications", ""),
    sample("ast_sample_past", "Previous ICU / intubation", ""),
  ],
  diagnosticEvidence: [
    lab("ast_ev_spo2", "SpO₂ on presentation", "%", ""),
    lab("ast_ev_peak_flow", "Peak flow / PEFR", "% predicted", ""),
    lab("ast_ev_gas", "Blood gas if available", "pH / PaCO₂", ""),
  ],
};

const ANAPHYLAXIS_PACK: FellowshipClinicalRigorPack = {
  fellowshipId: "anaphylaxis",
  symptoms: [
    sym("ana_sym_urticaria", "Urticaria / angioedema"),
    sym("ana_sym_bronchospasm", "Bronchospasm / wheeze"),
    sym("ana_sym_hypotension", "Hypotension / collapse"),
    sym("ana_sym_gi", "GI symptoms (vomiting, diarrhoea)"),
  ],
  sampleFields: [
    sample("ana_sample_allergies", "Known allergies", "Food, drug, insect"),
    sample("ana_sample_meds", "Medications", "Including recent antibiotics"),
    sample("ana_sample_events", "Exposure / trigger", "Food, sting, drug"),
  ],
  diagnosticEvidence: [
    lab("ana_ev_tryptase", "Serum tryptase", "ng/mL", "If available — not required for treatment"),
    lab("ana_ev_spo2", "SpO₂", "%", ""),
  ],
};

const MENINGITIS_PACK: FellowshipClinicalRigorPack = {
  fellowshipId: "meningitis",
  symptoms: [
    sym("men_sym_headache", "Headache"),
    sym("men_sym_photophobia", "Photophobia"),
    sym("men_sym_neck_stiff", "Neck stiffness"),
    sym("men_sym_rash", "Non-blanching rash"),
  ],
  sampleFields: [
    sample("men_sample_contacts", "Sick contacts / outbreak", ""),
    sample("men_sample_immunization", "Meningococcal vaccine status", ""),
    sample("men_sample_meds", "Recent antibiotics", ""),
  ],
  diagnosticEvidence: [
    lab("men_ev_lp", "Lumbar puncture performed", "CSF results", "Opening pressure, cell count"),
    lab("men_ev_glucose_cs", "CSF glucose", "mmol/L", ""),
    lab("men_ev_culture", "Blood / CSF culture", "", ""),
  ],
};

const MALARIA_PACK: FellowshipClinicalRigorPack = {
  fellowshipId: "severe_malaria",
  symptoms: [
    sym("mal_sym_fever", "Fever / rigors"),
    sym("mal_sym_vomiting", "Vomiting"),
    sym("mal_sym_altered", "Altered consciousness"),
    sym("mal_sym_jaundice", "Jaundice"),
  ],
  sampleFields: [
    sample("mal_sample_travel", "Travel / endemic exposure", ""),
    sample("mal_sample_prophylaxis", "Malaria prophylaxis", ""),
    sample("mal_sample_past", "Previous malaria episodes", ""),
  ],
  diagnosticEvidence: [
    lab("mal_ev_rdt", "Malaria RDT / smear", "", "Species, parasitaemia"),
    lab("mal_ev_hb", "Haemoglobin", "g/dL", ""),
    lab("mal_ev_glucose", "Blood glucose", "mmol/L", ""),
    lab("mal_ev_lactate", "Lactate", "mmol/L", ""),
  ],
};

const GENERIC_SHOCK_SYMPTOMS: ClinicalEvidenceFieldDef[] = [
  sym("shk_sym_poor_perfusion", "Poor peripheral perfusion"),
  sym("shk_sym_tachycardia", "Tachycardia"),
  sym("shk_sym_oliguria", "Reduced urine output"),
  sym("shk_sym_altered", "Altered consciousness"),
];

function shockPack(id: string, extraLabs: ClinicalEvidenceFieldDef[]): FellowshipClinicalRigorPack {
  return {
    fellowshipId: id,
    symptoms: GENERIC_SHOCK_SYMPTOMS,
    sampleFields: [
      sample(`${id}_sample_fluid_loss`, "Fluid loss / bleeding source", ""),
      sample(`${id}_sample_meds`, "Medications", ""),
      sample(`${id}_sample_past`, "Past medical history", ""),
    ],
    diagnosticEvidence: [
      lab(`${id}_ev_hb`, "Haemoglobin", "g/dL", ""),
      lab(`${id}_ev_lactate`, "Lactate", "mmol/L", ""),
      lab(`${id}_ev_urea`, "Urea", "mmol/L", ""),
      ...extraLabs,
    ],
  };
}

const RIGOR_BY_CONDITION: Record<string, FellowshipClinicalRigorPack> = {
  dka: DKA_PACK,
  septic_shock: SEPTIC_SHOCK_PACK,
  status_epilepticus: STATUS_EPI_PACK,
  severe_asthma: ASTHMA_PACK,
  anaphylaxis: ANAPHYLAXIS_PACK,
  meningitis: MENINGITIS_PACK,
  severe_malaria: MALARIA_PACK,
  hypovolemic_shock: shockPack("hypovolemic_shock", [
    lab("hvs_ev_crossmatch", "Crossmatch / blood group", "", ""),
  ]),
  cardiogenic_shock: shockPack("cardiogenic_shock", [
    lab("cgs_ev_echo", "Echo / cardiac function", "", "EF, pericardial effusion"),
  ]),
  severe_pneumonia: {
    fellowshipId: "severe_pneumonia",
    symptoms: [
      sym("pna_sym_cough", "Cough"),
      sym("pna_sym_fever", "Fever"),
      sym("pna_sym_work_breathing", "Increased work of breathing"),
      sym("pna_sym_hypoxia", "Hypoxia"),
    ],
    sampleFields: [
      sample("pna_sample_immunization", "Immunization (PCV, Hib)", ""),
      sample("pna_sample_meds", "Recent antibiotics", ""),
      sample("pna_sample_past", "Lung disease / CF", ""),
    ],
    diagnosticEvidence: [
      lab("pna_ev_cxr", "Chest X-ray", "", "Consolidation, effusion"),
      lab("pna_ev_crp", "CRP", "mg/L", ""),
      lab("pna_ev_spo2", "SpO₂", "%", ""),
    ],
  },
  burns: {
    fellowshipId: "burns",
    symptoms: [
      sym("brn_sym_pain", "Burn pain"),
      sym("brn_sym_inhalation", "Inhalation injury signs"),
      sym("brn_sym_circumferential", "Circumferential burn"),
    ],
    sampleFields: [
      sample("brn_sample_mechanism", "Burn mechanism", "Scald, flame, chemical"),
      sample("brn_sample_time", "Time since burn", ""),
      sample("brn_sample_tetanus", "Tetanus status", ""),
    ],
    diagnosticEvidence: [
      lab("brn_ev_tbsa", "TBSA burned", "%", "Rule of nines / Lund-Browder"),
      lab("brn_ev_carboxy", "Carboxyhaemoglobin", "%", "If smoke exposure"),
    ],
  },
  trauma: {
    fellowshipId: "trauma",
    symptoms: [
      sym("trm_sym_bleeding", "External bleeding"),
      sym("trm_sym_pain", "Pain at injury site"),
      sym("trm_sym_altered", "Altered consciousness"),
    ],
    sampleFields: [
      sample("trm_sample_mechanism", "Mechanism of injury", "RTC, fall, assault"),
      sample("trm_sample_time", "Time since injury", ""),
      sample("trm_sample_anticoag", "Anticoagulation", ""),
    ],
    diagnosticEvidence: [
      lab("trm_ev_hb", "Haemoglobin", "g/dL", ""),
      lab("trm_ev_fast", "FAST / imaging", "", "Free fluid, fractures"),
    ],
  },
  acute_kidney_injury: {
    fellowshipId: "acute_kidney_injury",
    symptoms: [
      sym("aki_sym_oliguria", "Oliguria / anuria"),
      sym("aki_sym_oedema", "Oedema / fluid overload"),
      sym("aki_sym_vomiting", "Vomiting"),
    ],
    sampleFields: [
      sample("aki_sample_nephrotoxins", "Nephrotoxins / medications", ""),
      sample("aki_sample_fluid", "Fluid balance history", ""),
    ],
    diagnosticEvidence: [
      lab("aki_ev_creatinine", "Creatinine", "µmol/L", ""),
      lab("aki_ev_potassium", "Potassium", "mmol/L", ""),
      lab("aki_ev_urine_output", "Urine output", "mL/kg/hr", ""),
    ],
  },
  severe_anaemia: {
    fellowshipId: "severe_anaemia",
    symptoms: [
      sym("ana_sym_pallor", "Pallor"),
      sym("ana_sym_tachycardia", "Tachycardia"),
      sym("ana_sym_breathlessness", "Breathlessness"),
      sym("ana_sym_splenomegaly", "Splenomegaly"),
    ],
    sampleFields: [
      sample("ana_sample_sickle", "Sickle cell / haemoglobinopathy", ""),
      sample("ana_sample_malaria", "Malaria exposure", ""),
      sample("ana_sample_transfusion", "Previous transfusions", ""),
    ],
    diagnosticEvidence: [
      lab("ana_ev_hb", "Haemoglobin", "g/dL", ""),
      lab("ana_ev_reticulocytes", "Reticulocyte count", "%", ""),
      lab("ana_ev_blood_group", "Blood group / crossmatch", "", ""),
    ],
  },
  seriously_ill_child: {
    fellowshipId: "seriously_ill_child",
    symptoms: [
      sym("sic_sym_lethargy", "Lethargy / reduced interaction"),
      sym("sic_sym_poor_feeding", "Poor feeding"),
      sym("sic_sym_vomiting", "Vomiting"),
      sym("sic_sym_fever", "Fever"),
    ],
    sampleFields: [
      sample("sic_sample_allergies", "Allergies", ""),
      sample("sic_sample_meds", "Medications", ""),
      sample("sic_sample_past", "Past medical history", ""),
      sample("sic_sample_events", "Events leading to presentation", ""),
    ],
    diagnosticEvidence: [
      lab("sic_ev_glucose", "Blood glucose", "mmol/L", ""),
      lab("sic_ev_hb", "Haemoglobin", "g/dL", ""),
    ],
  },
};

/** Fluid bolus reassessment — each sign submitted individually (ISPAD / WHO). */
export const FLUID_OVERLOAD_EVIDENCE: ClinicalEvidenceFieldDef[] = [
  { id: "flo_pulmonary_edema", label: "Pulmonary oedema / increased work of breathing", type: "presence", presenceOptions: true, phase: "Overload signs" },
  { id: "flo_jvd", label: "Raised JVP / neck vein distension", type: "presence", presenceOptions: true, phase: "Overload signs" },
  { id: "flo_creps", label: "Bibasal crepitations", type: "presence", presenceOptions: true, phase: "Overload signs" },
  { id: "flo_gallop", label: "S3 gallop / new murmur", type: "presence", presenceOptions: true, phase: "Overload signs" },
  { id: "flo_hepatomegaly", label: "Hepatomegaly ≥2 cm below costal margin", type: "presence", presenceOptions: true, phase: "Overload signs" },
  { id: "flo_peripheral_oedema", label: "Peripheral oedema", type: "presence", presenceOptions: true, phase: "Overload signs" },
];

export const FLUID_SHOCK_EVIDENCE: ClinicalEvidenceFieldDef[] = [
  { id: "fls_crt", label: "Capillary refill time", type: "numeric", unit: "sec", placeholder: "e.g. 4", phase: "Perfusion" },
  { id: "fls_hr", label: "Heart rate", type: "numeric", unit: "bpm", phase: "Perfusion" },
  { id: "fls_sbp", label: "Systolic BP", type: "numeric", unit: "mmHg", phase: "Perfusion" },
  { id: "fls_temp_gradient", label: "Temperature gradient (core to periphery)", type: "text", placeholder: "e.g. warm core, cold peripheries", phase: "Perfusion" },
  { id: "fls_pulse", label: "Pulse quality", type: "text", placeholder: "e.g. weak, thready", phase: "Perfusion" },
  { id: "fls_urine", label: "Urine output", type: "numeric", unit: "mL/kg/hr", phase: "Perfusion" },
];

export function getFellowshipClinicalRigorPack(fellowshipId: string): FellowshipClinicalRigorPack {
  const id = normalizeToFellowshipResusConditionId(fellowshipId);
  return RIGOR_BY_CONDITION[id] ?? RIGOR_BY_CONDITION.seriously_ill_child;
}

function dedupeFields(fields: ClinicalEvidenceFieldDef[]): ClinicalEvidenceFieldDef[] {
  const seen = new Set<string>();
  const out: ClinicalEvidenceFieldDef[] = [];
  for (const f of fields) {
    if (seen.has(f.id)) continue;
    seen.add(f.id);
    out.push(f);
  }
  return out;
}

/** Merge rigor fields from candidate fellowship conditions (threats + suggestions). */
export function mergeClinicalRigorPacks(conditionIds: string[]): {
  symptoms: ClinicalEvidenceFieldDef[];
  sampleFields: ClinicalEvidenceFieldDef[];
  diagnosticEvidence: ClinicalEvidenceFieldDef[];
} {
  const symptoms: ClinicalEvidenceFieldDef[] = [];
  const sampleFields: ClinicalEvidenceFieldDef[] = [];
  const diagnosticEvidence: ClinicalEvidenceFieldDef[] = [];

  const ids = conditionIds.length > 0 ? conditionIds : ["seriously_ill_child"];
  for (const raw of ids) {
    const pack = getFellowshipClinicalRigorPack(raw);
    symptoms.push(...pack.symptoms);
    sampleFields.push(...pack.sampleFields);
    diagnosticEvidence.push(...pack.diagnosticEvidence);
  }

  return {
    symptoms: dedupeFields(symptoms),
    sampleFields: dedupeFields(sampleFields),
    diagnosticEvidence: dedupeFields(diagnosticEvidence),
  };
}

export function getAllFellowshipConditionIds(): string[] {
  return FELLOWSHIP_MICROCOURSE_RESUS_CONDITIONS.map((c) => c.id);
}
