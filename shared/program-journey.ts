export type JourneyPhaseStatus = "complete" | "current" | "locked";

export type JourneyPhase = {
  key: "phase_1" | "phase_2" | "payment" | "phase_3";
  label: string;
  status: JourneyPhaseStatus;
  detail: string;
  lockedReason?: string;
  action?: { label: string; destination: string };
};

export type ProgramJourneyInput = {
  blsProgress: number;
  aclsProgress: number;
  ahaEvidenceVerified: boolean;
  phase2Progress: number;
  paymentProgress: number;
  phase3Complete?: boolean;
  phase1Action?: { label: string; destination: string };
  evidenceAction?: { label: string; destination: string };
  phase2Action?: { label: string; destination: string };
  paymentAction?: { label: string; destination: string };
  phase3Action?: { label: string; destination: string };
  paymentLockedReason?: string;
  phase2LockedReason?: string;
  phase3LockedReason?: string;
};

const clamp = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const percent = (value: number) => Math.round(clamp(value) * 100);

/**
 * Programme progress is an orientation aid, not a clinical competence score.
 * Approved product weighting: BLS 15%, ACLS 15%, verified AHA evidence 10%,
 * Phase 2 35%, payment 25%. Phase 3 is the completion gate and does not add
 * another percentage slice; it converts the journey to 100% only when complete.
 */
export function calculateProgramJourney(input: ProgramJourneyInput) {
  const bls = clamp(input.blsProgress);
  const acls = clamp(input.aclsProgress);
  const evidence = input.ahaEvidenceVerified ? 1 : 0;
  const phase2 = clamp(input.phase2Progress);
  const payment = clamp(input.paymentProgress);
  const baseProgress = bls * 0.15 + acls * 0.15 + evidence * 0.1 + phase2 * 0.35 + payment * 0.25;
  const percentComplete = input.phase3Complete ? 100 : Math.min(99, Math.round(baseProgress * 100));
  const phase1Complete = bls >= 1 && acls >= 1;
  const phase2Complete = phase2 >= 1 && input.ahaEvidenceVerified;

  const phases: JourneyPhase[] = [
    {
      key: "phase_1",
      label: "Phase 1 — Cognitive foundation",
      status: phase1Complete ? "complete" : "current",
      detail: `BLS ${percent(bls)}% · ACLS ${percent(acls)}%${input.ahaEvidenceVerified ? " · AHA evidence verified" : ""}`,
      ...(phase1Complete ? {} : input.phase1Action ? { action: input.phase1Action } : {}),
    },
    {
      key: "phase_2",
      label: "Phase 2 — Online simulations",
      status: phase2Complete ? "complete" : phase1Complete && input.ahaEvidenceVerified ? "current" : "locked",
      detail: `${percent(phase2)}% complete`,
      ...(!phase1Complete || !input.ahaEvidenceVerified
        ? { lockedReason: input.phase2LockedReason ?? "Complete BLS, ACLS, and verify both AHA evidence certificates first." }
        : input.phase2Action
          ? { action: input.phase2Action }
          : {}),
    },
    {
      key: "payment",
      label: "Programme payment",
      status: payment >= 1 ? "complete" : "current",
      detail: `${percent(payment)}% paid`,
      ...(payment >= 1 ? {} : input.paymentAction ? { action: input.paymentAction } : {}),
      ...(payment < 1 && input.paymentLockedReason ? { lockedReason: input.paymentLockedReason } : {}),
    },
    {
      key: "phase_3",
      label: "Phase 3 — Hands-on assessment",
      status: input.phase3Complete ? "complete" : phase2Complete && payment >= 1 ? "current" : "locked",
      detail: input.phase3Complete ? "Certified" : "Awaiting completion",
      ...(!phase2Complete || payment < 1
        ? { lockedReason: input.phase3LockedReason ?? "Complete Phase 2 and the full programme payment first." }
        : input.phase3Action
          ? { action: input.phase3Action }
          : {}),
    },
  ];

  const current = phases.find((phase) => phase.status === "current");
  const nextAction = current?.action ?? phases.find((phase) => phase.action)?.action ?? null;
  return { percentComplete, phases, nextAction };
}

export const PROGRAMME_PROGRESS_WEIGHTING = {
  bls: 15,
  acls: 15,
  ahaEvidence: 10,
  phase2: 35,
  payment: 25,
} as const;
