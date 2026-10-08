export type SimulationClinicalProgram = "acls" | "pals" | "nrp";
export type SimulationAgeGroup = "adult" | "paediatric" | "neonatal";
export type SimulationClinicalStatus = "draft" | "clinical_review" | "approved_for_rehearsal" | "approved_for_assessment" | "retired";

export type SimulationClinicalPackage = {
  program: SimulationClinicalProgram;
  ageGroup: SimulationAgeGroup;
  guidelineVersion: string;
  clinicalStatus: SimulationClinicalStatus;
  label: string;
  boundary: string;
};

export const SIMULATION_CLINICAL_PACKAGES: Record<SimulationClinicalProgram, SimulationClinicalPackage> = {
  acls: {
    program: "acls",
    ageGroup: "adult",
    guidelineVersion: "ACLS-2025",
    clinicalStatus: "clinical_review",
    label: "Adult ACLS 2025",
    boundary: "Adult rhythm, arrest, ACS, stroke, and post-ROSC rehearsal; not paediatric care.",
  },
  pals: {
    program: "pals",
    ageGroup: "paediatric",
    guidelineVersion: "PALS-2025",
    clinicalStatus: "clinical_review",
    label: "Paediatric ALS 2025",
    boundary: "Paediatric resuscitation rehearsal; not adult ACLS or neonatal resuscitation.",
  },
  nrp: {
    program: "nrp",
    ageGroup: "neonatal",
    guidelineVersion: "NRP-governed",
    clinicalStatus: "clinical_review",
    label: "NRP governed pathway",
    boundary: "Neonatal and delivery-room rehearsal; not generic paediatric ALS.",
  },
};

export function getSimulationClinicalPackage(program: SimulationClinicalProgram): SimulationClinicalPackage {
  return SIMULATION_CLINICAL_PACKAGES[program];
}

export function isSimulationProgramCompatible(program: SimulationClinicalProgram, ageGroup: SimulationAgeGroup): boolean {
  return getSimulationClinicalPackage(program).ageGroup === ageGroup;
}
