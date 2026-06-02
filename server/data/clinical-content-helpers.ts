/**
 * Shared HTML snippets for fellowship micro-course modules (clinical governance).
 */

export const CLINICAL_EDUCATION_DISCLAIMER = `<p class="text-sm border-l-4 border-amber-500 pl-3 py-1 my-4 bg-amber-50 dark:bg-amber-950/30"><strong>Educational use only.</strong> Apply your facility protocol and senior review. Recommendations + choices — not a substitute for local MOH policy.</p>`;

export const NEONATE_CALLOUT = `<div class="clinical-note border-l-4 border-rose-500 pl-3 my-3"><h4>Neonates (&lt;28 days or corrected gestation &lt;44 weeks)</h4><p><strong>Do not use benzodiazepines as first-line for seizures in neonates.</strong> Treat hypoglycaemia, infection, and electrolytes; use phenobarbital per local protocol and senior/paediatric neurology advice.</p></div>`;

export const GLUCOSE_MMOL_NOTE = `<p><strong>Glucose units:</strong> We teach <strong>mmol/L</strong> (Kenya/East Africa). Example: severe hyperglycaemia often &gt;14 mmol/L with ketones and acidosis — confirm with your lab.</p>`;

export const DKA_FLUIDS_CONFLICT = `<div class="clinical-note"><h4>Fluids: international vs common practice</h4><ol><li><strong>International (ISPAD):</strong> Isotonic fluid resuscitation; consider <strong>balanced crystalloid</strong> (e.g. Plasma-Lyte, Hartmann’s) where available — may reduce hyperchloraemic acidosis vs large volumes of 0.9% NaCl alone.</li><li><strong>Often taught locally:</strong> 0.9% NaCl remains widely used — note risk of <strong>hyperchloraemic acidosis</strong> with high chloride loads.</li><li><strong>Our recommendation:</strong> Slow, measured rehydration; 10 mL/kg boluses only if perfusion compromised; avoid rapid correction — you choose with understanding.</li></ol></div>`;

export const DKA_INSULIN_KETONES = `<div class="clinical-note"><h4>Insulin: glucose alone is not enough</h4><p>Continue insulin until <strong>ketosis is resolving</strong> (falling beta-hydroxybutyrate / urine ketones) and acidosis improving — not only until glucose normalises. When glucose &lt;14 mmol/L, add dextrose to fluids and <strong>continue insulin</strong> until ketosis clears.</p></div>`;

export const DKA_POTASSIUM_SAFETY = `<div class="clinical-note border-l-4 border-rose-500 pl-3 my-3"><h4>Potassium — never IV push in children</h4><p><strong>Never give KCl as an IV bolus/push</strong> — risk of fatal arrhythmia. If K⁺ &lt;3.5 mmol/L: <strong>hold insulin</strong>, add KCl to IV fluids (typically 20–40 mmol/L) or infuse replacement slowly (max ~0.5 mEq/kg/hr with monitoring). Recheck K⁺ every 2–4 h.</p></div>`;

export const SE_BENZO_CONFLICT = `<div class="clinical-note"><h4>First-line anticonvulsants</h4><ol><li><strong>International:</strong> Buccal/IM/IV <strong>midazolam</strong> or IV <strong>lorazepam</strong> (0.1 mg/kg, max 4 mg) — effective, shorter redistribution than diazepam.</li><li><strong>Kenya / low-resource:</strong> <strong>Diazepam</strong> IV/PR often available — useful but watch <strong>respiratory depression</strong> and repeat dosing limits.</li><li><strong>Neonates:</strong> See neonate callout — avoid benzos as first-line.</li></ol></div>`;

export const HYPOGLYCEMIA_MMOL_NOTE = `<p><strong>Hypoglycaemia:</strong> Treat when glucose &lt;3.3 mmol/L (&lt;60 mg/dL). Give 0.5 g/kg dextrose (2 mL/kg of 25% dextrose or equivalent) and recheck in 15 min.</p>`;

export const ASTHMA_STEROIDS = `<div class="clinical-note"><h4>Systemic steroids (acute asthma)</h4><ul><li><strong>Dexamethasone</strong> 0.6 mg/kg (max 16 mg) PO/IM — long action, single dose option.</li><li><strong>Prednisolone</strong> 1–2 mg/kg (max 40 mg) PO daily.</li><li><strong>Hydrocortisone</strong> 4 mg/kg IV if unable to take oral or severe — not the only steroid taught.</li></ul></div>`;

