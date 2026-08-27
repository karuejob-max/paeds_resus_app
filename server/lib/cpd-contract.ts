export const CPD_ATTENDANCE_STATUSES = [
  "registered",
  "checked_in",
  "attendance_verified",
  "excused",
  "cancelled",
] as const;

export type CpdAttendanceStatus = (typeof CPD_ATTENDANCE_STATUSES)[number];

export const CPD_LIFECYCLE_STATUSES = [
  "draft",
  "scheduled",
  "open",
  "attendance_review",
  "closed",
  "certificates_issued",
  "archived",
  "cancelled",
  "voided",
] as const;

export type CpdLifecycleStatus = (typeof CPD_LIFECYCLE_STATUSES)[number];

export function countsAsVerifiedAttendance(status: string | null | undefined): boolean {
  return status === "attendance_verified";
}

export function canRegisterForEvent(status: string | null | undefined, isOpen: boolean): boolean {
  return isOpen && (status === "open" || status === "scheduled" || status == null);
}

export function canArchiveEvent(status: string | null | undefined): boolean {
  return status !== "archived" && status !== "voided";
}

/**
 * Attendance review is forward-only once a record reaches a terminal state.
 * A same-status review remains idempotent so an administrator may add a clearer
 * reason without reopening or reversing a certificate-eligible record.
 */
export function canReviewAttendanceTransition(
  previousStatus: string | null | undefined,
  nextStatus: string,
): boolean {
  if (previousStatus === nextStatus) return true;
  if (["attendance_verified", "excused", "cancelled"].includes(previousStatus ?? "")) return false;
  return CPD_ATTENDANCE_STATUSES.includes(nextStatus as CpdAttendanceStatus);
}

export function canVoidEvent(attendeeCount: number): boolean {
  return attendeeCount >= 0;
}

const NURSING_CADRE_VALUES = new Set([
  "msn", "hnd", "bsn", "bsm", "other undergraduate", "krchn", "krnm", "krn", "krm",
  "other diploma rn", "kechn", "other certificate rn", "other rn", "rn", "registered nurse", "staff nurse", "nursing", "nursing student",
  "nursing intern", "midwife", "midwifery",
]);

function isNursingCadre(value: string | null | undefined): boolean {
  const cadre = value?.trim().toLowerCase() ?? "";
  return NURSING_CADRE_VALUES.has(cadre) || /\b(rn|nurse|nursing|midwi)/i.test(cadre);
}

function isClinicalCadre(value: string | null | undefined): boolean {
  const cadre = value?.trim().toLowerCase() ?? "";
  if (!cadre) return false;
  return !/(support|administrat|housekeep|kitchen|security|driver|finance|records|clerical|hr|human resources|porter|cleaning|non[- ]clinical)/i.test(cadre);
}

export function isAudienceEligible(args: {
  audienceScope: string | null | undefined;
  audienceLabel: string | null | undefined;
  attendeeCadre: string | null | undefined;
  attendeeDepartmentId: number | null | undefined;
  eventDepartmentId: number | null | undefined;
}): boolean {
  const scope = args.audienceScope ?? "facility_wide";
  if (scope === "facility_wide") return true;
  if (scope === "nursing_wide") return isNursingCadre(args.attendeeCadre);
  if (scope === "clinical" || scope === "m_and_m") return isClinicalCadre(args.attendeeCadre);
  if (scope === "department") {
    return args.eventDepartmentId == null || args.attendeeDepartmentId === args.eventDepartmentId;
  }
  if (scope === "other_cadre") {
    const wanted = args.audienceLabel?.trim().toLowerCase();
    const actual = args.attendeeCadre?.trim().toLowerCase();
    return Boolean(wanted && actual && wanted === actual);
  }
  return false;
}

export function disambiguatedMemberLabel(member: {
  fullName: string;
  department?: string | null;
  cadre?: string | null;
  email?: string | null;
}): string {
  const parts = [member.fullName.trim()];
  if (member.department?.trim()) parts.push(member.department.trim());
  if (member.cadre?.trim()) parts.push(member.cadre.trim());
  if (member.email?.trim()) parts.push(member.email.trim());
  return parts.join(" · ");
}
