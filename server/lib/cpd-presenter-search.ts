export type CpdPresenterSearchScope = "department" | "platform";

/**
 * Full-access CPD roles have a null department assignment and may browse all
 * platform accounts. Department-scoped coordinators have an array (including
 * an empty array) and must remain limited to their department directory.
 */
export function getCpdPresenterSearchScope(
  departmentIds: readonly number[] | null,
): CpdPresenterSearchScope {
  return departmentIds === null ? "platform" : "department";
}