export const SHOCK_FLUIDS_FEAST = `<div class="clinical-note"><h4>Fluids: international vs FEAST-aware practice</h4><ol><li><strong>International (Surviving Sepsis):</strong> 10–20 mL/kg isotonic boluses with reassessment; up to 40–60 mL/kg in first hour if shock persists.</li><li><strong>FEAST context (Africa):</strong> In some febrile children without clear hypovolaemia, large unmonitored boluses may harm — <strong>reassess after each bolus</strong>.</li><li><strong>Our recommendation:</strong> Give boluses when perfusion is poor; stop and escalate if no improvement or signs of fluid overload.</li></ol></div>`;

export const SHOCK_VASOPRESSORS = `<div class="clinical-note"><h4>Vasopressors: international vs Kenya reality</h4><ol><li><strong>International:</strong> <strong>Noradrenaline</strong> first-line for warm vasodilatory septic shock; <strong>adrenaline</strong> for cold shock / low cardiac output.</li><li><strong>Kenya / LMIC:</strong> <strong>Adrenaline infusion</strong> often more available — use per local ICU protocol when noradrenaline unavailable.</li><li><strong>Central access preferred</strong> for vasopressors; peripheral short-term only with monitoring.</li></ol></div>`;

export const PNEUMONIA_WHO_KENYA = `<div class="clinical-note"><h4>Pneumonia antibiotics: WHO vs hospital practice</h4><ol><li><strong>WHO IMCI (outpatient/severe):</strong> Amoxicillin high-dose PO; refer if danger signs.</li><li><strong>Hospital / severe:</strong> IV <strong>ampicillin + gentamicin</strong> (Kenya MOH common) OR <strong>ceftriaxone</strong> ± macrolide for atypical cover.</li><li><strong>Start within 1 hour</strong> of severe pneumonia recognition; oxygen target SpO₂ ≥90% (titrate 90–94% when feasible).</li></ol></div>`;

export const ANAPHYLAXIS_ADRENALINE = `<div class="clinical-note"><h4>Adrenaline (epinephrine): same drug, two names</h4><p><strong>IM adrenaline 0.01 mg/kg</strong> (1:1000) anterolateral thigh — max 0.5 mg. Repeat every 5–15 min if needed. Kenya formularies often say <strong>adrenaline</strong>; international texts say <strong>epinephrine</strong> — identical molecule.</p></div>`;

export const MENINGITIS_ABX_EARLY = `<div class="clinical-note"><h4>Empiric antibiotics before LP</h4><p>Do <strong>not</strong> delay antibiotics for LP if meningitis suspected — give <strong>ceftriaxone</strong> (or local MOH first-line) immediately after blood culture if possible. LP may be deferred if unstable or contraindicated.</p></div>`;

export const MALARIA_ARTESUNATE = `<div class="clinical-note"><h4>Severe malaria: artesunate first-line</h4><p><strong>IV/IM artesunate</strong> 3 mg/kg at 0, 12, 24 h (WHO) — preferred over quinine. Monitor glucose in <strong>mmol/L</strong> (hypoglycaemia common). Transition to oral ACT when tolerating.</p></div>`;

export const TRAUMA_ABCDE = `<div class="clinical-note"><h4>Primary survey order</h4><p><strong>A</strong>irway + C-spine → <strong>B</strong>reathing → <strong>C</strong>irculation (haemorrhage control) → <strong>D</strong>isability → <strong>E</strong>xposure. Treat life threats as found — do not complete the alphabet before fixing ABC problems.</p></div>`;

export const TRAUMA_HEAD_INJURY = `<div class="clinical-note border-l-4 border-rose-500 pl-3 my-3"><h4>Head injury red flags (children)</h4><ul><li>GCS falling, persistent vomiting, post-traumatic seizure</li><li>Significant mechanism (high fall, RTA, non-accidental injury)</li><li>Abnormal pupils, focal neurology, bulging fontanelle (infant)</li><li><strong>Action:</strong> prevent hypoxia/hypotension; CT per local protocol; neurosurgery if mass lesion/herniation</li></ul></div>`;

