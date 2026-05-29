/**
 * Shared HTML snippets for fellowship micro-course modules (clinical governance).
 */

export const CLINICAL_EDUCATION_DISCLAIMER = `<p class="text-sm border-l-4 border-amber-500 pl-3 py-1 my-4 bg-amber-50 dark:bg-amber-950/30"><strong>Educational use only.</strong> Apply your facility protocol and senior review. Recommendations + choices — not a substitute for local MOH policy.</p>`;

export const NEONATE_CALLOUT = `<div class="clinical-note border-l-4 border-rose-500 pl-3 my-3"><h4>Neonates (&lt;28 days or corrected gestation &lt;44 weeks)</h4><p><strong>Do not use benzodiazepines as first-line for seizures in neonates.</strong> Treat hypoglycaemia, infection, and electrolytes; use phenobarbital per local protocol and senior/paediatric neurology advice.</p></div>`;

export const GLUCOSE_MMOL_NOTE = `<p><strong>Glucose units:</strong> We teach <strong>mmol/L</strong> (Kenya/East Africa). Example: severe hyperglycaemia often &gt;14 mmol/L with ketones and acidosis — confirm with your lab.</p>`;

export const DKA_FLUIDS_CONFLICT = `<div class="clinical-note"><h4>Fluids: international vs common practice</h4><ol><li><strong>International (ISPAD):</strong> Isotonic fluid resuscitation; consider <strong>balanced crystalloid</strong> (e.g. Plasma-Lyte, Hartmann’s) where available — may reduce hyperchloraemic acidosis vs large volumes of 0.9% NaCl alone.</li><li><strong>Often taught locally:</strong> 0.9% NaCl remains widely used — note risk of <strong>hyperchloraemic acidosis</strong> with high chloride loads.</li><li><strong>Our recommendation:</strong> Slow, measured rehydration; 10 mL/kg boluses only if perfusion compromised; avoid rapid correction — you choose with understanding.</li></ol></div>`;

export const DKA_INSULIN_KETONES = `<div class="clinical-note"><h4>Insulin: glucose alone is not enough</h4><p>Continue insulin until <strong>ketosis is resolving</strong> (falling beta-hydroxybutyrate / urine ketones) and acidosis improving — not only until glucose normalises. When glucose &lt;14 mmol/L, add dextrose to fluids and <strong>continue insulin</strong> until ketosis clears.</p></div>`;

export const SE_BENZO_CONFLICT = `<div class="clinical-note"><h4>First-line anticonvulsants</h4><ol><li><strong>International:</strong> Buccal/IM/IV <strong>midazolam</strong> or IV <strong>lorazepam</strong> (0.1 mg/kg, max 4 mg) — effective, shorter redistribution than diazepam.</li><li><strong>Kenya / low-resource:</strong> <strong>Diazepam</strong> IV/PR often available — useful but watch <strong>respiratory depression</strong> and repeat dosing limits.</li><li><strong>Neonates:</strong> See neonate callout — avoid benzos as first-line.</li></ol></div>`;

export const ASTHMA_STEROIDS = `<div class="clinical-note"><h4>Systemic steroids (Level 1)</h4><ul><li><strong>Dexamethasone</strong> 0.6 mg/kg (max 16 mg) PO/IM — long action, single dose option.</li><li><strong>Prednisolone</strong> 1–2 mg/kg (max 40 mg) PO daily.</li><li><strong>Hydrocortisone</strong> 4 mg/kg IV if unable to take oral or severe — not the only steroid taught.</li></ul></div>`;

export function appendClinicalFooter(html: string, extras: string[] = []): string {
  const parts = [html, ...extras, CLINICAL_EDUCATION_DISCLAIMER];
  return parts.filter(Boolean).join("\n");
}
