import { afterEach, describe, expect, it } from "vitest";
import { createSession } from "./abcdeEngine";
import {
  clearPersistedResusSession,
  countPendingResusEvents,
  countUnownedResusRecords,
  enqueueResusEvent,
  listPendingResusEvents,
  loadPersistedResusSession,
  markResusEventFailed,
  markResusEventSending,
  normalizeResusSession,
  persistResusSession,
  removeResusEvent,
  saveSampleHistory,
  loadLastSampleHistory,
} from "./resusSessionStore";

const DB_NAME = "PaedsResusDB";
let serial = 0;
const nextId = () => `synthetic-${Date.now()}-${++serial}-${Math.random().toString(36).slice(2, 8)}`;
const nextActor = () => 100_000 + Math.floor(Math.random() * 800_000);

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 5);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

afterEach(() => {
  serial += 1;
});

describe("ResusGPS local persistence boundaries", () => {
  it("restores a persisted deadline only for the owning account", async () => {
    const ownerId = nextActor();
    const otherId = nextActor();
    const session = createSession(12, "2 years");
    session.phase = "INTERVENTION";
    session.events.push({ id: nextId(), timestamp: Date.now(), type: "note", detail: "synthetic test event" });
    session.activeTimers = [{
      interventionId: "synthetic-action",
      startedAt: Date.now(),
      durationSeconds: 90,
      endsAt: Date.now() + 90_000,
    }];

    await persistResusSession(session, ownerId);
    const ownerLoad = await loadPersistedResusSession(ownerId);
    const otherLoad = await loadPersistedResusSession(otherId);

    expect(ownerLoad.status).toBe("available");
    if (ownerLoad.status === "available") expect(ownerLoad.session.activeTimers).toEqual(session.activeTimers);
    expect(otherLoad.status).toBe("none");

    await clearPersistedResusSession(otherId);
    expect((await loadPersistedResusSession(ownerId)).status).toBe("available");
    await clearPersistedResusSession(ownerId);
    expect((await loadPersistedResusSession(ownerId)).status).toBe("none");
  });

  it("scopes saved SAMPLE history to its authenticated owner", async () => {
    const ownerId = nextActor();
    const otherId = nextActor();
    await saveSampleHistory({ allergies: "synthetic allergy history" }, ownerId);
    expect(await loadLastSampleHistory(ownerId)).toEqual({ allergies: "synthetic allergy history" });
    expect(await loadLastSampleHistory(otherId)).toBeNull();
  });

  it("atomically claims outbox work and rejects cross-account read, retry, and deletion", async () => {
    const ownerId = nextActor();
    const otherId = nextActor();
    const localEventId = nextId();
    await enqueueResusEvent({
      localEventId,
      sessionId: nextId(),
      actorId: ownerId,
      eventType: "note",
      eventTimestamp: Date.now(),
      detail: "synthetic event only",
    });

    expect(await countPendingResusEvents(ownerId)).toBe(1);
    expect(await countPendingResusEvents(otherId)).toBe(0);
    expect(await listPendingResusEvents(otherId)).toEqual([]);
    await expect(markResusEventSending(localEventId, otherId)).rejects.toThrow(/another provider account/i);
    await expect(removeResusEvent(localEventId, otherId)).rejects.toThrow(/another provider account/i);

    const claims = await Promise.all([
      markResusEventSending(localEventId, ownerId),
      markResusEventSending(localEventId, ownerId),
    ]);
    expect(claims.filter(Boolean)).toHaveLength(1);

    await markResusEventFailed(localEventId, ownerId, "synthetic offline test");
    expect(await markResusEventSending(localEventId, ownerId)).toBe(false);
    expect(await countPendingResusEvents(ownerId)).toBe(1);
    await removeResusEvent(localEventId, ownerId);
    expect(await countPendingResusEvents(ownerId)).toBe(0);
  });

  it("counts legacy ownerless rows without returning or replaying their payload", async () => {
    const token = nextId();
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(["resusSession", "sampleHistory", "resusEventOutbox"], "readwrite");
      tx.objectStore("resusSession").put({ key: `legacy-session:${token}`, session: { events: [{ detail: "must stay quarantined" }] }, savedAt: Date.now() });
      tx.objectStore("sampleHistory").put({ key: `legacy-sample:${token}`, sample: { allergies: "must stay quarantined" }, savedAt: Date.now() });
      tx.objectStore("resusEventOutbox").put({
        localEventId: `legacy-event:${token}`,
        sessionId: `legacy-session:${token}`,
        eventType: "note",
        eventTimestamp: Date.now(),
        detail: "must not be replayed",
        status: "pending",
        attempts: 0,
        queuedAt: Date.now(),
        updatedAt: Date.now(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });

    expect(await countUnownedResusRecords()).toBeGreaterThanOrEqual(3);
    expect(await listPendingResusEvents(nextActor())).toEqual([]);
  });

  it("requires a dose review when a legacy active medication lacks a confirmed snapshot", () => {
    const legacy = createSession(12, "2 years");
    legacy.doseReviewRequired = undefined;
    legacy.threats = [{
      id: "synthetic-legacy-threat",
      letter: "C",
      name: "Synthetic legacy threat",
      severity: "urgent",
      resolved: false,
      findings: [],
      interventions: [{
        id: "synthetic-legacy-medication",
        action: "Synthetic legacy medication",
        dose: { drug: "Synthetic medication", dosePerKg: 1, unit: "mg", route: "test" },
        status: "completed",
      }],
    }];
    expect(normalizeResusSession(legacy).doseReviewRequired).toBe(true);
  });
});