export const TRAUMA_HEMORRHAGE = `<div class="clinical-note"><h4>Haemorrhage control</h4><ul><li>Direct pressure → tourniquet (limb) if needed → pelvic binder (suspected pelvic fracture)</li><li>10–20 mL/kg crystalloid with reassessment; blood products early in massive haemorrhage</li><li>Prevent hypothermia — warm fluids, blankets</li></ul></div>`;

export const BURNS_FLUID_ESCHAR = `<div class="clinical-note"><h4>Burn resuscitation &amp; eschar</h4><ol><li><strong>Parkland</strong> estimates fluid — <strong>titrate to urine output</strong> (0.5–1 mL/kg/hr; &gt;1 if myoglobinuria).</li><li><strong>Escharotomy</strong> for circumferential full-thickness burns with compartment signs — not elective debridement.</li><li><strong>Referral:</strong> &gt;10% partial-thickness, &gt;5% full-thickness, face/hands/perineum, inhalation injury, circumferential burns.</li></ol></div>`;

export const BURNS_INFECTION = `<div class="clinical-note"><h4>Burn wound infection</h4><p>Leading cause of death in major burns. Early debridement, topical silver sulfadiazine/mafenide, sterile dressings. Sepsis signs: fever, tachycardia, thrombocytopenia, hyperglycaemia, wound discolouration — broad-spectrum antibiotics + surgical review.</p></div>`;

export const CARDIOGENIC_INOTROPES = `<div class="clinical-note"><h4>Inotropes: international vs Kenya reality</h4><ol><li><strong>International:</strong> <strong>Dobutamine</strong> (contractility) ± <strong>milrinone</strong> (afterload reduction in RV/LV failure); <strong>noradrenaline</strong> if vasoplegia.</li><li><strong>Kenya / LMIC:</strong> <strong>Dopamine</strong> and <strong>adrenaline</strong> infusions often available — use per ICU protocol; watch arrhythmias and extravasation.</li><li><strong>Pitfalls:</strong> avoid repeated fluid boluses in cardiogenic shock; milrinone may cause hypotension — start low with BP monitoring; do not use inotropes without monitoring.</li></ol></div>`;

export const MENINGITIS_ICU = `<div class="clinical-note"><h4>ICU monitoring in meningitis</h4><ul><li>Hourly neuro checks (GCS, pupils); treat seizures promptly</li><li>Head elevation 30°, neutral neck position</li><li>Serial lactate, glucose, electrolytes; blood cultures before antibiotics when possible</li></ul></div>`;

export const MENINGITIS_SIADH = `<div class="clinical-note border-l-4 border-rose-500 pl-3 my-3"><h4>Hyponatraemia / SIADH — fluid caution</h4><p>Meningitis may cause SIADH with low sodium. <strong>Do not give hypotonic fluids</strong> (plain 5% dextrose without Na⁺) for hyponatraemia — risk of cerebral oedema. Use isotonic fluids, treat seizures, senior review; hypertonic saline only per specialist protocol if severe symptomatic hyponatraemia.</p></div>`;

export const MENINGITIS_SEIZURES = `<div class="clinical-note"><h4>Seizures in meningitis</h4><p>Treat with benzodiazepines per Status Epilepticus course (neonates: no benzos first-line). Correct hypoglycaemia and electrolytes. Persistent seizures → intubation/ICU and imaging for subdural empyema / stroke.</p></div>`;

export const SPO2_TARGET_NOTE = `<p><strong>SpO₂:</strong> WHO severe illness target <strong>≥90%</strong>; titrate toward <strong>90–94%</strong> when monitoring allows — avoid routine hyperoxia. Life-threatening asthma may need 94–98% briefly.</p>`;

export const ANAEMIA_TRANSFUSION_THRESHOLDS = `<div class="clinical-note"><h4>Transfusion thresholds: international vs Kenya practice</h4><ol><li><strong>WHO / evidence:</strong> Transfuse packed red cells if <strong>Hb &lt;4 g/dL</strong> (or &lt;40 g/L) regardless of symptoms; if <strong>Hb 4–6 g/dL</strong> with shock, heart failure, or altered consciousness.</li><li><strong>Cardiac failure / overload risk:</strong> Use <strong>10 mL/kg</strong> (not 20 mL/kg) over 3–4 h with furosemide mid-transfusion if needed — FEAST context: avoid fluid overload in compensated severe anaemia.</li><li><strong>Kenya blood bank reality:</strong> Stock-outs, cross-match delays, and cold-chain breaks happen — document indication, consent, and transfusion reaction plan; iron + malaria treatment may be life-saving when blood is unavailable.</li></ol></div>`;

