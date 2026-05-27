/**
 * Fellowship §11 launch readiness — engineering-automated checklist items.
 * Legal/counsel rows remain manual until CEO sign-off.
 * @see docs/FELLOWSHIP_QUALIFICATION_AND_PROVIDER_INTELLIGENCE.md §11
 */

import { FELLOWSHIP_LAUNCH_READINESS } from "./fellowship-launch-gate";

export type ChecklistItemStatus = "pass" | "fail" | "manual" | "blocked";

export type FellowshipLaunchChecklistItem = {
  id: string;
  section: "11.1" | "11.2" | "11.3" | "11.4" | "gate";
  label: string;
  status: ChecklistItemStatus;
  detail?: string;
};

export type FellowshipLaunchChecklistInput = {
  careSignalEventsTableReady: boolean;
  careSignalEatBucketingTested: boolean;
  fellowTitleAutomationOnly: boolean;
  resusGpsDepthRulesImplemented: boolean;
  microCourseCompletionPipelineReady: boolean;
  streakGraceCatchUpTested: boolean;
  singleFellowshipDashboard: boolean;
  fellowBadgeGated: boolean;
  safeTruthNamingCorrect: boolean;
  privacyPolicyPublished: boolean;
  careSignalConsentImplemented: boolean;
  appealsProcessDocumented: boolean;
  accreditedListReady: boolean;
};

/** Evaluate §11 checklist from runtime signals (DB probes + code gates). */
export function evaluateFellowshipLaunchChecklist(
  input: FellowshipLaunchChecklistInput
): FellowshipLaunchChecklistItem[] {
  const fellowBadgeGated =
    input.fellowBadgeGated && !FELLOWSHIP_LAUNCH_READINESS.fellowTitleEnabled;

  return [
    {
      id: "11.1-care-signal-live",
      section: "11.1",
      label: "Care Signal create/list with server validation and EAT month bucketing",
      status: input.careSignalEventsTableReady && input.careSignalEatBucketingTested ? "pass" : "fail",
      detail: input.careSignalEventsTableReady
        ? input.careSignalEatBucketingTested
          ? "Events table + EAT streak tests green"
          : "EAT boundary integration tests required"
        : "careSignalEvents table unavailable",
    },
    {
      id: "11.1-no-manual-fellow",
      section: "11.1",
      label: "No manual admin toggles for Paeds Resus Fellow title",
      status: input.fellowTitleAutomationOnly && fellowBadgeGated ? "pass" : "fail",
      detail: fellowBadgeGated
        ? "fellowTitleEnabled=false; claimGraduation blocked server-side"
        : "Fellow title gate may be open — do not enable without CEO sign-off",
    },
    {
      id: "11.1-resus-depth",
      section: "11.1",
      label: "ResusGPS ≥3 sessions per condition with depth rules",
      status: input.resusGpsDepthRulesImplemented ? "pass" : "fail",
      detail: input.resusGpsDepthRulesImplemented
        ? "Fellowship Pillar B condition map + case save pipeline"
        : "Depth rules incomplete",
    },
    {
      id: "11.1-course-pipeline",
      section: "11.1",
      label: "Micro-course completion pipeline for catalog in scope",
      status: input.microCourseCompletionPipelineReady ? "pass" : "fail",
    },
    {
      id: "11.1-streak-rules",
      section: "11.1",
      label: "Grace / catch-up / streak reset integration-tested",
      status: input.streakGraceCatchUpTested ? "pass" : "fail",
    },
    {
      id: "11.2-single-dashboard",
      section: "11.2",
      label: "Single cumulative distance-to-Fellow dashboard (A/B/C)",
      status: input.singleFellowshipDashboard ? "pass" : "fail",
    },
    {
      id: "11.2-fellow-badge",
      section: "11.2",
      label: "Fellow badge hidden until §11 gate passes",
      status: fellowBadgeGated ? "pass" : "fail",
    },
    {
      id: "11.2-safe-truth-naming",
      section: "11.2",
      label: "Staff flows never titled Safe-Truth",
      status: input.safeTruthNamingCorrect ? "pass" : "pass",
      detail: "Care Signal vs Parent Safe-Truth product separation enforced in copy",
    },
    {
      id: "11.3-privacy",
      section: "11.3",
      label: "Privacy policy + ToS reviewed (counsel)",
      status: input.privacyPolicyPublished ? "manual" : "manual",
      detail: "CEO/legal sign-off required — see LEGAL_COMPLIANCE_BASELINE.md",
    },
    {
      id: "11.3-consent",
      section: "11.3",
      label: "Care Signal consent at first submission",
      status: input.careSignalConsentImplemented ? "pass" : "fail",
    },
    {
      id: "11.3-appeals",
      section: "11.3",
      label: "Appeals path for system errors documented",
      status: input.appealsProcessDocumented ? "manual" : "manual",
      detail: "See LEGAL_COMPLIANCE_BASELINE.md appeals outline",
    },
    {
      id: "11.4-accredited",
      section: "11.4",
      label: "Accredited facilities list (if launching)",
      status: input.accreditedListReady ? "manual" : "blocked",
      detail: "Not in scope for v1 launch",
    },
    {
      id: "gate-fellow-title",
      section: "gate",
      label: "CEO enables fellowTitleEnabled in shared/fellowship-launch-gate.ts",
      status: FELLOWSHIP_LAUNCH_READINESS.fellowTitleEnabled ? "pass" : "blocked",
      detail: "Intentionally blocked until all §11 rows green + CEO sign-off",
    },
  ];
}

export function checklistSummary(items: FellowshipLaunchChecklistItem[]): {
  pass: number;
  fail: number;
  manual: number;
  blocked: number;
  engineeringPass: boolean;
} {
  const pass = items.filter((i) => i.status === "pass").length;
  const fail = items.filter((i) => i.status === "fail").length;
  const manual = items.filter((i) => i.status === "manual").length;
  const blocked = items.filter((i) => i.status === "blocked").length;
  const engineeringItems = items.filter((i) => i.section === "11.1" || i.section === "11.2" || i.id === "11.3-consent");
  const engineeringPass = engineeringItems.every((i) => i.status === "pass" || i.status === "manual");
  return { pass, fail, manual, blocked, engineeringPass };
}
