import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearOfflineDataForActor,
  clearOfflineSnapshotsForActor,
  enqueueOfflineCommand,
  getOfflineSnapshot,
  getOfflineCommand,
  getOfflineSnapshotFreshness,
  getOfflineSyncCounts,
  listOfflineReviewCommands,
  listOfflineSnapshots,
  listOfflineCommands,
  pruneOfflineData,
  offlineStoreKeys,
  removeOfflineCommand,
  saveOfflineSnapshot,
  updateOfflineCommand,
} from "./platformOfflineStore";

describe("platform offline store", () => {
  const testSuffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  beforeEach(async () => {
    await clearOfflineDataForActor(990000);
    await clearOfflineDataForActor(990002);
  });

  afterEach(async () => {
    await clearOfflineDataForActor(990000);
    await clearOfflineDataForActor(990002);
  });

  it("rejects a snapshot without an authenticated actor", async () => {
    await expect(saveOfflineSnapshot({
      key: `scope-test-${testSuffix}`,
      kind: "course_module",
      aggregateId: "module-unauthenticated",
      version: "synthetic-v1",
      payload: {},
      savedAt: Date.now(),
    })).rejects.toThrow("authenticated actor");
  });

  it("rejects an institution command without tenant scope", async () => {
    await expect(enqueueOfflineCommand({
      localEventId: `scope-command-${testSuffix}`,
      aggregateType: "crash_cart_check",
      aggregateId: "shift-unauthorized",
      actorId: 990000,
      actionType: "save_draft",
      payload: {},
      clientCreatedAt: Date.now(),
    })).rejects.toThrow("institution scope");
  });

  it("stores snapshots for the owner and returns no data to another actor", async () => {
    const key = offlineStoreKeys.module(990001, `test-${testSuffix}`, 990000);
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

    const snapshot = await getOfflineSnapshot<{ title: string; sections: string[] }>(key, 990000);
    expect(snapshot?.version).toBe(`test-${testSuffix}`);
    expect(snapshot?.payload.title).toBe("Synthetic BLS module");
    expect(snapshot?.payload.sections).toEqual(["Airway"]);
    expect(await getOfflineSnapshot(key, 990002)).toBeNull();
    expect(await listOfflineSnapshots("course_package", 990002)).toHaveLength(0);
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

  it("queues commands with stable local IDs and exposes owner-only pending state", async () => {
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

    const pending = await listOfflineCommands(990000, 1000);
    const row = pending.find((command) => command.localEventId === localEventId);
    expect(row?.status).toBe("queued");
    expect(row?.attempts).toBe(0);
    expect((await listOfflineCommands(990002, 1000)).some((command) => command.localEventId === localEventId)).toBe(false);

    const counts = await getOfflineSyncCounts(990000);
    expect(counts.queued).toBeGreaterThanOrEqual(1);
    expect((await getOfflineSyncCounts(990002)).queued).toBe(0);
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

    await updateOfflineCommand(localEventId, 990000, {
      status: "requires_review",
      lastError: "The server assignment changed while this device was offline.",
    });

    const counts = await getOfflineSyncCounts(990000);
    expect(counts.requiresReview).toBeGreaterThanOrEqual(1);
    const review = await listOfflineReviewCommands(990000, 1000);
    expect(review.some((command) => command.localEventId === localEventId)).toBe(true);
    const pending = await listOfflineCommands(990000, 1000);
    expect(pending.some((command) => command.localEventId === localEventId)).toBe(false);
  });

  it("rejects cross-account update and delete attempts", async () => {
    const localEventId = `owner-check-${testSuffix}`;
    await enqueueOfflineCommand({
      localEventId,
      aggregateType: "course_progress",
      aggregateId: "course-owner-check",
      actorId: 990000,
      actionType: "bookmark",
      payload: {},
      clientCreatedAt: Date.now(),
    });

    await expect(updateOfflineCommand(localEventId, 990002, { status: "acknowledged" }))
      .rejects.toThrow("another provider account");
    await expect(removeOfflineCommand(localEventId, 990002))
      .rejects.toThrow("another provider account");
    expect((await getOfflineCommand(localEventId, 990000))?.status).toBe("queued");
    expect(await getOfflineCommand(localEventId, 990002)).toBeNull();
  });

  it("prunes expired snapshots and old acknowledged commands", async () => {
    const expiredKey = `expired-${testSuffix}`;
    await saveOfflineSnapshot({
      key: expiredKey,
      kind: "course_module",
      aggregateId: "expired-module",
      actorId: 990000,
      version: "expired",
      payload: {},
      savedAt: 1_000,
      expiresAt: 2_000,
    });
    const acknowledgedId = `acknowledged-${testSuffix}`;
    await enqueueOfflineCommand({
      localEventId: acknowledgedId,
      aggregateType: "course_progress",
      aggregateId: "course-expired",
      actorId: 990000,
      actionType: "bookmark",
      payload: {},
      clientCreatedAt: 1_000,
    });
    await updateOfflineCommand(acknowledgedId, 990000, { status: "acknowledged" });
    const removed = await pruneOfflineData(Date.now() + 31 * 24 * 60 * 60 * 1000);
    expect(removed).toBeGreaterThanOrEqual(2);
    expect(await getOfflineSnapshot(expiredKey, 990000)).toBeNull();
    expect(await getOfflineCommand(acknowledgedId, 990000)).toBeNull();
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
    expect(await getOfflineCommand(clearedId, 990000)).toBeNull();
    expect((await getOfflineCommand(retainedId, 990002))?.actorId).toBe(990002);
  });

  it("clears cached snapshots at logout but preserves unacknowledged owner-bound commands", async () => {
    const key = `logout-snapshot-${testSuffix}`;
    const commandId = `logout-command-${testSuffix}`;
    await saveOfflineSnapshot({
      key,
      kind: "course_module",
      aggregateId: "logout-module",
      actorId: 990000,
      version: "v1",
      payload: { private: "synthetic" },
      savedAt: Date.now(),
    });
    await enqueueOfflineCommand({
      localEventId: commandId,
      aggregateType: "course_progress",
      aggregateId: "logout-course",
      actorId: 990000,
      actionType: "bookmark",
      payload: { sectionId: "synthetic" },
      clientCreatedAt: Date.now(),
    });

    await clearOfflineSnapshotsForActor(990000);
    expect(await getOfflineSnapshot(key, 990000)).toBeNull();
    expect(await getOfflineCommand(commandId, 990000)).not.toBeNull();
  });
});