export const ANAEMIA_IRON_VS_TRANSFUSION = `<div class="clinical-note"><h4>Iron vs transfusion</h4><p><strong>Transfusion</strong> treats acute hypoxia risk now; <strong>iron</strong> (oral ferrous sulfate 3–6 mg/kg/day elemental iron + vitamin C) rebuilds stores over weeks. After malaria or haemolysis, treat infection first; transfuse if Hb threatens perfusion — do not delay artesunate for severe malaria when indicated.</p></div>`;

export const ANAEMIA_SICKLE_MALARIA = `<div class="clinical-note border-l-4 border-rose-500 pl-3 my-3"><h4>Sickle crisis &amp; malaria co-morbidity</h4><ul><li><strong>Vaso-occlusive crisis:</strong> Hydration, analgesia (weight-based), oxygen if hypoxic — transfuse if Hb drops acutely or stroke suspected (exchange transfusion per specialist protocol).</li><li><strong>Acute splenic sequestration:</strong> Sudden pallor, huge spleen, shock — urgent transfusion + senior review.</li><li><strong>Severe malaria + anaemia:</strong> Artesunate first; transfuse per threshold — watch for pulmonary oedema after rapid transfusion.</li></ul></div>`;

export const AKI_RRT_INDICATIONS = `<div class="clinical-note"><h4>RRT indications (KDIGO-aligned)</h4><ul><li><strong>AEIOU:</strong> <strong>A</strong>cidosis (pH &lt;7.1 refractory), <strong>E</strong>lectrolytes (K⁺ &gt;6.5 mmol/L unresponsive), <strong>I</strong>ntoxication (dialysable toxin), <strong>O</strong>verload (pulmonary oedema unresponsive to diuretics), <strong>U</strong>raemia (encephalopathy, pericarditis, bleeding).</li><li>Start planning RRT early when oliguria persists &gt;24–48 h with rising creatinine despite medical therapy.</li></ul></div>`;

export const AKI_NEPHROTOXIN_AVOID = `<div class="clinical-note border-l-4 border-rose-500 pl-3 my-3"><h4>Avoid nephrotoxic drugs in AKI</h4><p>Hold or dose-adjust: <strong>NSAIDs</strong>, <strong>aminoglycosides</strong>, <strong>vancomycin</strong> (levels), <strong>ACE inhibitors</strong>, contrast unless life-saving. Review all IV fluids for potassium load.</p></div>`;

export const AKI_PD_LMIC_NOTE = `<div class="clinical-note"><h4>RRT in LMIC: haemodialysis vs peritoneal dialysis</h4><ol><li><strong>International / tertiary:</strong> Haemodialysis or CRRT when ICU access and vascular access exist — first-line where available.</li><li><strong>LMIC option:</strong> <strong>Peritoneal dialysis (PD)</strong> can be life-saving when HD unavailable — <strong>not default first-line</strong> where HD/ICU exists; requires trained team, sterile technique, and peritonitis vigilance.</li><li><strong>Our recommendation:</strong> Stabilise K⁺, acidosis, and volume first; escalate to nearest RRT-capable centre; PD per local protocol when HD impossible.</li></ol></div>`;

export const AKI_ELECTROLYTES_MMOL = `<div class="clinical-note"><h4>Electrolytes in AKI (mmol/L)</h4><ul><li><strong>Hyperkalaemia:</strong> Ca gluconate if ECG changes; insulin + glucose; salbutamol neb; consider RRT if refractory — <strong>never KCl IV push</strong>.</li><li><strong>Hyperphosphataemia:</strong> Restrict intake; phosphate binders if persistent; worsens with rhabdomyolysis/HUS.</li><li><strong>Hyponatraemia:</strong> Usually dilutional — <strong>fluid restrict</strong>; avoid hypotonic fluids.</li></ul></div>`;

export type LmicsResourceTopic =
  | "insulin_no_pump"
  | "diazepam"
  | "fluids"
  | "hypoglycemia";

