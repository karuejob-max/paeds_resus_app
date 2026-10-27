import type { PracticeLabProgramType, PracticeLabTrackId } from "./practice-lab-types";
import type { SimulationMissionId } from "./simulation-hub";

export type SimulationScenarioCatalogEntry = {
  id: string;
  title: string;
  clinicalFocus: string;
  missionId: SimulationMissionId;
  trackId: PracticeLabTrackId;
  supportedPrograms: readonly PracticeLabProgramType[];
};

/**
 * The learner-facing index of scenario choices. Clinical state transitions remain
 * owned by the authoritative engine for the selected track; this file only makes
 * the available rehearsals discoverable and consistently scoped.
 */
export const SIMULATION_SCENARIO_CATALOG: readonly SimulationScenarioCatalogEntry[] = [
  { id: "first-minutes-instructor-loop", title: "Unresponsive patient: first contact", clinicalFocus: "Approach, activate help, airway, breathing, ventilation, and reassessment.", missionId: "first-minutes", trackId: "cardiac_arrest", supportedPrograms: ["bls", "pals", "heartsaver"] },
  { id: "vf_witnessed", title: "Witnessed VF arrest", clinicalFocus: "Immediate CPR, defibrillation, and post-shock resuscitation.", missionId: "cardiac-arrest-scenarios", trackId: "cardiac_arrest", supportedPrograms: ["bls", "pals", "heartsaver"] },
  { id: "pea_hypovolemia", title: "PEA from hypovolaemia", clinicalFocus: "Non-shockable arrest and reversible-cause treatment.", missionId: "cardiac-arrest-scenarios", trackId: "cardiac_arrest", supportedPrograms: ["bls", "pals", "heartsaver"] },
  { id: "asystole_hypoxia", title: "Asystole from respiratory failure", clinicalFocus: "Airway and ventilation priorities during non-shockable arrest.", missionId: "cardiac-arrest-scenarios", trackId: "cardiac_arrest", supportedPrograms: ["bls", "pals", "heartsaver"] },
  { id: "vf_hyperkalemia", title: "VF with hyperkalaemia", clinicalFocus: "Shockable arrest with a metabolic reversible cause.", missionId: "cardiac-arrest-scenarios", trackId: "cardiac_arrest", supportedPrograms: ["bls", "pals", "heartsaver"] },
  { id: "pea_tension_pneumo", title: "PEA from tension pneumothorax", clinicalFocus: "Trauma-associated arrest and cause-directed rescue.", missionId: "cardiac-arrest-scenarios", trackId: "cardiac_arrest", supportedPrograms: ["bls", "pals", "heartsaver"] },
  { id: "refractory_vf", title: "Refractory VF", clinicalFocus: "Persistent shockable arrest with hypothermia/toxin considerations.", missionId: "cardiac-arrest-scenarios", trackId: "cardiac_arrest", supportedPrograms: ["bls", "pals", "heartsaver"] },

  { id: "vf_witnessed_peds", title: "Witnessed paediatric VF", clinicalFocus: "PALS shockable rhythm recognition and immediate defibrillation.", missionId: "shock-no-shock", trackId: "shock_no_shock", supportedPrograms: ["pals"] },
  { id: "pulseless_vt_peds", title: "Paediatric pulseless VT", clinicalFocus: "Shockable rhythm decision under pressure.", missionId: "shock-no-shock", trackId: "shock_no_shock", supportedPrograms: ["pals"] },
  { id: "svt_unstable_peds", title: "Unstable paediatric SVT", clinicalFocus: "Recognise instability and select synchronised cardioversion.", missionId: "shock-no-shock", trackId: "shock_no_shock", supportedPrograms: ["pals"] },
  { id: "pea_hypovolemia_peds", title: "Paediatric PEA: hypovolaemia", clinicalFocus: "Avoid shock and treat the reversible cause.", missionId: "shock-no-shock", trackId: "shock_no_shock", supportedPrograms: ["pals"] },
  { id: "asystole_confirm", title: "Confirmed paediatric asystole", clinicalFocus: "Confirm the rhythm and continue non-shockable arrest care.", missionId: "shock-no-shock", trackId: "shock_no_shock", supportedPrograms: ["pals"] },
  { id: "unstable_brady_infant", title: "Unstable infant bradycardia", clinicalFocus: "ABCDE recognition of respiratory compromise and bradycardia.", missionId: "abcde-assessment", trackId: "abcde", supportedPrograms: ["pals"] },
  { id: "complete_heart_block", title: "Complete heart block deterioration", clinicalFocus: "Recognise poor perfusion and escalate safely.", missionId: "abcde-assessment", trackId: "abcde", supportedPrograms: ["pals"] },
  { id: "svt_unstable_narrow", title: "Unstable narrow-complex tachycardia", clinicalFocus: "Assess instability before rhythm treatment.", missionId: "abcde-assessment", trackId: "abcde", supportedPrograms: ["pals"] },
  { id: "vt_unstable_wide", title: "Unstable wide-complex tachycardia", clinicalFocus: "Prioritise perfusion and rhythm-directed treatment.", missionId: "abcde-assessment", trackId: "abcde", supportedPrograms: ["pals"] },

  { id: "sinus_bradycardia", title: "Sinus bradycardia", clinicalFocus: "Identify the rhythm and choose the first patient-centred action.", missionId: "rhythm-recognition", trackId: "rhythm_recognition", supportedPrograms: ["acls", "pals"] },
  { id: "heart_block_complete", title: "Complete heart block", clinicalFocus: "Recognise a high-risk bradyarrhythmia.", missionId: "rhythm-recognition", trackId: "rhythm_recognition", supportedPrograms: ["acls", "pals"] },
  { id: "svt", title: "Supraventricular tachycardia", clinicalFocus: "Interpret a regular narrow-complex tachycardia in context.", missionId: "rhythm-recognition", trackId: "rhythm_recognition", supportedPrograms: ["acls", "pals"] },
  { id: "vf", title: "Ventricular fibrillation", clinicalFocus: "Recognise a shockable arrest rhythm.", missionId: "rhythm-recognition", trackId: "rhythm_recognition", supportedPrograms: ["acls", "pals"] },
  { id: "pea", title: "Pulseless electrical activity", clinicalFocus: "Recognise organised electrical activity without a pulse.", missionId: "rhythm-recognition", trackId: "rhythm_recognition", supportedPrograms: ["acls", "pals"] },
  { id: "asystole", title: "Asystole", clinicalFocus: "Confirm a non-shockable rhythm and start the correct pathway.", missionId: "rhythm-recognition", trackId: "rhythm_recognition", supportedPrograms: ["acls", "pals"] },

  { id: "unstable-bradycardia", title: "Adult unstable bradycardia", clinicalFocus: "Atropine, pacing, cardioversion preparation, and reassessment.", missionId: "adult-acls-world", trackId: "adult_acls_world", supportedPrograms: ["acls"] },
  { id: "high-grade-av-block", title: "High-grade AV block", clinicalFocus: "Recognise a high-risk bradyarrhythmia and escalate to pacing after rhythm assessment.", missionId: "adult-acls-world", trackId: "adult_acls_world", supportedPrograms: ["acls"] },
  { id: "stable-narrow-tachycardia", title: "Adult stable narrow-complex tachycardia", clinicalFocus: "Assessment, vagal/adenosine decision-making, and reassessment.", missionId: "adult-acls-world", trackId: "adult_acls_world", supportedPrograms: ["acls"] },
  { id: "unstable-tachycardia", title: "Adult unstable tachycardia", clinicalFocus: "Synchronised cardioversion for an unstable tachyarrhythmia.", missionId: "adult-acls-world", trackId: "adult_acls_world", supportedPrograms: ["acls"] },
  { id: "vf-pulseless-vt", title: "Adult VF / pulseless VT", clinicalFocus: "Shockable arrest sequence and rhythm reassessment.", missionId: "adult-acls-world", trackId: "adult_acls_world", supportedPrograms: ["acls"] },
  { id: "pea", title: "Adult PEA", clinicalFocus: "CPR, epinephrine, reversible causes, and reassessment.", missionId: "adult-acls-world", trackId: "adult_acls_world", supportedPrograms: ["acls"] },
  { id: "asystole", title: "Adult asystole", clinicalFocus: "Non-shockable arrest management and cause review.", missionId: "adult-acls-world", trackId: "adult_acls_world", supportedPrograms: ["acls"] },
  { id: "rosc-post-arrest", title: "ROSC and post-arrest deterioration", clinicalFocus: "Ventilation, perfusion, neurological care, and re-arrest prevention.", missionId: "adult-acls-world", trackId: "adult_acls_world", supportedPrograms: ["acls"] },
  { id: "acs-to-vf", title: "ACS progressing to VF", clinicalFocus: "Ischaemia recognition, escalation, and arrest response.", missionId: "adult-acls-world", trackId: "adult_acls_world", supportedPrograms: ["acls"] },
  { id: "hypoxia-to-arrest", title: "Hypoxia progressing to arrest", clinicalFocus: "Ventilation failure, deterioration recognition, and arrest prevention.", missionId: "adult-acls-world", trackId: "adult_acls_world", supportedPrograms: ["acls"] },
  { id: "reversible-cause-arrest", title: "Reversible-cause arrest", clinicalFocus: "Use findings to identify and treat the cause during CPR.", missionId: "adult-acls-world", trackId: "adult_acls_world", supportedPrograms: ["acls"] },

  { id: "newborn-not-breathing", title: "Newborn not breathing after birth", clinicalFocus: "Initial steps, ventilation, and heart-rate reassessment.", missionId: "nrp-newborn-not-breathing", trackId: "nrp_world", supportedPrograms: ["nrp"] },
  { id: "newborn-apnoea-after-meconium", title: "Newborn apnoea after meconium-stained birth", clinicalFocus: "Effective ventilation and corrective steps without routine suction delay.", missionId: "nrp-newborn-not-breathing", trackId: "nrp_world", supportedPrograms: ["nrp"] },
  { id: "preterm-thermal-risk", title: "Preterm newborn with thermal risk", clinicalFocus: "Thermal protection, initial steps, ventilation, and reassessment.", missionId: "nrp-newborn-not-breathing", trackId: "nrp_world", supportedPrograms: ["nrp"] },
  { id: "newborn-persistent-bradycardia", title: "Persistent newborn bradycardia", clinicalFocus: "Ventilation effectiveness, corrective steps, and indicated compressions.", missionId: "nrp-newborn-not-breathing", trackId: "nrp_world", supportedPrograms: ["nrp"] },
];

export function getSimulationScenarioCatalog(programType: PracticeLabProgramType): SimulationScenarioCatalogEntry[] {
  return SIMULATION_SCENARIO_CATALOG.filter((scenario) => scenario.supportedPrograms.includes(programType));
}

export function getSimulationScenarioCatalogEntry(id: string): SimulationScenarioCatalogEntry | undefined {
  return SIMULATION_SCENARIO_CATALOG.find((scenario) => scenario.id === id);
}
