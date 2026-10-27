/**
 * Data-driven ACLS case definitions.
 *
 * Every case declares, as DATA, what an instructor would look for: required
 * actions, poor choices (cap the score, never a critical failure), the 2025 AHA
 * guideline basis, and at least one reference "honest path". A test harness
 * generated from these definitions proves each case can be won honestly and
 * cannot be passed by doing nothing, spamming one button, reversing the order,
 * or dropping any required step. Adding a case = adding a definition here.
 *
 * Type-only imports from the engine keep this file free of runtime cycles.
 */
import type { AdultAclsCommand, AdultAclsScenarioId } from "./adult-acls-simulation-world";

export type AdultAclsCaseFamily =
  | "shockable_arrest"
  | "non_shockable_arrest"
  | "bradycardia"
  | "tachycardia"
  | "acs"
  | "post_arrest"
  | "respiratory";

/** An event the learner's session must contain. `descriptionIncludes` is matched case-insensitively. */
export type AdultAclsEventRequirement = { type: string; descriptionIncludes?: string };

/** An action that is not dangerous but is not the guideline-preferred choice: caps the score below pass. */
export type AdultAclsPoorChoice = {
  type: string;
  descriptionIncludes?: string;
  /** Poor only if it happens before the first event of this type (or if that event never happens). */
  beforeEventType?: string;
  reason: string;
};

export type AdultAclsCaseDefinition = {
  id: AdultAclsScenarioId;
  family: AdultAclsCaseFamily;
  /** 2025 AHA Guidelines for CPR and ECC basis for the required/poor actions (for clinical review). */
  guidelines: readonly string[];
  requiredEvents: readonly AdultAclsEventRequirement[];
  /** The learner must assess the rhythm (not just any parameter) BEFORE the first treatment. */
  requiresRhythmAssessment?: boolean;
  requiresPostRoscCare?: boolean;
  /** Event types that count as treatment for the assess-before / reassess-after ordering rule. Defaults to requiredEvents minus assessment types. */
  treatmentEventTypes?: readonly string[];
  /** Extra requirements that apply only if a given engine event occurred (e.g. an escalation). */
  conditionalRequirements?: readonly { whenEventType: string; require: readonly AdultAclsEventRequirement[] }[];
  poorChoices?: readonly AdultAclsPoorChoice[];
  /** Minimal command sequence that must pass. Consecutive identical commands are one "run" in drop-one tests. */
  honestPath: readonly AdultAclsCommand[];
  /** Sequences that must NOT pass (poor choices, wrong drugs). */
  mustNotPassPaths?: readonly { label: string; path: readonly AdultAclsCommand[] }[];
};

const assess = (target: Extract<AdultAclsCommand, { type: "assess" }>["target"]): AdultAclsCommand => ({ type: "assess", target });
const repeat = (command: AdultAclsCommand, times: number): AdultAclsCommand[] => Array.from({ length: times }, () => command);
const REASSESS: AdultAclsCommand = { type: "reassess" };
const END: AdultAclsCommand = { type: "end_rehearsal" };
const POST_ROSC_CARE: AdultAclsCommand[] = [
  { type: "support_perfusion" },
  ...repeat({ type: "give_oxygen" }, 6),
  ...repeat({ type: "assist_ventilation" }, 5),
  REASSESS,
];
const nonShockableArrest = (cueTarget: Extract<AdultAclsCommand, { type: "assess" }>["target"], cause: "hypovolaemia" | "prolonged_hypoxia" | "tension_pneumothorax"): AdultAclsCommand[] => [
  assess("rhythm"),
  { type: "start_cpr" },
  assess(cueTarget),
  { type: "give_epinephrine" },
  { type: "treat_reversible_cause", cause },
  REASSESS,
  ...POST_ROSC_CARE,
  END,
];