const LMIC_CALLOUT_BODIES: Record<LmicsResourceTopic, string> = {
  insulin_no_pump: `<div class="clinical-note border-l-4 border-sky-600 pl-3 my-3"><h4>If you only have insulin (no pump)</h4><p>Use <strong>IV insulin infusion</strong> 0.05–0.1 units/kg/h via syringe driver or calibrated drip — <strong>no bolus in children</strong>. If only subcutaneous insulin is available, this course teaches infusion-first; follow senior/MOH protocol and transfer when infusion unavailable.</p></div>`,
  diazepam: `<div class="clinical-note border-l-4 border-sky-600 pl-3 my-3"><h4>If you only have diazepam</h4><p><strong>IV/PR diazepam</strong> 0.2–0.3 mg/kg (max 10 mg) may be used when midazolam/lorazepam are unavailable — monitor respiratory depression and repeat limits. Prefer midazolam when stocked.</p></div>`,
  fluids: `<div class="clinical-note border-l-4 border-sky-600 pl-3 my-3"><h4>If you only have crystalloid (limited blood products)</h4><p><strong>10–20 mL/kg isotonic bolus</strong> (0.9% NaCl or balanced crystalloid) with reassessment after each bolus. Stop if fluid overload; escalate vasopressors/transfer per local ICU capability.</p></div>`,
  hypoglycemia: `<div class="clinical-note border-l-4 border-sky-600 pl-3 my-3"><h4>If you only have dextrose for hypoglycaemia</h4><p>Treat glucose &lt;3.3 mmol/L with <strong>0.5 g/kg dextrose</strong> (2 mL/kg of 25% dextrose or equivalent) and recheck in 15 min. Monitor in mmol/L — severe malaria and DKA pathways overlap.</p></div>`,
};

/** Reusable “If you only have X” callout for LMIC resource constraints (platform safety B3). */
export function lmicsResourceCalloutHtml(topic: LmicsResourceTopic): string {
  return LMIC_CALLOUT_BODIES[topic];
}

/** Printable ward actions checklist appended to P0 module endings (B10). */
export function wardActionsChecklistHtml(actions: string[]): string {
  const items = actions.map((a) => `<li>${a}</li>`).join("");
  return `<section class="ward-actions-checklist border border-slate-300 rounded-lg p-4 my-4 print:break-inside-avoid"><h4>Ward actions checklist</h4><ul class="list-disc pl-5 space-y-1">${items}</ul><p class="text-xs text-muted-foreground mt-2">Print and tick at bedside — educational checklist, not a substitute for local protocol.</p></section>`;
}

