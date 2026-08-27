import { beforeEach, describe, expect, it } from "vitest";
import {
  clearOfflineDataForActor,
  enqueueOfflineCommand,
  getOfflineSnapshot,
  getOfflineSnapshotFreshness,
  getOfflineSyncCounts,
  listOfflineReviewCommands,
  listOfflineCommands,
  offlineStoreKeys,
  saveOfflineSnapshot,
  updateOfflineCommand,
} from "./platformOfflineStore";

describe("platform offline store", () => {
  const testSuffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  beforeEach(async () => {
    await clearOfflineDataForActor(990000);
  });

  it("stores a versioned snapshot for offline read-only access", async () => {
    const key = offlineStoreKeys.module(990001, `test-${testSuffix}`);
    await saveOfflineSnapshot({
      key,
      kind: "course_package",
      aggregateId: "module-990001",
      actorId: 990000,
      version: `test-${testSuffix}`,
      payload: { title: "Synthetic BLS module", sections: ["Airway"] },
      savedAt: Date.now(),
      lastServerSyncAt: Date.now(),
    });

    const snapshot = await getOfflineSnapshot<{ title: string; sections: string[] }>(key);
    expect(snapshot?.version).toBe(`test-${testSuffix}`);
    expect(snapshot?.payload.title).toBe("Synthetic BLS module");
    expect(snapshot?.payload.sections).toEqual(["Airway"]);
  });

  it("classifies snapshots as fresh, stale, or expired", () => {
    const savedAt = 1_000_000;
    const snapshot = {
      key: "freshness-test",
      kind: "iers_shift_snapshot" as const,
      aggregateId: "shift-1",
      version: "v1",
      payload: {},
      savedAt,
      staleAfterMs: 60_000,
      expiresAt: savedAt + 300_000,
    };
    expect(getOfflineSnapshotFreshness(snapshot, savedAt + 30_000)).toBe("fresh");
    expect(getOfflineSnapshotFreshness(snapshot, savedAt + 60_000)).toBe("stale");
    expect(getOfflineSnapshotFreshness(snapshot, savedAt + 300_000)).toBe("expired");
  });

  it("queues commands with stable local IDs and exposes pending state", async () => {
    const localEventId = `test-command-${testSuffix}`;
    await enqueueOfflineCommand({
      localEventId,
      aggregateType: "crash_cart_check",
      aggregateId: "team-990001-shift-990001",
      tenantId: 990001,
      actorId: 990000,
      actionType: "save_draft",
      payload: { templateVersion: "synthetic-v1", criticalGapCount: 1 },
      baseVersion: "synthetic-v1",
      clientCreatedAt: Date.now(),
    });

    const pending = await listOfflineCommands(1000);
    const row = pending.find((command) => command.localEventId === localEventId);
    expect(row?.status).toBe("queued");
    expect(row?.attempts).toBe(0);

    const counts = await getOfflineSyncCounts();
    expect(counts.queued).toBeGreaterThanOrEqual(1);
  });

  it("retains a conflict for operator review instead of silently resolving it", async () => {
    const localEventId = `test-conflict-${testSuffix}`;
    await enqueueOfflineCommand({
      localEventId,
      aggregateType: "utl_response_intent",
      aggregateId: "assignment-990001",
      tenantId: 990001,
      actorId: 990000,
      actionType: "accept",
      payload: { assignmentSnapshotVersion: "old" },
      baseVersion: "old",
      clientCreatedAt: Date.now(),
    });

    await updateOfflineCommand(localEventId, {
      status: "requires_review",
      lastError: "The server assignment changed while this device was offline.",
    });

    const counts = await getOfflineSyncCounts();
    expect(counts.requiresReview).toBeGreaterThanOrEqual(1);
    const review = await listOfflineReviewCommands(1000);
    expect(review.some((command) => command.localEventId === localEventId)).toBe(true);
    const pending = await listOfflineCommands(1000);
    expect(pending.some((command) => command.localEventId === localEventId)).toBe(false);
  });

  it("clears only the selected actor's local records", async () => {
    const retainedId = `test-retained-${testSuffix}`;
    const clearedId = `test-cleared-${testSuffix}`;
    await enqueueOfflineCommand({
      localEventId: retainedId,
      aggregateType: "course_progress",
      aggregateId: "course-990001",
      actorId: 990002,
      actionType: "bookmark",
      payload: { sectionId: "s1" },
      clientCreatedAt: Date.now(),
    });
    await enqueueOfflineCommand({
      localEventId: clearedId,
      aggregateType: "course_progress",
      aggregateId: "course-990002",
      actorId: 990000,
      actionType: "bookmark",
      payload: { sectionId: "s2" },
      clientCreatedAt: Date.now(),
    });

    await clearOfflineDataForActor(990000);
    const pending = await listOfflineCommands(1000);
    expect(pending.some((command) => command.localEventId === clearedId)).toBe(false);
    expect(pending.some((command) => command.localEventId === retainedId)).toBe(true);
  });
});
