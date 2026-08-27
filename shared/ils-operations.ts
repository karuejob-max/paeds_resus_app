/**
 * Shared Institutional Life Support operational contracts.
 *
 * These are workflow states, not clinical claims. The clinical owner must
 * approve the practical checklist and certificate policy before a pilot is
 * accepted. ILS competency, IERS readiness, CPD participation, and AHA review
 * remain separate product signals.
 */

export const ILS_ORDER_STATUSES = [
  "draft",
  "ready_for_payment",
  "payment_pending",
  "paid",
  "in_delivery",
  "completed",
  "blocked",
  "cancelled",
] as const;
export type IlsOrderStatus = (typeof ILS_ORDER_STATUSES)[number];

export const ILS_DELIVERY_SESSION_STATUSES = [
  "proposed",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type IlsDeliverySessionStatus =
  (typeof ILS_DELIVERY_SESSION_STATUSES)[number];

export const ILS_PRACTICAL_RESULTS = [
  "pending",
  "pass",
  "remediation_required",
  "fail",
  "no_show",
  "cancelled",
] as const;
export type IlsPracticalResult = (typeof ILS_PRACTICAL_RESULTS)[number];

export const ILS_OPERATIONAL_CASE_CATEGORIES = [
  "payment",
  "roster",
  "access",
  "delivery",
  "assessment",
  "certificate",
  "aha_credentialing",
  "support",
] as const;
export type IlsOperationalCaseCategory =
  (typeof ILS_OPERATIONAL_CASE_CATEGORIES)[number];

export const ILS_OPERATIONAL_CASE_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;
export type IlsOperationalCaseStatus =
  (typeof ILS_OPERATIONAL_CASE_STATUSES)[number];

export const ILS_SUPPORT_SLA_HOURS = {
  low: 168,
  normal: 72,
  high: 24,
  critical: 4,
} as const;
export type IlsOperationalCasePriority = keyof typeof ILS_SUPPORT_SLA_HOURS;

export function getIlsSupportSlaHours(
  priority: IlsOperationalCasePriority
): number {
  return ILS_SUPPORT_SLA_HOURS[priority];
}

export const ILS_REMINDER_TYPES = [
  "activation",
  "payment",
  "practical",
  "remediation",
  "credentialing",
] as const;
export type IlsReminderType = (typeof ILS_REMINDER_TYPES)[number];

export const ILS_PILOT_SEGMENTS = [
  "training_provider",
  "faith_based_hospital",
] as const;
export type IlsPilotSegment = (typeof ILS_PILOT_SEGMENTS)[number];

export const ILS_PILOT_ACCEPTANCE_THRESHOLDS = {
  paymentToAccessSuccessPercent: 90,
  activationWithin7dPercent: 80,
  cognitiveWithin30dPercent: 80,
  practicalOpportunityWithin14dPercent: 90,
} as const;

export type IlsPilotMetricsSnapshot = {
  paymentToAccessSuccessPercent: number;
  activationWithin7dPercent: number;
  cognitiveWithin30dPercent: number;
  practicalOpportunityWithin14dPercent: number;
};

export function getIlsPilotAcceptanceGaps(
  metrics: IlsPilotMetricsSnapshot
): string[] {
  const gaps: string[] = [];
  if (
    metrics.paymentToAccessSuccessPercent <
    ILS_PILOT_ACCEPTANCE_THRESHOLDS.paymentToAccessSuccessPercent
  )
    gaps.push("payment-to-access success ≥90%");
  if (
    metrics.activationWithin7dPercent <
    ILS_PILOT_ACCEPTANCE_THRESHOLDS.activationWithin7dPercent
  )
    gaps.push("provider activation within 7 days ≥80%");
  if (
    metrics.cognitiveWithin30dPercent <
    ILS_PILOT_ACCEPTANCE_THRESHOLDS.cognitiveWithin30dPercent
  )
    gaps.push("cognitive completion within 30 days ≥80%");
  if (
    metrics.practicalOpportunityWithin14dPercent <
    ILS_PILOT_ACCEPTANCE_THRESHOLDS.practicalOpportunityWithin14dPercent
  )
    gaps.push("practical opportunity within 14 days ≥90%");
  return gaps;
}

/**
 * Evidence labels are intentionally broad until the clinical owner signs off
 * the programme-specific assessment checklist. The platform stores evidence;
 * it does not invent the clinical pass standard.
 */
export const ILS_PRACTICAL_EVIDENCE_AREAS = [
  "required_skills_checklist",
  "scenario_performance",
  "team_communication",
  "escalation_and_safety",
] as const;
export type IlsPracticalEvidenceArea =
  (typeof ILS_PRACTICAL_EVIDENCE_AREAS)[number];

export type IlsPracticalEvidence = Partial<
  Record<IlsPracticalEvidenceArea, string>
>;

export type IlsDeliveryReadinessInput = {
  providerCount: number;
  paymentStatus: "pending" | "completed" | "failed";
  deliverySessionStatus?: IlsDeliverySessionStatus | null;
  capacityConfirmed: boolean;
  instructorConfirmed: boolean;
  venueConfirmed: boolean;
  equipmentConfirmed: boolean;
  claimsAcknowledged: boolean;
  rosterConfirmed: boolean;
  practicalDateConfirmed: boolean;
};

export function getIlsDeliveryReadinessGaps(
  input: IlsDeliveryReadinessInput
): string[] {
  const gaps: string[] = [];
  if (input.providerCount < 1) gaps.push("provider roster");
  if (input.deliverySessionStatus !== "confirmed")
    gaps.push("confirmed delivery session");
  if (input.paymentStatus !== "completed") gaps.push("payment confirmation");
  if (!input.capacityConfirmed) gaps.push("available delivery capacity");
  if (!input.instructorConfirmed) gaps.push("approved instructor");
  if (!input.venueConfirmed) gaps.push("venue");
  if (!input.equipmentConfirmed) gaps.push("equipment plan");
  if (!input.claimsAcknowledged)
    gaps.push("certificate and AHA boundary acknowledgement");
  if (!input.rosterConfirmed) gaps.push("final provider roster confirmation");
  if (!input.practicalDateConfirmed) gaps.push("practical assessment date");
  return gaps;
}

export function isIlsOrderReadyForPayment(
  input: Omit<IlsDeliveryReadinessInput, "paymentStatus">
): boolean {
  return (
    getIlsDeliveryReadinessGaps({
      ...input,
      deliverySessionStatus: "confirmed",
      paymentStatus: "completed",
    }).filter(gap => gap !== "payment confirmation").length === 0
  );
}

export function shouldReleaseIlsCapacityOnPaymentFailure(input: {
  orderStatus: IlsOrderStatus;
  paymentStatus: "pending" | "completed" | "failed";
}): boolean {
  return (
    input.paymentStatus !== "completed" &&
    ["draft", "ready_for_payment", "payment_pending"].includes(
      input.orderStatus
    )
  );
}

export function getIlsAssessmentGovernanceGaps(input: {
  result: IlsPracticalResult;
  checklistVersion?: string | null;
  assessorCalibrationConfirmed: boolean;
  hasSecondAssessor: boolean;
}): string[] {
  const gaps: string[] = [];
  if (!input.checklistVersion?.trim()) gaps.push("checklist version");
  if (!input.assessorCalibrationConfirmed)
    gaps.push("assessor calibration confirmation");
  if (input.result === "remediation_required" && !input.hasSecondAssessor)
    gaps.push("second approved assessor");
  return gaps;
}

export function isIlsCertificateEligible(input: {
  paymentStatus: "pending" | "completed" | "failed";
  cognitiveModulesComplete: boolean;
  practicalResult: IlsPracticalResult;
}): boolean {
  return (
    input.paymentStatus === "completed" &&
    input.cognitiveModulesComplete &&
    input.practicalResult === "pass"
  );
}

export function isIlsReminderDue(input: {
  sentAt: Date | null | undefined;
  dueAt: Date;
  now?: Date;
}): boolean {
  const now = input.now ?? new Date();
  return !input.sentAt && now.getTime() >= input.dueAt.getTime();
}

export function canReplaceIlsProvider(input: {
  orderStatus: IlsOrderStatus;
  sessionStatus: IlsDeliverySessionStatus;
  cognitiveModulesComplete: boolean;
  practicalSkillsSignedOff: boolean;
  activatedAt?: Date | null;
  lastActivityAt?: Date | null;
}): boolean {
  if (["in_delivery", "completed", "cancelled"].includes(input.orderStatus))
    return false;
  if (["in_progress", "completed", "cancelled"].includes(input.sessionStatus))
    return false;
  if (input.cognitiveModulesComplete || input.practicalSkillsSignedOff)
    return false;
  if (
    input.activatedAt &&
    input.lastActivityAt &&
    input.lastActivityAt.getTime() > input.activatedAt.getTime()
  )
    return false;
  return true;
}
