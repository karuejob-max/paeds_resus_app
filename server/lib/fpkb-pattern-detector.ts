/**
 * FPKB automated pattern-detection engine (gap-analysis #9).
 *
 * Mines careSignalEvents' coded failure_mode_codes / success_factor_codes
 * (Care Signal v3's explicit checklist selections — not fuzzy inference)
 * into kb_pattern_observations, creates/updates kb_patterns, and promotes
 * confidence levels per Observation Architecture v1.1 §6.6's documented
 * threshold ladder. This is Stage 6 of the holistic loop actually running,
 * not just schema + a read-only Atlas (gap #1).
 *
 * HARD RULE preserved from FPKB_SCHEMA_V1.md: "The FPKB references
 * observations; observations never reference the FPKB." This file only
 * reads from careSignalEvents — it never writes to it, and no pattern_id
 * or recommendation_id is ever added as a column on an observation table.
 *
 * SCOPE OF THIS FIRST CUT:
 *   - One auto-detected pattern per coded failure_mode / success_factor
 *     (a 1:1 starting point). Multi-mode COMBINATION pattern detection
 *     ("recognition delay AND vascular access failure co-occurring") is
 *     real correlation analysis and is a documented future enhancement,
 *     not silently attempted here.
 *   - Confidence promotion up through ESTABLISHED (failure) / EMERGING_SUCCESS
 *     (success) is observation-count-and-diversity driven and handled here.
 *     VALIDATED_SUCCESS / STANDARD_PRACTICE require measured Implementation
 *     outcomes (§6.8) — handled by reEvaluateAfterImplementationOutcome(),
 *     called from fpkb.ts's recordImplementationOutcome, not by this
 *     observation-scanning pass.
 *   - Automated confidence DOWNGRADE on staleness (review_due_at scheduling,
 *     §6.6's "ESTABLISHED → CONFIRMED after 18 months without new
 *     observations" etc.) is NOT implemented in this cut — flagged as a
 *     follow-up in WORK_STATUS.md, not silently skipped.
 *
 * HONEST APPROXIMATION, documented not hidden: the "≥2 facilities" /
 * "≥3 independent facilities" thresholds in §6.6 can't be checked exactly
 * here, because kb_pattern_observations deliberately does NOT store facility
 * identity (by design, for anonymisation — see FPKB_SCHEMA_V1.md). This
 * code uses distinct admin_level_1 region count and distinct
 * observation_period count as the closest available proxies for "facility
 * diversity." That's a real approximation, not the letter of the spec.
 */
import { and, eq, inArray, like, sql } from "drizzle-orm";
import {
  careSignalEvents,
  kbFailureModes,
  kbSuccessFactors,
  kbPatterns,
  kbPatternModes,
  kbPatternObservations,
  kbGovernanceAudit,
  kbRecommendations,
  kbInterventions,
  kbImplementations,
  type KbPattern,
} from "../../drizzle/schema";
import type { DbClient } from "../db";

