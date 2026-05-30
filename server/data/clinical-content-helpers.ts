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

export const PNEUMONIA_WHO_KENYA = `<div class="clinical-note"><h4>Pneumonia antibiotics: WHO vs hospital practice</h4><ol><li><strong>WHO IMCI (outpatient/severe):</strong> Amoxicillin high-dose PO; refer if danger signs.</li><li><strong>Hospital / severe:</strong> IV <strong>ampicillin + gentamicin</strong> (Kenya MOH common) OR <strong>ceftriaxone</strong> ± macrolide for atypical cover.</li><li><strong>Start within 1 hour</strong> of severe pneumonia recognition; oxygen target SpO₂ &gt;90%.</li></ol></div>`;

export const ANAPHYLAXIS_ADRENALINE = `<div class="clinical-note"><h4>Adrenaline (epinephrine): same drug, two names</h4><p><strong>IM adrenaline 0.01 mg/kg</strong> (1:1000) anterolateral thigh — max 0.5 mg. Repeat every 5–15 min if needed. Kenya formularies often say <strong>adrenaline</strong>; international texts say <strong>epinephrine</strong> — identical molecule.</p></div>`;

export const MENINGITIS_ABX_EARLY = `<div class="clinical-note"><h4>Empiric antibiotics before LP</h4><p>Do <strong>not</strong> delay antibiotics for LP if meningitis suspected — give <strong>ceftriaxone</strong> (or local MOH first-line) immediately after blood culture if possible. LP may be deferred if unstable or contraindicated.</p></div>`;

export const MALARIA_ARTESUNATE = `<div class="clinical-note"><h4>Severe malaria: artesunate first-line</h4><p><strong>IV/IM artesunate</strong> 3 mg/kg at 0, 12, 24 h (WHO) — preferred over quinine. Monitor glucose in <strong>mmol/L</strong> (hypoglycaemia common). Transition to oral ACT when tolerating.</p></div>`;

export const TRAUMA_ABCDE = `<div class="clinical-note"><h4>Primary survey order</h4><p><strong>A</strong>irway + C-spine → <strong>B</strong>reathing → <strong>C</strong>irculation (haemorrhage control) → <strong>D</strong>isability → <strong>E</strong>xposure. Treat life threats as found — do not complete the alphabet before fixing ABC problems.</p></div>`;

export function appendClinicalFooter(html: string, extras: string[] = []): string {
  const parts = [html, ...extras, CLINICAL_EDUCATION_DISCLAIMER];
  return parts.filter(Boolean).join("\n");
}
