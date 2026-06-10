/**
 * Fellowship definitive-care catalog — protocol sources and expected rigor per condition.
 * Used for tests and CEO documentation.
 */

import { getAllFellowshipConditionIds } from "./fellowship-clinical-rigor";

export interface FellowshipDefinitiveCareMeta {
  fellowshipId: string;
  protocolSource: string;
  /** Minimum non-reassessment steps expected (therapy + discharge). */
  minSteps: number;
}

export const FELLOWSHIP_DEFINITIVE_CARE_CATALOG: Record<string, FellowshipDefinitiveCareMeta> = {
  seriously_ill_child: { fellowshipId: "seriously_ill_child", protocolSource: "WHO ETAT+ / ABCDE", minSteps: 7 },
  severe_asthma: { fellowshipId: "severe_asthma", protocolSource: "GINA / PALS 2020", minSteps: 8 },
  severe_pneumonia: { fellowshipId: "severe_pneumonia", protocolSource: "WHO Pocket Book / SSC", minSteps: 8 },
  septic_shock: { fellowshipId: "septic_shock", protocolSource: "SSC 2020 / WHO ETAT+", minSteps: 12 },
  hypovolemic_shock: { fellowshipId: "hypovolemic_shock", protocolSource: "WHO ETAT+ / APLS", minSteps: 7 },
  cardiogenic_shock: { fellowshipId: "cardiogenic_shock", protocolSource: "PALS / SCCM Paediatric Shock", minSteps: 7 },
  status_epilepticus: { fellowshipId: "status_epilepticus", protocolSource: "ILAE / APLS / WHO", minSteps: 8 },
  dka: { fellowshipId: "dka", protocolSource: "ISPAD 2022 / BSPED", minSteps: 12 },
  anaphylaxis: { fellowshipId: "anaphylaxis", protocolSource: "WAO / APLS / PALS", minSteps: 6 },
  meningitis: { fellowshipId: "meningitis", protocolSource: "WHO / NICE CG102", minSteps: 7 },
  severe_malaria: { fellowshipId: "severe_malaria", protocolSource: "WHO Severe Malaria 2022", minSteps: 7 },
  burns: { fellowshipId: "burns", protocolSource: "ABA / APLS Burns", minSteps: 7 },
  trauma: { fellowshipId: "trauma", protocolSource: "APLS / CRASH-2 (TXA)", minSteps: 7 },
  severe_anaemia: { fellowshipId: "severe_anaemia", protocolSource: "WHO Transfusion / Anaemia", minSteps: 7 },
  acute_kidney_injury: { fellowshipId: "acute_kidney_injury", protocolSource: "KDIGO / WHO Pocket Book", minSteps: 7 },
};

export function getFellowshipDefinitiveCareCatalogEntries(): FellowshipDefinitiveCareMeta[] {
  return getAllFellowshipConditionIds().map(
    (id) => FELLOWSHIP_DEFINITIVE_CARE_CATALOG[id] ?? { fellowshipId: id, protocolSource: "Paeds Resus standard", minSteps: 5 }
  );
}
