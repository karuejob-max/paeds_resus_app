export type ActionLogStatus = "open" | "in_progress" | "completed";

const PENDING_SYSTEM_CHANGE_PREFIX = "Pending —";

/** Valid status transitions for institutional action log closure workflow. */
export function isValidActionLogStatusTransition(
  from: ActionLogStatus,
  to: ActionLogStatus
): boolean {
  if (from === to) return true;
  if (from === "completed") return false;
  if (from === "open") return to === "in_progress" || to === "completed";
  if (from === "in_progress") return to === "completed" || to === "open";
  return false;
}

/** Auto-created Care Signal drafts require a real system change before completion. */
export function requiresSystemChangeOnResolve(
  currentSystemChange: string,
  newStatus: ActionLogStatus,
  nextSystemChange?: string
): boolean {
  if (newStatus !== "completed") return false;
  const trimmed = (nextSystemChange ?? currentSystemChange).trim();
  if (trimmed.length < 3) return true;
  if (currentSystemChange.startsWith(PENDING_SYSTEM_CHANGE_PREFIX) && !nextSystemChange?.trim()) {
    return true;
  }
  return false;
}

export function isPendingAutoDraftSystemChange(systemChange: string): boolean {
  return systemChange.startsWith(PENDING_SYSTEM_CHANGE_PREFIX);
}
