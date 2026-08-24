export const SHIFT_ROLE_ASSIGNMENT_STATUSES = [
  "proposed",
  "approved",
  "pending_acceptance",
  "accepted",
  "declined",
  "expired",
  "superseded",
  "ended",
] as const;

export type ShiftRoleAssignmentStatus = typeof SHIFT_ROLE_ASSIGNMENT_STATUSES[number];

const TRANSITIONS: Record<ShiftRoleAssignmentStatus, readonly ShiftRoleAssignmentStatus[]> = {
  proposed: ["approved", "pending_acceptance", "superseded", "expired"],
  approved: ["pending_acceptance", "accepted", "superseded", "expired"],
  pending_acceptance: ["accepted", "declined", "expired", "superseded"],
  accepted: ["superseded", "ended"],
  declined: ["approved", "pending_acceptance", "superseded", "expired"],
  expired: ["approved", "pending_acceptance", "superseded"],
  superseded: [],
  ended: [],
};

export function canTransitionShiftRole(
  from: ShiftRoleAssignmentStatus,
  to: ShiftRoleAssignmentStatus,
): boolean {
  return from === to || TRANSITIONS[from].includes(to);
}

export function assertShiftRoleTransition(
  from: ShiftRoleAssignmentStatus,
  to: ShiftRoleAssignmentStatus,
): void {
  if (!canTransitionShiftRole(from, to)) {
    throw new Error(`Invalid shift-role transition: ${from} -> ${to}`);
  }
}

export function decisionNeedsReason(status: Extract<ShiftRoleAssignmentStatus, "declined" | "superseded">): boolean {
  return status === "declined" || status === "superseded";
}

export function normalizeShiftRoleKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}