export const ADULT_ACLS_CASE_DEFINITIONS: readonly AdultAclsCaseDefinition[] = [
  {
    id: "vf-pulseless-vt",
    family: "shockable_arrest",
    guidelines: [
      "Part 9 Adult ALS 2025: defibrillation and high-quality CPR are the highest-value actions in VF/pVT.",
      "2025: in shockable rhythms, epinephrine 1 mg is reasonable after initial defibrillation attempts fail (COR 2a).",
      "2025: amiodarone or lidocaine may be considered for refractory VF/pVT (COR 2b).",
    ],
    requiredEvents: [{ type: "cpr" }, { type: "defibrillation" }],
    requiresPostRoscCare: true,
    requiresRhythmAssessment: true,
    poorChoices: [{ type: "medication", descriptionIncludes: "epinephrine", beforeEventType: "defibrillation", reason: "In a shockable rhythm, 2025 AHA guidance is to defibrillate first and give epinephrine after initial shocks fail." }],
    honestPath: [assess("rhythm"), { type: "start_cpr" }, { type: "defibrillate" }, ...POST_ROSC_CARE, END],
    mustNotPassPaths: [{ label: "epinephrine before any shock", path: [assess("rhythm"), { type: "start_cpr" }, { type: "give_epinephrine" }, { type: "defibrillate" }, ...POST_ROSC_CARE, END] }],
  },
  {
    id: "pea",
    family: "non_shockable_arrest",
    guidelines: [
      "2025: in non-shockable rhythms, give epinephrine as soon as feasible (COR 2a); 1 mg every 3 to 5 min.",
      "Identify and treat reversible causes; routine calcium is not recommended (2025).",
    ],
    requiredEvents: [{ type: "cpr" }, { type: "medication" }, { type: "cause_assessment" }, { type: "cause_treatment" }],
    requiresRhythmAssessment: true,
    requiresPostRoscCare: true,
    honestPath: nonShockableArrest("airway_history", "hypovolaemia"),
  },
  {
    id: "asystole",
    family: "non_shockable_arrest",
    guidelines: ["2025: epinephrine as soon as feasible in non-shockable rhythms; treat reversible causes; defibrillation is not indicated."],
    requiredEvents: [{ type: "cpr" }, { type: "medication" }, { type: "cause_assessment" }, { type: "cause_treatment" }],
    requiresRhythmAssessment: true,
    requiresPostRoscCare: true,
    honestPath: nonShockableArrest("airway_history", "prolonged_hypoxia"),
  },
  {
    id: "reversible-cause-arrest",
    family: "non_shockable_arrest",
    guidelines: ["2025: identify and treat reversible causes during arrest; epinephrine as soon as feasible in non-shockable rhythms."],
    requiredEvents: [{ type: "cpr" }, { type: "medication" }, { type: "cause_assessment" }, { type: "cause_treatment" }],
    requiresRhythmAssessment: true,
    requiresPostRoscCare: true,
    honestPath: nonShockableArrest("breath_sounds", "tension_pneumothorax"),
  },
  {
    id: "unstable-bradycardia",
    family: "bradycardia",
    guidelines: [
      "2025 Adult Bradycardia With a Pulse: atropine is first-line, 1 mg IV bolus, repeat every 3 to 5 min, maximum 3 mg.",
      "If atropine is ineffective: transcutaneous pacing and/or dopamine (5-20 mcg/kg/min) or epinephrine (2-10 mcg/min) infusion.",
    ],
    requiredEvents: [{ type: "medication", descriptionIncludes: "bradycardia response" }],
    requiresRhythmAssessment: true,
    honestPath: [assess("rhythm"), { type: "give_atropine" }, REASSESS, END],
    mustNotPassPaths: [{ label: "pacing first, skipping atropine", path: [assess("rhythm"), { type: "pace" }, REASSESS, END] }],
  },
  {
    id: "high-grade-av-block",
    family: "bradycardia",
    guidelines: [
      "2025: atropine is first-line for symptomatic bradycardia, but it is unlikely to work in Mobitz II / third-degree (infranodal) block.",
      "Transcutaneous pacing, or dopamine/epinephrine infusion, is the escalation; do not delay pacing to give atropine.",
    ],
    requiredEvents: [{ type: "pacing" }],
    requiresRhythmAssessment: true,
    poorChoices: [{ type: "medication", descriptionIncludes: "poor choice", reason: "Atropine is unlikely to work in high-grade AV block and risks delaying pacing." }],
    honestPath: [assess("rhythm"), { type: "pace" }, REASSESS, END],
    mustNotPassPaths: [{ label: "atropine first, then pacing", path: [assess("rhythm"), { type: "give_atropine" }, { type: "pace" }, REASSESS, END] }],
  },
  {
    id: "stable-narrow-tachycardia",
    family: "tachycardia",
    guidelines: ["2025 Adult Tachyarrhythmia With a Pulse: stable regular narrow-complex tachycardia: vagal maneuvers, then adenosine 6 mg rapid IV push (12 mg if required)."],
    requiredEvents: [{ type: "medication", descriptionIncludes: "adenosine" }],
    requiresRhythmAssessment: true,
    honestPath: [assess("rhythm"), { type: "give_adenosine" }, REASSESS, END],
  },
  {
    id: "unstable-tachycardia",
    family: "tachycardia",
    guidelines: ["2025: tachyarrhythmia causing hypotension, altered mental status, shock or ischaemic chest discomfort: synchronized cardioversion (device-specific energy; maximum if unknown)."],
    requiredEvents: [{ type: "synchronization" }, { type: "cardioversion" }],
    requiresRhythmAssessment: true,
    honestPath: [assess("rhythm"), { type: "prepare_synchronized_cardioversion" }, { type: "synchronized_cardioversion" }, ...repeat({ type: "give_oxygen" }, 2), REASSESS, END],
  },
  {
    id: "acs-to-vf",
    family: "acs",
    guidelines: ["ACS pathway: 12-lead ECG, aspirin, and early reperfusion activation; untreated ischaemia can progress to VF arrest."],
    requiredEvents: [{ type: "assessment" }, { type: "ecg" }, { type: "acs_medication" }, { type: "reperfusion" }, { type: "reassessment" }],
    conditionalRequirements: [{ whenEventType: "acs_escalation", require: [{ type: "cpr" }, { type: "defibrillation" }] }],
    honestPath: [assess("pulse"), { type: "obtain_ecg" }, { type: "give_aspirin" }, { type: "activate_reperfusion" }, REASSESS, END],
  },
  {
    id: "hypoxia-to-arrest",
    family: "respiratory",
    guidelines: ["Respiratory failure: oxygenate and ventilate early; untreated hypoxia progresses to bradycardia and arrest."],
    requiredEvents: [{ type: "oxygen" }, { type: "ventilation" }, { type: "assessment" }, { type: "reassessment" }],
    honestPath: [assess("breathing"), ...repeat({ type: "give_oxygen" }, 8), ...repeat({ type: "assist_ventilation" }, 8), REASSESS, END],
  },
  {
    id: "rosc-post-arrest",
    family: "post_arrest",
    guidelines: ["2025 Post-Cardiac Arrest Care: support oxygenation, ventilation and perfusion; reassess; avoid hypotension and hypoxaemia."],
    requiredEvents: [{ type: "assessment" }],
    requiresPostRoscCare: true,
    treatmentEventTypes: ["oxygen", "ventilation", "perfusion_support"],
    honestPath: [assess("blood_pressure"), { type: "support_perfusion" }, ...repeat({ type: "give_oxygen" }, 5), ...repeat({ type: "assist_ventilation" }, 3), REASSESS, END],
  },
];

export function getAdultAclsCaseDefinition(id: AdultAclsScenarioId): AdultAclsCaseDefinition {
  const definition = ADULT_ACLS_CASE_DEFINITIONS.find((item) => item.id === id);
  if (!definition) throw new Error(`No ACLS case definition for ${id}`);
  return definition;
}
