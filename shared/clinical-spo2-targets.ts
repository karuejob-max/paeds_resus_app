/**
 * Harmonised paediatric SpO₂ targets (WHO IMCI + PALS/GINA teaching).
 * Used by micro-course seeds and ResusGPS bedside strings.
 */

/** Minimum acceptable SpO₂ in severe illness (WHO IMCI danger signs / severe pneumonia). */
export const SPO2_TARGET_MIN_PERCENT = 90;

/** Preferred upper titration target when monitoring allows (avoid routine hyperoxia). */
export const SPO2_TARGET_OPTIMAL_PERCENT = 94;

/** Life-threatening asthma / critical hypoxia — higher target acceptable briefly. */
export const SPO2_TARGET_ASTHMA_MAX_PERCENT = 98;

export const SPO2_TARGET_TEACHING_HTML = `<div class="clinical-note"><h4>SpO₂ targets (harmonised)</h4><p><strong>WHO / severe illness:</strong> treat hypoxia — aim <strong>SpO₂ ≥90%</strong>. When monitoring allows, titrate toward <strong>90–94%</strong> and avoid routine hyperoxia.</p><p><strong>Life-threatening asthma:</strong> may require <strong>94–98%</strong> briefly with high-flow O₂ — still reassess and wean when safe.</p></div>`;

export const SPO2_TARGET_RESUS_DETAIL = `Target SpO₂ ≥${SPO2_TARGET_MIN_PERCENT}% (WHO severe illness); titrate toward ${SPO2_TARGET_MIN_PERCENT}–${SPO2_TARGET_OPTIMAL_PERCENT}% when feasible — avoid routine hyperoxia.`;

export const SPO2_TARGET_ASTHMA_DETAIL = `Life-threatening asthma: aim SpO₂ ${SPO2_TARGET_OPTIMAL_PERCENT}–${SPO2_TARGET_ASTHMA_MAX_PERCENT}% with high-flow O₂; wean when safe.`;
