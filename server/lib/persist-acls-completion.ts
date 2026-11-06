import { ahaPracticeLabAttempts, simulationWorldEvidence } from "../../drizzle/schema";
import { reconcilePhase2Completion } from "./phase2-completion";
import type { AdultAclsScoreBreakdown, AdultAclsState } from "../../shared/adult-acls-simulation-world";

export type PersistAdultAclsCompletionParams = {
  db: any;
  session: {
    id: number;
    userId: number;
    enrollmentId: number;
    scenarioId: string;
    scenarioVersion: string | null;
    role: string;
    mode?: "guided" | "standard" | null;
  };
  state: AdultAclsState;
  score: number;
  scoreBreakdown: AdultAclsScoreBreakdown;
  userId: number;
};

export type PersistAdultAclsCompletionResult = {
  countsTowardPhase2: boolean;
  evidenceStatus: "review_required" | "formative_only";
  evidence: Record<string, unknown>;
};

/**
 * One persistence boundary for Adult ACLS completions.
 * Missing mode is deliberately Standard for backwards compatibility with
 * sessions created before Guided/Standard was introduced.
 */
export async function persistAdultAclsCompletion({
  db,
  session,
  state,
  score,
  scoreBreakdown,
  userId,
}: PersistAdultAclsCompletionParams): Promise<PersistAdultAclsCompletionResult> {
  const mode = session.mode ?? state.mode ?? "standard";
  const countsTowardPhase2 = mode === "standard";
  const evidence = {
    scenarioId: state.scenarioId,
    durationSeconds: state.elapsedSeconds,
    phase: state.patient.phase,
    roscObserved: state.patient.phase === "post_rosc" || state.patient.trajectory === "rosc",
    criticalFailures: state.criticalFailures.length,
    evidenceStatus: "simulation_performance_recorded" as const,
    competenceClaim: false,
    credentialClaim: false,
    sessionId: session.id,
    scenarioVersion: session.scenarioVersion,
    learnerUserId: session.userId,
    enrollmentId: session.enrollmentId,
    role: session.role,
    score,
    scoreBreakdown,
    mode,
    countsTowardPhase2,
  };

  if (countsTowardPhase2) {
    await db.insert(ahaPracticeLabAttempts).values({
      userId,
      enrollmentId: session.enrollmentId,
      programType: "acls",
      trackId: "adult_acls_world",
      scenarioId: session.scenarioId,
      score,
      passed: score >= 70,
      eventLog: state.events,
      evidenceStatus: "review_required",
      scenarioVersion: session.scenarioVersion,
      criticalFailure: state.criticalFailures.length > 0,
      durationSeconds: Math.round(state.elapsedSeconds),
    });
    await db.insert(simulationWorldEvidence).values({
      sessionId: session.id,
      userId,
      enrollmentId: session.enrollmentId,
      role: session.role,
      scenarioId: state.scenarioId,
      evidenceStatus: "review_required",
      assessmentJson: evidence,
    });
    await reconcilePhase2Completion(db, {
      userId,
      enrollmentId: session.enrollmentId,
      programType: "acls",
      source: "completeAdultAclsSession",
    });
    return { countsTowardPhase2: true, evidenceStatus: "review_required", evidence };
  }

  // Guided practice is auditable but never enters the Phase 2 attempt ledger.
  // Keep it rejected until the dedicated formative_only schema value is shipped.
  await db.insert(simulationWorldEvidence).values({
    sessionId: session.id,
    userId,
    enrollmentId: session.enrollmentId,
    role: session.role,
    scenarioId: state.scenarioId,
    evidenceStatus: "rejected",
    reviewerReason: "Guided formative rehearsal; not eligible for Phase 2 mastery",
    assessmentJson: evidence,
  });
  return { countsTowardPhase2: false, evidenceStatus: "formative_only", evidence };
}
