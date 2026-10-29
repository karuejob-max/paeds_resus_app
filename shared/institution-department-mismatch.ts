export type DepartmentMismatchActionState =
  | "missing_staff"
  | "already_corrected"
  | "target_inactive"
  | "actionable";

export function classifyDepartmentMismatch(params: {
  staffExists: boolean;
  currentDepartmentId?: number | null;
  targetDepartmentId?: number | null;
  targetDepartmentActive: boolean;
}): DepartmentMismatchActionState {
  if (!params.staffExists) return "missing_staff";
  if (params.targetDepartmentId && params.currentDepartmentId === params.targetDepartmentId) {
    return "already_corrected";
  }
  if (params.targetDepartmentId && !params.targetDepartmentActive) {
    return "target_inactive";
  }
  return "actionable";
}
