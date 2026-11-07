export type AdultAclsPresentationMode = "guided" | "standard";

/**
 * A qualifying launch must render the same mode the server authorised.
 * A mismatch is never safe to render because Guided coaching can leak into
 * a Standard assessment, or a learner can be shown the wrong evidence rules.
 */
export function isAdultAclsModeCompatible(
  requestedMode: AdultAclsPresentationMode,
  authoritativeMode: AdultAclsPresentationMode | null | undefined,
): authoritativeMode is AdultAclsPresentationMode {
  return authoritativeMode === requestedMode;
}

export function getAdultAclsModeLabel(mode: AdultAclsPresentationMode): string {
  return mode === "standard" ? "Standard assessment" : "Guided practice";
}
