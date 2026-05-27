/**
 * Mission impact + holistic loop KPI rollups (MATURITY_ROADMAP).
 * Separate from provider growth KPIs — never combine in one headline widget.
 */

export type AnalyticsRow = {
  eventType: string | null;
  eventName: string | null;
  userId: number | null;
  eventData: string | null;
  createdAt?: Date | null;
};

export type HolisticLoopKpis = {
  promptsShown: number;
  promptsAccepted: number;
  promptsDismissed: number;
  septicCourseClicks: number;
  acceptanceRate: number;
  careSignalSubmissionsAfterPrompt7d: number;
};

export type MissionImpactKpis = {
  resusSessions30d: number;
  careSignalActiveReporters30d: number;
  holisticLoop: HolisticLoopKpis;
};

/** Provider conversion funnel from provider_conversion analytics events (rolling window). */
export type ProviderConversionFunnel = {
  windowDays: number;
  roleSelected: number;
  enrollmentStarted: number;
  paymentInitiated: number;
  paymentCompleted: number;
  secondPurchaseClicks: number;
  distinctPayers: number;
  repeatPayers: number;
  secondPurchaseRate: number;
};

function parseEventData(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function eventNameMatches(row: AnalyticsRow, name: string): boolean {
  return (row.eventName ?? "").toLowerCase().includes(name.toLowerCase());
}

export function rollupHolisticLoop(events: AnalyticsRow[]): HolisticLoopKpis {
  const loopEvents = events.filter((e) => e.eventType === "holistic_loop");
  let promptsShown = 0;
  let promptsAccepted = 0;
  let promptsDismissed = 0;
  let septicCourseClicks = 0;

  for (const row of loopEvents) {
    const name = (row.eventName ?? "").toLowerCase();
    if (name.includes("care_signal_prompt_shown")) promptsShown += 1;
    else if (name.includes("care_signal_prompt_accepted")) promptsAccepted += 1;
    else if (name.includes("care_signal_prompt_dismissed")) promptsDismissed += 1;
    else if (name.includes("septic_shock_micro_course_clicked")) septicCourseClicks += 1;
  }

  const acceptanceRate =
    promptsShown > 0 ? Math.round((promptsAccepted / promptsShown) * 100) : 0;

  const careSignalAfterPrompt = events.filter((e) => {
    if (e.eventType !== "care_signal_submission_created") return false;
    const data = parseEventData(e.eventData);
    return data.source === "resusgps" || data.prefillSource === "resusgps";
  });

  return {
    promptsShown,
    promptsAccepted,
    promptsDismissed,
    septicCourseClicks,
    acceptanceRate,
    careSignalSubmissionsAfterPrompt7d: careSignalAfterPrompt.length,
  };
}

export function countDistinctUsers(
  events: AnalyticsRow[],
  filter: (row: AnalyticsRow) => boolean
): number {
  const ids = new Set<number>();
  for (const row of events) {
    if (row.userId != null && filter(row)) ids.add(row.userId);
  }
  return ids.size;
}

export function rollupMissionImpact(events: AnalyticsRow[]): MissionImpactKpis {
  const resusSessions30d = countDistinctUsers(
    events,
    (e) =>
      e.eventType === "resus_session" ||
      (e.eventType === "resus_gps" && eventNameMatches(e, "workspace"))
  );

  const careSignalActiveReporters30d = countDistinctUsers(
    events,
    (e) =>
      e.eventType === "care_signal_submission_created" ||
      (e.eventType === "care_signal" && eventNameMatches(e, "submit"))
  );

  return {
    resusSessions30d,
    careSignalActiveReporters30d,
    holisticLoop: rollupHolisticLoop(events),
  };
}

const FUNNEL_EVENT_ALIASES: Record<keyof Omit<ProviderConversionFunnel, "windowDays" | "secondPurchaseRate">, string[]> = {
  roleSelected: ["provider_role_selected"],
  enrollmentStarted: ["enrollment_modal_opened", "enrollment_started", "free_enrollment_completed"],
  paymentInitiated: ["payment_method_selected", "payment_initiation"],
  paymentCompleted: ["payment_completed_redirect", "payment_completion"],
  secondPurchaseClicks: ["second_purchase_recommendation_clicked"],
  distinctPayers: [],
  repeatPayers: [],
};

export function rollupProviderConversionFunnel(
  events: AnalyticsRow[],
  windowDays = 30
): ProviderConversionFunnel {
  const conversionEvents = events.filter((e) => e.eventType === "provider_conversion");

  const countByNames = (aliases: string[]): number =>
    conversionEvents.filter((e) =>
      aliases.some((a) => (e.eventName ?? "").toLowerCase().includes(a.toLowerCase()))
    ).length;

  const payerIds = new Set<number>();
  const payerPaymentCounts: Record<number, number> = {};

  for (const row of conversionEvents) {
    const name = (row.eventName ?? "").toLowerCase();
    if (
      name.includes("payment_completed") ||
      name.includes("payment_completion") ||
      name.includes("free_enrollment_completed")
    ) {
      if (row.userId != null) {
        payerIds.add(row.userId);
        payerPaymentCounts[row.userId] = (payerPaymentCounts[row.userId] ?? 0) + 1;
      }
    }
  }

  const repeatPayers = Object.values(payerPaymentCounts).filter((c) => c >= 2).length;
  const distinctPayers = payerIds.size;
  const secondPurchaseRate =
    distinctPayers > 0 ? Math.round((repeatPayers / distinctPayers) * 100) : 0;

  return {
    windowDays,
    roleSelected: countByNames(FUNNEL_EVENT_ALIASES.roleSelected),
    enrollmentStarted: countByNames(FUNNEL_EVENT_ALIASES.enrollmentStarted),
    paymentInitiated: countByNames(FUNNEL_EVENT_ALIASES.paymentInitiated),
    paymentCompleted: countByNames(FUNNEL_EVENT_ALIASES.paymentCompleted),
    secondPurchaseClicks: countByNames(FUNNEL_EVENT_ALIASES.secondPurchaseClicks),
    distinctPayers,
    repeatPayers,
    secondPurchaseRate,
  };
}
