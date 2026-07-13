/**
 * Shared anonymisation path for careSignalEvents — CEO decision 2026-07-12.
 *
 * Both DSAR erasure requests and the 7-year retention window now go through
 * this single function rather than each independently hard-deleting rows.
 * Standing policy: never hard-delete a careSignalEvents row. Anonymise:
 * userId → null, raw_narrative → redacted (see care-signal-deidentify.ts).
 * Structured/classified fields (eventType, outcome, systemGaps, condition
 * category, facilityId, etc.) are retained as-is — they were already
 * de-identified by design (categorical, not free text) and are what feeds
 * aggregate statistics and FPKB patterns. Only the free-text narrative and
 * the identity link need redaction/severing.
 *
 * This satisfies the gap-#8 immutability trigger's documented exception
 * path: the UPDATE to raw_narrative runs inside a transaction with
 * @RAW_NARRATIVE_LEGAL_OVERRIDE_REASON set, so the trigger itself writes
 * the audit row (care_signal_raw_narrative_audit) — there is no way to run
 * this anonymisation without it being logged, even by someone with direct
 * DB access.
 */
import { eq, inArray, sql } from "drizzle-orm";
import { careSignalEvents, careFacilities, facilities } from "../../drizzle/schema";
import type { DbClient } from "../db";
import { deidentifyRawNarrative } from "./care-signal-deidentify";

export type AnonymizeReason = "DSAR erasure request" | "7-year retention window expired";

export type AnonymizeResult = {
  anonymizedCount: number;
  narrativesRedacted: number;
};

async function getKnownFacilityNames(db: DbClient): Promise<string[]> {
  const cf = await db.select({ name: careFacilities.name }).from(careFacilities);
  const f = await db.select({ name: facilities.internalName }).from(facilities);
  return [...cf.map((r) => r.name), ...f.map((r) => r.name)].filter(Boolean);
}

/**
 * Anonymises a specific set of careSignalEvents rows (by id). Used by both
 * callers below — DSAR resolves ids by userId, retention cleanup resolves
 * ids by createdAt cutoff, then both delegate here.
 */
export async function anonymizeCareSignalEventRows(
  db: DbClient,
  eventIds: number[],
  reason: AnonymizeReason
): Promise<AnonymizeResult> {
  if (eventIds.length === 0) {
    return { anonymizedCount: 0, narrativesRedacted: 0 };
  }

  const facilityNames = await getKnownFacilityNames(db);

  const rows = await db
    .select({ id: careSignalEvents.id, rawNarrative: careSignalEvents.rawNarrative })
    .from(careSignalEvents)
    .where(inArray(careSignalEvents.id, eventIds));

  let narrativesRedacted = 0;

  await db.transaction(async (tx) => {
    // Session variable scoped to this transaction's connection — satisfies
    // the raw_narrative immutability trigger's documented legal-exception
    // path (migration 0061/0062). The trigger writes its own audit row.
    await tx.execute(sql`SET @RAW_NARRATIVE_LEGAL_OVERRIDE_REASON = ${reason}`);

    for (const row of rows) {
      const deidentifiedNarrative = row.rawNarrative
        ? deidentifyRawNarrative(row.rawNarrative, facilityNames).text
        : row.rawNarrative;

      if (row.rawNarrative) narrativesRedacted++;

      await tx
        .update(careSignalEvents)
        .set({ userId: null, rawNarrative: deidentifiedNarrative })
        .where(eq(careSignalEvents.id, row.id));
    }
  });

  return { anonymizedCount: rows.length, narrativesRedacted };
}

/** Anonymise every careSignalEvents row belonging to a specific user (DSAR path). */
export async function anonymizeCareSignalEventsForUser(
  db: DbClient,
  userId: number,
  reason: AnonymizeReason = "DSAR erasure request"
): Promise<AnonymizeResult> {
  const rows = await db
    .select({ id: careSignalEvents.id })
    .from(careSignalEvents)
    .where(eq(careSignalEvents.userId, userId));

  return anonymizeCareSignalEventRows(db, rows.map((r) => r.id), reason);
}