export const WARD_ACTIONS_BY_SLUG: Record<string, string[]> = {
  "dka-i": [
    "Confirm IV access and send glucose, ketones, electrolytes, VBG/ABG",
    "Start measured fluids; document hourly neuro checks (cerebral oedema vigilance)",
    "Hold insulin until K⁺ ≥3.5 mmol/L; start infusion only per protocol",
    "Escalate to PICU if GCS falling, severe acidosis, or no improvement",
  ],
  "status-epilepticus-i": [
    "Protect airway; give oxygen; check glucose in mmol/L",
    "Give first-line anticonvulsant weight-based; time the dose",
    "Prepare second-line and intubation kit if seizure continues >5 min",
    "Screen for meningitis/metabolic cause; document times for handover",
  ],
  "asthma-i": [
    "Salbutamol neb/spacer + ipratropium; systemic steroid when indicated",
    "Reassess work of breathing and SpO₂ after each treatment",
    "Admit if silent chest, exhaustion, or SpO₂ not improving",
    "Discharge only with spacer technique teach-back and follow-up plan",
  ],
  "septic-shock-i": [
    "Recognize sepsis; take cultures before antibiotics when possible",
    "Give 10–20 mL/kg isotonic bolus with reassessment (FEAST-aware)",
    "Start empiric antibiotics within 1 hour of recognition",
    "Escalate vasopressors/ICU if perfusion not improving after fluids",
  ],
  "malaria-i": [
    "Confirm severe malaria criteria; check glucose in mmol/L",
    "Give IV/IM artesunate per weight — not artemether IV first-line",
    "Treat hypoglycaemia; monitor for cerebral malaria signs",
    "Transition to oral ACT when tolerating; plan for anaemia/transfusion if needed",
  ],
  "anaphylaxis-i": [
    "IM adrenaline 0.01 mg/kg anterolateral thigh — time the dose",
    "Position supine with legs elevated; give high-flow oxygen",
    "Prepare second dose and IV access; observe for biphasic reaction",
    "Admit if refractory, airway compromise, or need for infusion",
  ],
  "meningitis-i": [
    "Do not delay empiric antibiotics for LP if meningitis suspected",
    "Blood culture then ceftriaxone (or local MOH first-line)",
    "Protect airway; treat seizures; avoid hypotonic fluids (SIADH risk)",
    "Hourly neuro checks; escalate if GCS falling or focal signs",
  ],
  "hypovolemic-shock-i": [
    "Assess perfusion; give 10–20 mL/kg isotonic bolus only if hypovolaemic (FEAST-aware)",
    "Reassess after each bolus; stop if fluid overload or no improvement",
    "Treat cause (haemorrhage, dehydration, burns); activate MTP if massive haemorrhage",
    "Escalate to ICU if shock persists after appropriate fluids",
  ],
  "pneumonia-i": [
    "Recognize severe pneumonia; give oxygen to SpO₂ ≥90%",
    "Blood culture if feasible; start empiric antibiotics within 1 hour",
    "Reassess work of breathing; prepare intubation if tiring or silent chest",
    "Refer if no ICU capability or not improving on first-line therapy",
  ],
  "trauma-i": [
    "ABCDE primary survey; control external haemorrhage",
    "Two large-bore IV access; send FBC, cross-match, lactate",
    "10–20 mL/kg crystalloid with reassessment; blood products early if massive haemorrhage",
    "Prevent hypothermia; document mechanism and neuro status hourly",
  ],
  "burns-i": [
    "Airway assessment for inhalation injury; high-flow oxygen",
    "Calculate % TBSA; start Parkland-based fluid plan with urine output targets",
    "Analgesia weight-based; cover with clean dressing",
    "Refer if >10% TBSA, circumferential, face/hands, or inhalation injury",
  ],
  "cardiogenic-shock-i": [
    "Avoid repeated fluid boluses; treat as pump failure",
    "Oxygen; consider non-invasive ventilation if work of breathing high",
    "Start inotrope per ICU protocol when available; monitor rhythm",
    "Escalate to PICU/cardiology if refractory hypotension or arrhythmia",
  ],
};

/** Slugs that receive LMIC callouts on first module (seed pipeline). */
export const LMIC_CALLOUTS_BY_SLUG: Record<string, LmicsResourceTopic[]> = {
  "dka-i": ["insulin_no_pump"],
  "dka-ii": ["insulin_no_pump"],
  "status-epilepticus-i": ["diazepam"],
  "status-epilepticus-ii": ["diazepam"],
  "hypovolemic-shock-i": ["fluids"],
  "hypovolemic-shock-ii": ["fluids"],
  "septic-shock-i": ["fluids"],
  "septic-shock-ii": ["fluids"],
  "malaria-i": ["hypoglycemia"],
  "malaria-ii": ["hypoglycemia"],
  "trauma-i": ["fluids"],
  "pneumonia-i": ["fluids"],
};

export function appendClinicalFooter(html: string, extras: string[] = []): string {
  const parts = [html, ...extras, CLINICAL_EDUCATION_DISCLAIMER];
  return parts.filter(Boolean).join("\n");
}

/** Seed helper: LMIC callouts on module 1; ward checklist on final module for P0 slugs. */
export function enhanceFellowshipModuleContent(
  catalogSlug: string,
  moduleIndex: number,
  totalModules: number,
  html: string
): string {
  const extras: string[] = [];
  const lmicTopics = LMIC_CALLOUTS_BY_SLUG[catalogSlug];
  if (moduleIndex === 0 && lmicTopics?.length) {
    extras.push(...lmicTopics.map((t) => lmicsResourceCalloutHtml(t)));
  }
  const wardActions = WARD_ACTIONS_BY_SLUG[catalogSlug];
  if (wardActions && moduleIndex === totalModules - 1) {
    extras.push(wardActionsChecklistHtml(wardActions));
  }
  return appendClinicalFooter(html, extras);
}
