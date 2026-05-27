/**
 * CSV export for Admin Reports → Maturity KPIs (pilot weekly review).
 * Mission impact and provider conversion stay in separate sections (AGENTS.md §4).
 */

export type MaturityKpiCsvInput = {
  exportedAt: Date;
  windowDays: number;
  missionImpact?: {
    resusSessions30d: number;
    careSignalActiveReporters30d: number;
    holisticLoop: {
      promptsShown: number;
      promptsAccepted: number;
      promptsDismissed: number;
      septicCourseClicks: number;
      acceptanceRate: number;
      careSignalSubmissionsAfterPrompt7d: number;
    };
  };
  activePayingProviders30d?: number;
  conversionFunnel?: {
    roleSelected: number;
    enrollmentStarted: number;
    paymentInitiated: number;
    paymentCompleted: number;
    secondPurchaseClicks: number;
    distinctPayers: number;
    repeatPayers: number;
    secondPurchaseRate: number;
  };
  fellowshipChecklist?: {
    fellowTitleEnabled: boolean;
    summary: { pass: number; fail: number; manual: number; blocked: number };
    items: Array<{ id: string; section: string; label: string; status: string; detail?: string | null }>;
  };
};

function escapeCsvCell(val: string): string {
  if (/[",\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
  return val;
}

function row(cells: (string | number | boolean)[]): string {
  return cells.map((c) => escapeCsvCell(String(c))).join(",");
}

/** Build RFC4180-style CSV for maturity KPI weekly export. */
export function buildMaturityKpiCsv(input: MaturityKpiCsvInput): string {
  const lines: string[] = [];
  const date = input.exportedAt.toISOString().slice(0, 10);

  lines.push(row(["section", "metric", "value", "window_days", "export_date"]));

  const pushMetric = (section: string, metric: string, value: string | number) => {
    lines.push(row([section, metric, value, input.windowDays, date]));
  };

  if (input.missionImpact) {
    const m = input.missionImpact;
    const h = m.holisticLoop;
    pushMetric("mission_impact", "resus_sessions_30d", m.resusSessions30d);
    pushMetric("mission_impact", "care_signal_active_reporters_30d", m.careSignalActiveReporters30d);
    pushMetric("holistic_loop", "prompts_shown", h.promptsShown);
    pushMetric("holistic_loop", "prompts_accepted", h.promptsAccepted);
    pushMetric("holistic_loop", "prompts_dismissed", h.promptsDismissed);
    pushMetric("holistic_loop", "acceptance_rate_pct", h.acceptanceRate);
    pushMetric("holistic_loop", "septic_course_clicks", h.septicCourseClicks);
    pushMetric("holistic_loop", "resusgps_sourced_submissions", h.careSignalSubmissionsAfterPrompt7d);
  }

  if (input.activePayingProviders30d != null) {
    pushMetric("provider_growth", "active_paying_providers_30d", input.activePayingProviders30d);
  }

  if (input.conversionFunnel) {
    const f = input.conversionFunnel;
    pushMetric("provider_conversion", "role_selected", f.roleSelected);
    pushMetric("provider_conversion", "enrollment_started", f.enrollmentStarted);
    pushMetric("provider_conversion", "payment_initiated", f.paymentInitiated);
    pushMetric("provider_conversion", "payment_completed", f.paymentCompleted);
    pushMetric("provider_conversion", "second_purchase_clicks", f.secondPurchaseClicks);
    pushMetric("provider_conversion", "distinct_payers", f.distinctPayers);
    pushMetric("provider_conversion", "repeat_payers", f.repeatPayers);
    pushMetric("provider_conversion", "second_purchase_rate_pct", f.secondPurchaseRate);
  }

  if (input.fellowshipChecklist) {
    const fc = input.fellowshipChecklist;
    pushMetric("fellowship_checklist", "fellow_title_enabled", fc.fellowTitleEnabled ? "true" : "false");
    pushMetric("fellowship_checklist", "pass_count", fc.summary.pass);
    pushMetric("fellowship_checklist", "fail_count", fc.summary.fail);
    pushMetric("fellowship_checklist", "manual_count", fc.summary.manual);
    pushMetric("fellowship_checklist", "blocked_count", fc.summary.blocked);

    lines.push("");
    lines.push(row(["checklist_id", "section", "label", "status", "detail"]));
    for (const item of fc.items) {
      lines.push(row([item.id, item.section, item.label, item.status, item.detail ?? ""]));
    }
  }

  return lines.join("\n");
}

export function downloadMaturityKpiCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
