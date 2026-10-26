import { and, eq, isNull } from "drizzle-orm";
import { ahaPracticeLabAttempts, phase2MasteryCompletions } from "../../drizzle/schema";
import {
  calculatePhase2AutomationStatus,
  PHASE2_REQUIREMENT_SET_VERSION,
  supportsAutomatedPhase3Gate,
  type Phase2AutomationStatus,
} from "../../shared/phase2-automation";

export type Phase2CompletionAction = "upsert" | "revoke" | "noop";

export type Phase2ExistingCompletion = { active: boolean; requirementSetVersion: string } | null;

/**
 * Pure decision used by every code path that can create or revoke an automated
 * Phase 2 completion. Keeping it pure makes the rules testable without a DB:
 *  - unsupported lanes never hold an active completion;
 *  - a ready, supported lane holds exactly one active completion on the current version;
 *  - anything else is revoked.
 */
export function decidePhase2CompletionAction(input: {
  supported: boolean;
  ready: boolean;
  existing: Phase2ExistingCompletion;
  currentVersion: string;
}): Phase2CompletionAction {
  const { supported, ready, existing, currentVersion } = input;
  const activeRow = existing?.active ? existing : null;
  if (!supported) return activeRow ? "revoke" : "noop";
  if (ready) return activeRow && activeRow.requirementSetVersion === currentVersion ? "noop" : "upsert";
  return activeRow ? "revoke" : "noop";
}

export type ReconcilePhase2Result = {
  status: Phase2AutomationStatus;
  action: Phase2CompletionAction;
};

/**
 * Single source of truth for automated Phase 2 completion state. Call it from
 * every authoritative save boundary (dedicated-world completion, recordAttempt),
 * the Hub status query, and the Phase 3 booking gate. It recomputes mastery from
 * the enrollment's stored attempts under the current requirement set, then
 * creates, refreshes or revokes the completion row to match.
 */
export async function reconcilePhase2Completion(
  db: any,
  params: { userId: number; enrollmentId: number; programType: "acls" | "pals" | "nrp" | "heartsaver"; source: string },
): Promise<ReconcilePhase2Result> {
  const { userId, enrollmentId, programType, source } = params;
  const attempts = await db
    .select({
      trackId: ahaPracticeLabAttempts.trackId,
      scenarioId: ahaPracticeLabAttempts.scenarioId,
      score: ahaPracticeLabAttempts.score,
      passed: ahaPracticeLabAttempts.passed,
      evidenceStatus: ahaPracticeLabAttempts.evidenceStatus,
      criticalFailure: ahaPracticeLabAttempts.criticalFailure,
      scenarioVersion: ahaPracticeLabAttempts.scenarioVersion,
    })
    .from(ahaPracticeLabAttempts)
    .where(and(eq(ahaPracticeLabAttempts.userId, userId), eq(ahaPracticeLabAttempts.enrollmentId, enrollmentId)));

  const status = calculatePhase2AutomationStatus(
    programType,
    attempts.map((attempt: any) => ({
      trackId: attempt.trackId,
      scenarioId: attempt.scenarioId,
      score: Number(attempt.score ?? 0),
      passed: Boolean(attempt.passed),
      evidenceStatus: attempt.evidenceStatus,
      criticalFailure: Boolean(attempt.criticalFailure),
      scenarioVersion: attempt.scenarioVersion,
    })),
  );

  const [row] = await db
    .select({ requirementSetVersion: phase2MasteryCompletions.requirementSetVersion, revokedAt: phase2MasteryCompletions.revokedAt })
    .from(phase2MasteryCompletions)
    .where(and(eq(phase2MasteryCompletions.enrollmentId, enrollmentId), eq(phase2MasteryCompletions.programType, programType)))
    .limit(1);

  const action = decidePhase2CompletionAction({
    supported: supportsAutomatedPhase3Gate(programType),
    ready: status.phase2Ready,
    existing: row ? { active: row.revokedAt == null, requirementSetVersion: row.requirementSetVersion } : null,
    currentVersion: PHASE2_REQUIREMENT_SET_VERSION,
  });

  if (action === "upsert") {
    await db
      .insert(phase2MasteryCompletions)
      .values({ userId, enrollmentId, programType, requirementSetVersion: PHASE2_REQUIREMENT_SET_VERSION, evidenceSnapshotJson: status })
      .onDuplicateKeyUpdate({
        set: { requirementSetVersion: PHASE2_REQUIREMENT_SET_VERSION, evidenceSnapshotJson: status, revokedAt: null, revokedReason: null, updatedAt: new Date() },
      });
  } else if (action === "revoke") {
    await db
      .update(phase2MasteryCompletions)
      .set({
        revokedAt: new Date(),
        revokedReason: `Reconciled (${source}): not eligible under ${PHASE2_REQUIREMENT_SET_VERSION}`,
        updatedAt: new Date(),
      })
      .where(and(eq(phase2MasteryCompletions.enrollmentId, enrollmentId), eq(phase2MasteryCompletions.programType, programType), isNull(phase2MasteryCompletions.revokedAt)));
  }

  return { status, action };
}
