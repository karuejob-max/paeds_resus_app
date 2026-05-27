/**
 * Fellowship §11 launch gate — PSOT §17, FELLOWSHIP_QUALIFICATION doc §11.
 * Do NOT enable fellowTitleEnabled until CEO signs the full checklist.
 */

export const FELLOWSHIP_LAUNCH_READINESS = {
  /** Paeds Resus Fellow title, diploma claim, and credential copy. */
  fellowTitleEnabled: false,
} as const;

/** Whether the user may see "Paeds Resus Fellow" title or claim graduation credentials. */
export function canDisplayFellowTitle(isQualified: boolean): boolean {
  return FELLOWSHIP_LAUNCH_READINESS.fellowTitleEnabled && isQualified;
}

/** User-facing label while §11 gate is open. */
export const FELLOWSHIP_PATHWAY_IN_PROGRESS_LABEL = "Paeds Resus Fellowship pathway (in progress)";
