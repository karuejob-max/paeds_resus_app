export type DepartmentErcoAssignmentInput = {
  institutionId: number;
  departmentId: number;
  coordinatorUserId: number;
  backupUserId?: number | null;
  effectiveFrom: string;
  effectiveUntil?: string | null;
};

export type DepartmentErcoAssignmentValidation =
  | { valid: true }
  | { valid: false; reason: string };

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateDepartmentErcoAssignment(
  input: DepartmentErcoAssignmentInput,
): DepartmentErcoAssignmentValidation {
  if (!Number.isInteger(input.institutionId) || input.institutionId <= 0) {
    return { valid: false, reason: "A valid institution is required." };
  }
  if (!Number.isInteger(input.departmentId) || input.departmentId <= 0) {
    return { valid: false, reason: "A valid department is required." };
  }
  if (!Number.isInteger(input.coordinatorUserId) || input.coordinatorUserId <= 0) {
    return { valid: false, reason: "A valid ERCo provider is required." };
  }
  if (input.backupUserId != null && (!Number.isInteger(input.backupUserId) || input.backupUserId <= 0)) {
    return { valid: false, reason: "The backup provider is invalid." };
  }
  if (input.backupUserId != null && input.backupUserId === input.coordinatorUserId) {
    return { valid: false, reason: "The backup provider must be different from the ERCo." };
  }
  if (!isIsoDate(input.effectiveFrom)) {
    return { valid: false, reason: "The effective-from date must be a valid ISO date." };
  }
  if (input.effectiveUntil != null) {
    if (!isIsoDate(input.effectiveUntil)) {
      return { valid: false, reason: "The effective-until date must be a valid ISO date." };
    }
    if (input.effectiveUntil < input.effectiveFrom) {
      return { valid: false, reason: "The effective-until date cannot be before the effective-from date." };
    }
  }
  return { valid: true };
}

export function canUseDepartmentErcoAssignment(input: {
  assignmentStatus: string;
  acceptedAt: Date | string | null;
  effectiveFrom: string;
  effectiveUntil?: string | null;
  asOfDate: string;
}): boolean {
  if (input.assignmentStatus !== "active" || input.acceptedAt == null) return false;
  if (input.asOfDate < input.effectiveFrom) return false;
  if (input.effectiveUntil != null && input.asOfDate > input.effectiveUntil) return false;
  return true;
}
