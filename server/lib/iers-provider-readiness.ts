export type ProviderShiftReadinessAssignment = {
  status?: string | null;
  assignmentStatus?: string | null;
  acceptedAt?: Date | string | null;
};

/**
 * A provider may confirm shift readiness only for an active shift assignment
 * that the named provider explicitly accepted.
 */
export function isProviderShiftReadinessEligible(assignment: ProviderShiftReadinessAssignment): boolean {
  return assignment.status === "active"
    && assignment.assignmentStatus === "active"
    && Boolean(assignment.acceptedAt);
}