function newId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function observationPeriod(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Confidence ladder per Observation Architecture v1.1 §6.6 — failure track. */
const FAILURE_THRESHOLDS = { SIGNAL: 5, CANDIDATE: 20, CONFIRMED: 50, ESTABLISHED: 100 };
/** Success track: only the observation-driven rungs; the rest need Implementation outcomes. */
const EMERGING_SUCCESS_DIVERSITY = 3;

export interface DetectionResult {
  eventsScanned: number;
  newObservationsLinked: number;
  patternsCreated: number;
  patternsPromoted: { patternId: string; patternCode: string; from: string; to: string }[];
  skippedUnknownCodes: string[];
}

async function logAudit(
  db: DbClient,
  params: {
    actionType: "PATTERN_CREATED" | "PATTERN_CONFIDENCE_CHANGED" | "RECOMMENDATION_REJECTED" | "OTHER";
    entityType: "PATTERN" | "RECOMMENDATION";
    entityId: string;
    previousState?: unknown;
    newState?: unknown;
    reasoning: string;
  }
) {
  await db.insert(kbGovernanceAudit).values({
    id: newId(),
    actorUserId: "system",
    actionType: params.actionType,
    entityType: params.entityType,
    entityId: params.entityId,
    previousState: params.previousState ? JSON.stringify(params.previousState) : null,
    newState: params.newState ? JSON.stringify(params.newState) : null,
    reasoning: params.reasoning,
  });
}

async function findOrCreatePattern(
  db: DbClient,
  params: { track: "FAILURE" | "SUCCESS"; autoCode: string; name: string; domain: string; description: string }
): Promise<{ id: string; created: boolean }> {
  const [existing] = await db.select().from(kbPatterns).where(eq(kbPatterns.patternCode, params.autoCode));
  if (existing) return { id: existing.id, created: false };

  const id = newId();
  const confidenceDimensions = JSON.stringify({
    clinical: "auto_detected",
    statistical: "observation_count_driven",
    external_evidence: "none",
    platform_replication: "pending",
    geographic_diversity: "pending",
    recency: new Date().toISOString(),
  });

  await db.insert(kbPatterns).values({
    id,
    patternTrack: params.track,
    patternCode: params.autoCode,
    patternName: params.name,
    primaryDomain: params.domain as KbPattern["primaryDomain"],
    description: params.description,
    confidenceLevel: params.track === "FAILURE" ? "SIGNAL" : "CANDIDATE_SUCCESS",
    confidenceDimensions,
    supportingObservationCount: 0,
    knowledgeStatus: "ACTIVE",
    firstDetectedAt: new Date(),
    createdBy: "system",
  });

  await logAudit(db, {
    actionType: "PATTERN_CREATED",
    entityType: "PATTERN",
    entityId: id,
    newState: { patternCode: params.autoCode, patternName: params.name, autoDetected: true },
    reasoning: "Auto-created by the pattern detector from a Care Signal submission's coded failure mode / success factor.",
  });

  return { id, created: true };
}

export function computeTrend(periods: string[]): "INCREASING" | "DECREASING" | "STABLE" | "INSUFFICIENT_DATA" {
  const counts = new Map<string, number>();
  for (const p of periods) counts.set(p, (counts.get(p) ?? 0) + 1);
  const sorted = Array.from(counts.keys()).sort();
  if (sorted.length < 4) return "INSUFFICIENT_DATA";
  const mid = Math.floor(sorted.length / 2);
  const earlierAvg = sorted.slice(0, mid).reduce((s, p) => s + (counts.get(p) ?? 0), 0) / mid;
  const laterAvg = sorted.slice(mid).reduce((s, p) => s + (counts.get(p) ?? 0), 0) / (sorted.length - mid);
  if (laterAvg > earlierAvg * 1.2) return "INCREASING";
  if (laterAvg < earlierAvg * 0.8) return "DECREASING";
  return "STABLE";
}

async function recomputePatternConfidence(
  db: DbClient,
  patternId: string
): Promise<{ patternId: string; patternCode: string; from: string; to: string } | null> {
  const [pattern] = await db.select().from(kbPatterns).where(eq(kbPatterns.id, patternId));
  if (!pattern) return null;

  const observations = await db
    .select()
    .from(kbPatternObservations)
    .where(eq(kbPatternObservations.patternId, patternId));

  const count = observations.length;
  const distinctPeriods = new Set(observations.map((o) => o.observationPeriod)).size;
  const distinctRegions = new Set(observations.map((o) => o.adminLevel1).filter(Boolean)).size;
  const diversityCount = Math.max(distinctPeriods, distinctRegions);

  let newLevel = pattern.confidenceLevel;
  if (pattern.patternTrack === "FAILURE") {
    if (count >= FAILURE_THRESHOLDS.ESTABLISHED) newLevel = "ESTABLISHED";
    else if (count >= FAILURE_THRESHOLDS.CONFIRMED) newLevel = "CONFIRMED";
    else if (count >= FAILURE_THRESHOLDS.CANDIDATE && diversityCount >= 2) newLevel = "CANDIDATE";
    else if (count >= FAILURE_THRESHOLDS.SIGNAL) newLevel = "SIGNAL";
  } else if (pattern.confidenceLevel === "CANDIDATE_SUCCESS" && distinctRegions >= EMERGING_SUCCESS_DIVERSITY) {
    newLevel = "EMERGING_SUCCESS";
  }

  const trendDirection =
    pattern.patternTrack === "FAILURE" ? computeTrend(observations.map((o) => o.observationPeriod)) : pattern.trendDirection;

  const changed = newLevel !== pattern.confidenceLevel;

  await db
    .update(kbPatterns)
    .set({
      supportingObservationCount: count,
      lastConfirmedAt: new Date(),
      confidenceLevel: newLevel,
      trendDirection,
      // 6-month review for SIGNAL/CANDIDATE, 12-month for CONFIRMED/ESTABLISHED (§6.6).
      reviewDueAt: new Date(
        Date.now() + (newLevel === "CONFIRMED" || newLevel === "ESTABLISHED" ? 365 : 182) * 86_400_000
      ),
    })
    .where(eq(kbPatterns.id, patternId));

  if (changed) {
    await logAudit(db, {
      actionType: "PATTERN_CONFIDENCE_CHANGED",
      entityType: "PATTERN",
      entityId: patternId,
      previousState: { confidenceLevel: pattern.confidenceLevel },
      newState: { confidenceLevel: newLevel, supportingObservationCount: count },
      reasoning: `Auto-promoted after reaching ${count} linked observations (diversity proxy: ${diversityCount} distinct regions/periods).`,
    });
    return { patternId, patternCode: pattern.patternCode, from: pattern.confidenceLevel, to: newLevel };
  }
  return null;
}

/**
 * Scans careSignalEvents for coded failure_mode_codes / success_factor_codes
 * not yet linked to a pattern, links them, and recomputes confidence for
 * every pattern touched. Idempotent and incremental — safe to run
 * repeatedly (e.g. on a schedule); already-linked observations are skipped.
 */
export async function runPatternDetection(db: DbClient, opts: { dryRun: boolean } = { dryRun: true }): Promise<DetectionResult> {
  const failureModes = await db.select().from(kbFailureModes).where(eq(kbFailureModes.isActive, true));
  const successFactors = await db.select().from(kbSuccessFactors).where(eq(kbSuccessFactors.isActive, true));
  const failureModeMap = new Map(failureModes.map((r) => [r.failureModeCode, r]));
  const successFactorMap = new Map(successFactors.map((r) => [r.successFactorCode, r]));

  const linked = await db
    .select({ observationId: kbPatternObservations.observationId })
    .from(kbPatternObservations)
    .where(eq(kbPatternObservations.observationTable, "careSignalEvents"));
  const linkedIds = new Set(linked.map((r) => r.observationId));

  const events = await db
    .select({
      id: careSignalEvents.id,
      reportTrack: careSignalEvents.reportTrack,
      failureModeCodes: careSignalEvents.failureModeCodes,
      successFactorCodes: careSignalEvents.successFactorCodes,
      country: careSignalEvents.country,
      adminLevel1: careSignalEvents.adminLevel1,
      conditionCategory: careSignalEvents.conditionCategory,
      createdAt: careSignalEvents.createdAt,
    })
    .from(careSignalEvents)
    .where(sql`(${careSignalEvents.failureModeCodes} IS NOT NULL OR ${careSignalEvents.successFactorCodes} IS NOT NULL)`);

  const unprocessed = events.filter((e) => !linkedIds.has(String(e.id)));

  let newObservationsLinked = 0;
  let patternsCreated = 0;
  const touchedPatternIds = new Set<string>();
  const skippedUnknownCodes = new Set<string>();

  for (const event of unprocessed) {
    const codes: { code: string; track: "FAILURE" | "SUCCESS" }[] = [];
    if (event.reportTrack === "FAILURE" && event.failureModeCodes) {
      try {
        for (const c of JSON.parse(event.failureModeCodes) as string[]) codes.push({ code: c, track: "FAILURE" });
      } catch {
        /* malformed JSON — skip this event's codes, don't fail the whole run */
      }
    }
    if (event.reportTrack === "SUCCESS" && event.successFactorCodes) {
      try {
        for (const c of JSON.parse(event.successFactorCodes) as string[]) codes.push({ code: c, track: "SUCCESS" });
      } catch {
        /* malformed JSON — skip */
      }
    }

    for (const { code, track } of codes) {
      const mode = track === "FAILURE" ? failureModeMap.get(code) : successFactorMap.get(code);
      if (!mode) {
        skippedUnknownCodes.add(code); // taxonomy drift — code selected in UI but not in kb_ tables
        continue;
      }

      newObservationsLinked++;
      if (opts.dryRun) continue;

      const domain = "failureDomain" in mode ? mode.failureDomain : mode.successDomain;
      const name = "failureModeName" in mode ? mode.failureModeName : mode.successFactorName;
      const autoCode = `AUTO_${code}`;

      const { id: patternId, created } = await findOrCreatePattern(db, {
        track,
        autoCode,
        name: `Auto: ${name}`,
        domain,
        description: mode.description,
      });
      if (created) patternsCreated++;

      const [existingModeLink] = await db
        .select()
        .from(kbPatternModes)
        .where(and(eq(kbPatternModes.patternId, patternId), eq(kbPatternModes.modeId, mode.id)));
      if (!existingModeLink) {
        await db.insert(kbPatternModes).values({ id: newId(), patternId, modeId: mode.id, modeTrack: track, isPrimary: true });
      }

      await db.insert(kbPatternObservations).values({
        id: newId(),
        patternId,
        observationSource: "CARE_SIGNAL",
        observationId: String(event.id),
        observationTable: "careSignalEvents",
        country: event.country,
        adminLevel1: event.adminLevel1,
        conditionCategory: event.conditionCategory,
        observationPeriod: observationPeriod(event.createdAt),
        linkedBy: "system",
      });

      touchedPatternIds.add(patternId);
    }
  }

  const patternsPromoted: DetectionResult["patternsPromoted"] = [];
  if (!opts.dryRun) {
    for (const patternId of touchedPatternIds) {
      const promotion = await recomputePatternConfidence(db, patternId);
      if (promotion) patternsPromoted.push(promotion);
    }
  }

  return {
    eventsScanned: unprocessed.length,
    newObservationsLinked,
    patternsCreated,
    patternsPromoted,
    skippedUnknownCodes: Array.from(skippedUnknownCodes),
  };
}

/**
 * Stage 8 self-evaluation (Observation Architecture v1.1 §6.8) — called from
 * fpkb.ts's recordImplementationOutcome, NOT from runPatternDetection above.
 * This is triggered by a specific Implementation completing, not by the
 * observation-scanning pass.
 */
export async function reEvaluateAfterImplementationOutcome(
  db: DbClient,
  params: { recommendationId: string; outcomeLabel: "IMPROVED" | "NO_IMPROVEMENT" | "WORSENED" | "EVALUATION_PENDING" }
): Promise<void> {
  if (params.outcomeLabel === "EVALUATION_PENDING") return; // nothing to evaluate yet

  const [rec] = await db.select().from(kbRecommendations).where(eq(kbRecommendations.id, params.recommendationId));
  if (!rec) return;
  const [pattern] = await db.select().from(kbPatterns).where(eq(kbPatterns.id, rec.sourcePatternId));
  if (!pattern) return;

  if (params.outcomeLabel === "WORSENED") {
    // "Immediate expert review triggered. The recommendation is suspended
    // pending Knowledge Stewardship review." Modeled as reverting the
    // recommendation to PENDING, re-triggering the approval gate.
    await db.update(kbRecommendations).set({ governanceStatus: "PENDING" }).where(eq(kbRecommendations.id, rec.id));
    await db.update(kbPatterns).set({ knowledgeStatus: "UNDER_REVIEW" }).where(eq(kbPatterns.id, pattern.id));
    await logAudit(db, {
      actionType: "RECOMMENDATION_REJECTED",
      entityType: "RECOMMENDATION",
      entityId: rec.id,
      previousState: { governanceStatus: "APPROVED" },
      newState: { governanceStatus: "PENDING", reason: "WORSENED outcome — suspended pending review" },
      reasoning: "Implementation outcome was WORSENED — recommendation suspended and pattern flagged for review per §6.8.",
    });
    return;
  }

  if (params.outcomeLabel === "NO_IMPROVEMENT") {
    // "After three independent implementations with No improvement outcomes,
    // the pattern confidence is automatically reviewed." Count prior
    // NO_IMPROVEMENT occurrences logged against this specific pattern
    // (filtered by reasoning text, since actionType "OTHER" is shared with
    // other miscellaneous audit entries and isn't NO_IMPROVEMENT-specific).
    const priorNoImprovement = await db
      .select()
      .from(kbGovernanceAudit)
      .where(
        and(
          eq(kbGovernanceAudit.entityType, "PATTERN"),
          eq(kbGovernanceAudit.entityId, pattern.id),
          like(kbGovernanceAudit.reasoning, "%NO_IMPROVEMENT outcome recorded%")
        )
      );
    // Log this occurrence regardless, then check the count including this one.
    await logAudit(db, {
      actionType: "OTHER",
      entityType: "PATTERN",
      entityId: pattern.id,
      reasoning: `NO_IMPROVEMENT outcome recorded for recommendation ${rec.id} sourced from this pattern.`,
    });
    if (priorNoImprovement.length + 1 >= 3) {
      await db.update(kbPatterns).set({ knowledgeStatus: "UNDER_REVIEW" }).where(eq(kbPatterns.id, pattern.id));
      await logAudit(db, {
        actionType: "PATTERN_CONFIDENCE_CHANGED",
        entityType: "PATTERN",
        entityId: pattern.id,
        newState: { knowledgeStatus: "UNDER_REVIEW" },
        reasoning: "3+ independent NO_IMPROVEMENT implementation outcomes — automatic review triggered per §6.8.",
      });
    }
    return;
  }

  // IMPROVED
  if (pattern.patternTrack === "SUCCESS" && pattern.confidenceLevel === "EMERGING_SUCCESS") {
    // "Associated with measurable improvement after implementation at ≥2
    // additional facilities" — properly scoped to THIS pattern's own
    // recommendations → interventions → implementations chain (facility
    // identity still isn't available at this layer, so "≥2 additional
    // facilities" is approximated as "≥2 distinct IMPROVED implementations",
    // same documented approximation as the observation-count path above —
    // but at minimum this is now correctly scoped to the right pattern,
    // not counted system-wide across every pattern's implementations).
    const patternRecs = await db
      .select({ id: kbRecommendations.id })
      .from(kbRecommendations)
      .where(eq(kbRecommendations.sourcePatternId, pattern.id));
    const recIds = patternRecs.map((r) => r.id);

    if (recIds.length > 0) {
      const interventions = await db
        .select({ id: kbInterventions.id })
        .from(kbInterventions)
        .where(inArray(kbInterventions.recommendationId, recIds));
      const interventionIds = interventions.map((i) => i.id);

      if (interventionIds.length > 0) {
        const improvedImplementations = await db
          .select()
          .from(kbImplementations)
          .where(and(inArray(kbImplementations.interventionId, interventionIds), eq(kbImplementations.outcomeLabel, "IMPROVED")));

        if (improvedImplementations.length >= 2) {
          await db.update(kbPatterns).set({ confidenceLevel: "VALIDATED_SUCCESS" }).where(eq(kbPatterns.id, pattern.id));
          await logAudit(db, {
            actionType: "PATTERN_CONFIDENCE_CHANGED",
            entityType: "PATTERN",
            entityId: pattern.id,
            previousState: { confidenceLevel: "EMERGING_SUCCESS" },
            newState: { confidenceLevel: "VALIDATED_SUCCESS" },
            reasoning: `Measurable improvement recorded across ${improvedImplementations.length} implementations of this pattern's own recommendations per §6.8 — promoted to VALIDATED_SUCCESS.`,
          });
        }
      }
    }
  }
}
