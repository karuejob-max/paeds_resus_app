/**
 * Typed platform-wide offline persistence.
 *
 * This store is deliberately separate from the legacy generic queue and from
 * the ResusGPS clinical-event store. Domain adapters must decide what may be
 * cached or queued; this module only provides durable, typed primitives.
 */

export type OfflineSnapshotFreshness = "fresh" | "stale" | "expired";

export type OfflineSnapshotKind =
  | "course_package"
  | "course_module"
  | "iers_shift_snapshot"
  | "crash_cart_template"
  | "orientation_document";

export type OfflineAggregateType =
  | "course_progress"
  | "formative_practice"
  | "cpd_attendance_intent"
  | "utl_response_intent"
  | "crash_cart_check"
  | "role_report_draft"
  | "targeted_report"
  | "debrief_draft";

export type OfflineCommandStatus =
  | "queued"
  | "sending"
  | "acknowledged"
  | "failed"
  | "conflict"
  | "rejected"
  | "requires_review";

export interface OfflineSnapshot<TPayload = unknown> {
  key: string;
  kind: OfflineSnapshotKind;
  aggregateId: string;
  tenantId?: number;
  actorId?: number;
  version: string;
  payload: TPayload;
  savedAt: number;
  expiresAt?: number;
  staleAfterMs?: number;
  lastServerSyncAt?: number;
}

export interface OfflineCommand<TPayload = unknown> {
  localEventId: string;
  aggregateType: OfflineAggregateType;
  aggregateId: string;
  tenantId?: number;
  actorId?: number;
  actionType: string;
  payload: TPayload;
  baseVersion?: string;
  clientCreatedAt: number;
  status: OfflineCommandStatus;
  attempts: number;
  queuedAt: number;
  updatedAt: number;
  lastError?: string;
}

export interface OfflineSyncCounts {
  queued: number;
  sending: number;
  failed: number;
  conflict: number;
  rejected: number;
  requiresReview: number;
}

const DB_NAME = "PaedsResusPlatformOffline";
const DB_VERSION = 1;
const SNAPSHOTS_STORE = "snapshots";
const COMMANDS_STORE = "commands";
const META_STORE = "meta";

const TENANT_SCOPED_COMMANDS = new Set<OfflineAggregateType>([
  "cpd_attendance_intent",
  "utl_response_intent",
  "crash_cart_check",
  "role_report_draft",
  "targeted_report",
  "debrief_draft",
]);

function assertOfflineCommandScope(command: { aggregateType: OfflineAggregateType; actorId?: number; tenantId?: number }) {
  if (!Number.isInteger(command.actorId) || Number(command.actorId) <= 0) {
    throw new Error("An authenticated actor is required for offline work.");
  }
  if (TENANT_SCOPED_COMMANDS.has(command.aggregateType) && (!Number.isInteger(command.tenantId) || Number(command.tenantId) <= 0)) {
    throw new Error("An institution scope is required for this offline record.");
  }
}

function assertOfflineSnapshotScope(snapshot: Pick<OfflineSnapshot, "actorId" | "kind">) {
  if (!Number.isInteger(snapshot.actorId) || Number(snapshot.actorId) <= 0) {
    throw new Error("An authenticated actor is required for offline snapshots.");
  }
  if (snapshot.kind === "iers_shift_snapshot" && snapshot.actorId == null) {
    throw new Error("A provider scope is required for readiness snapshots.");
  }
}

let dbPromise: Promise<IDBDatabase> | null = null;

function notifyStorageFailure(error: unknown) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("platform-offline-storage-error", {
    detail: { message: error instanceof Error ? error.message : "Offline storage is unavailable." },
  }));
}

function localId(prefix: string): string {
  const randomUUID = globalThis.crypto?.randomUUID;
  if (typeof randomUUID === "function") return `${prefix}-${randomUUID.call(globalThis.crypto)}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function openPlatformOfflineDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error("Could not open offline database"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
        const store = db.createObjectStore(SNAPSHOTS_STORE, { keyPath: "key" });
        store.createIndex("kind", "kind", { unique: false });
        store.createIndex("savedAt", "savedAt", { unique: false });
        store.createIndex("tenantId", "tenantId", { unique: false });
      }
      if (!db.objectStoreNames.contains(COMMANDS_STORE)) {
        const store = db.createObjectStore(COMMANDS_STORE, { keyPath: "localEventId" });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("aggregateId", "aggregateId", { unique: false });
        store.createIndex("queuedAt", "queuedAt", { unique: false });
        store.createIndex("actorId", "actorId", { unique: false });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };
  }).catch((error) => {
    dbPromise = null;
    notifyStorageFailure(error);
    throw error;
  });
  return dbPromise!;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

export async function saveOfflineSnapshot<TPayload>(snapshot: OfflineSnapshot<TPayload>): Promise<void> {
  assertOfflineSnapshotScope(snapshot);
  const db = await openPlatformOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(SNAPSHOTS_STORE, "readwrite");
    transaction.objectStore(SNAPSHOTS_STORE).put(snapshot);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save offline snapshot"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Offline snapshot save aborted"));
  }).catch((error) => {
    notifyStorageFailure(error);
    throw error;
  });
}

export function getOfflineSnapshotFreshness<TPayload>(
  snapshot: OfflineSnapshot<TPayload>,
  now = Date.now(),
  defaultStaleAfterMs = 4 * 60 * 60 * 1000,
): OfflineSnapshotFreshness {
  if (snapshot.expiresAt != null && now >= snapshot.expiresAt) return "expired";
  if (now - snapshot.savedAt >= (snapshot.staleAfterMs ?? defaultStaleAfterMs)) return "stale";
  return "fresh";
}

export async function getOfflineSnapshot<TPayload>(key: string): Promise<OfflineSnapshot<TPayload> | null> {
  try {
    const db = await openPlatformOfflineDb();
    const transaction = db.transaction(SNAPSHOTS_STORE, "readonly");
    const row = await requestResult<OfflineSnapshot<TPayload> | undefined>(transaction.objectStore(SNAPSHOTS_STORE).get(key));
    return row ?? null;
  } catch {
    return null;
  }
}

export async function listOfflineSnapshots(kind?: OfflineSnapshotKind): Promise<OfflineSnapshot[]> {
  try {
    const db = await openPlatformOfflineDb();
    const transaction = db.transaction(SNAPSHOTS_STORE, "readonly");
    const store = transaction.objectStore(SNAPSHOTS_STORE);
    const rows = kind
      ? await requestResult<OfflineSnapshot[]>(store.index("kind").getAll(kind))
      : await requestResult<OfflineSnapshot[]>(store.getAll());
    return rows.sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

export async function enqueueOfflineCommand<TPayload>(
  command: Omit<OfflineCommand<TPayload>, "localEventId" | "status" | "attempts" | "queuedAt" | "updatedAt"> & { localEventId?: string },
): Promise<OfflineCommand<TPayload>> {
  const now = Date.now();
  assertOfflineCommandScope(command);
  const fullCommand: OfflineCommand<TPayload> = {
    ...command,
    localEventId: command.localEventId ?? localId("offline"),
    status: "queued",
    attempts: 0,
    queuedAt: now,
    updatedAt: now,
  };
  const db = await openPlatformOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(COMMANDS_STORE, "readwrite");
    transaction.objectStore(COMMANDS_STORE).put(fullCommand);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not queue offline command"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Offline command queue aborted"));
  }).catch((error) => {
    notifyStorageFailure(error);
    throw error;
  });
  return fullCommand;
}

export async function getOfflineCommand<TPayload>(localEventId: string): Promise<OfflineCommand<TPayload> | null> {
  try {
    const db = await openPlatformOfflineDb();
    const transaction = db.transaction(COMMANDS_STORE, "readonly");
    const row = await requestResult<OfflineCommand<TPayload> | undefined>(transaction.objectStore(COMMANDS_STORE).get(localEventId));
    return row ?? null;
  } catch {
    return null;
  }
}

export async function listOfflineCommands(limit = 100): Promise<OfflineCommand[]> {
  try {
    const db = await openPlatformOfflineDb();
    const transaction = db.transaction(COMMANDS_STORE, "readonly");
    const rows = await requestResult<OfflineCommand[]>(transaction.objectStore(COMMANDS_STORE).getAll());
    return rows
      .filter((row) => ["queued", "sending", "failed"].includes(row.status))
      .filter((row) => row.status !== "sending" || row.updatedAt < Date.now() - 30_000)
      .sort((a, b) => a.queuedAt - b.queuedAt)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function updateOfflineCommand<TPayload>(
  localEventId: string,
  update: Partial<Pick<OfflineCommand<TPayload>, "status" | "attempts" | "lastError" | "payload" | "baseVersion">>,
): Promise<void> {
  const db = await openPlatformOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(COMMANDS_STORE, "readwrite");
    const store = transaction.objectStore(COMMANDS_STORE);
    const request = store.get(localEventId);
    request.onsuccess = () => {
      const existing = request.result as OfflineCommand<TPayload> | undefined;
      if (!existing) return;
      store.put({ ...existing, ...update, updatedAt: Date.now() });
    };
    request.onerror = () => reject(request.error ?? new Error("Could not read offline command"));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not update offline command"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Offline command update aborted"));
  });
}

export async function pruneOfflineData(now = Date.now()): Promise<number> {
  try {
    const db = await openPlatformOfflineDb();
    let removed = 0;
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([SNAPSHOTS_STORE, COMMANDS_STORE], "readwrite");
      const snapshotCursor = transaction.objectStore(SNAPSHOTS_STORE).openCursor();
      snapshotCursor.onsuccess = () => {
        const cursor = snapshotCursor.result;
        if (!cursor) return;
        const snapshot = cursor.value as OfflineSnapshot;
        if (snapshot.expiresAt != null && snapshot.expiresAt <= now) {
          cursor.delete();
          removed += 1;
        }
        cursor.continue();
      };
      const commandCursor = transaction.objectStore(COMMANDS_STORE).openCursor();
      commandCursor.onsuccess = () => {
        const cursor = commandCursor.result;
        if (!cursor) return;
        const command = cursor.value as OfflineCommand;
        if (command.status === "acknowledged" && command.updatedAt < now - 7 * 24 * 60 * 60 * 1000) {
          cursor.delete();
          removed += 1;
        }
        cursor.continue();
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not prune offline data"));
      transaction.onabort = () => reject(transaction.error ?? new Error("Offline data prune aborted"));
    });
    return removed;
  } catch (error) {
    notifyStorageFailure(error);
    return 0;
  }
}

export async function removeOfflineCommand(localEventId: string): Promise<void> {
  const db = await openPlatformOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(COMMANDS_STORE, "readwrite");
    transaction.objectStore(COMMANDS_STORE).delete(localEventId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not remove offline command"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Offline command removal aborted"));
  });
}

export async function listOfflineReviewCommands(limit = 100): Promise<OfflineCommand[]> {
  try {
    const db = await openPlatformOfflineDb();
    const transaction = db.transaction(COMMANDS_STORE, "readonly");
    const rows = await requestResult<OfflineCommand[]>(transaction.objectStore(COMMANDS_STORE).getAll());
    return rows
      .filter((row) => ["failed", "conflict", "rejected", "requires_review"].includes(row.status))
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function getOfflineSyncCounts(): Promise<OfflineSyncCounts> {
  try {
    const db = await openPlatformOfflineDb();
    const transaction = db.transaction(COMMANDS_STORE, "readonly");
    const rows = await requestResult<OfflineCommand[]>(transaction.objectStore(COMMANDS_STORE).getAll());
    return rows.reduce<OfflineSyncCounts>((counts, row) => {
      if (row.status === "queued") counts.queued += 1;
      if (row.status === "sending") counts.sending += 1;
      if (row.status === "failed") counts.failed += 1;
      if (row.status === "conflict") counts.conflict += 1;
      if (row.status === "rejected") counts.rejected += 1;
      if (row.status === "requires_review") counts.requiresReview += 1;
      return counts;
    }, { queued: 0, sending: 0, failed: 0, conflict: 0, rejected: 0, requiresReview: 0 });
  } catch {
    return { queued: 0, sending: 0, failed: 0, conflict: 0, rejected: 0, requiresReview: 0 };
  }
}

export async function getOfflineMeta<TValue>(key: string): Promise<TValue | null> {
  try {
    const db = await openPlatformOfflineDb();
    const transaction = db.transaction(META_STORE, "readonly");
    const row = await requestResult<{ key: string; value: TValue } | undefined>(transaction.objectStore(META_STORE).get(key));
    return row?.value ?? null;
  } catch {
    return null;
  }
}

export async function saveOfflineMeta<TValue>(key: string, value: TValue): Promise<void> {
  const db = await openPlatformOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(META_STORE, "readwrite");
    transaction.objectStore(META_STORE).put({ key, value, savedAt: Date.now() });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save offline metadata"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Offline metadata save aborted"));
  });
}

export async function clearOfflineActorData(actorId: number): Promise<void> {
  const db = await openPlatformOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([SNAPSHOTS_STORE, COMMANDS_STORE], "readwrite");
    const snapshotStore = transaction.objectStore(SNAPSHOTS_STORE);
    const commandStore = transaction.objectStore(COMMANDS_STORE);
    snapshotStore.openCursor().onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (!cursor) return;
      if (cursor.value?.actorId === actorId) cursor.delete();
      cursor.continue();
    };
    commandStore.openCursor().onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (!cursor) return;
      if (cursor.value?.actorId === actorId) cursor.delete();
      cursor.continue();
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not clear offline actor data"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Offline actor data clear aborted"));
  });
}

export const clearOfflineDataForActor = clearOfflineActorData;

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Offline transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Offline transaction aborted"));
  });
}

export async function clearPlatformOfflineData(): Promise<void> {
  try {
    const db = await openPlatformOfflineDb();
    const transaction = db.transaction([SNAPSHOTS_STORE, COMMANDS_STORE], "readwrite");
    transaction.objectStore(SNAPSHOTS_STORE).clear();
    transaction.objectStore(COMMANDS_STORE).clear();
    await transactionDone(transaction);
  } catch (error) {
    notifyStorageFailure(error);
    // A storage failure should not crash the app; the visible status surface keeps showing the issue.
  }
}

export const offlineStoreKeys = {
  course: (courseId: string, version: string, actorId?: number) => `course:${actorId ?? "legacy"}:${courseId}:${version}`,
  module: (moduleId: number, version: string, actorId?: number) => `module:${actorId ?? "legacy"}:${moduleId}:${version}`,
  shift: (teamId: number, version: string) => `shift:${teamId}:${version}`,
  providerTeams: (actorId: number, horizonDays: number) => `provider-teams:${actorId}:${horizonDays}`,
  providerDuties: (actorId: number) => `provider-duties:${actorId}`,
  providerReadiness: (actorId: number) => `provider-readiness:${actorId}`,
  crashCartTemplate: (institutionId: number, templateId: number, version: string) => `crash-cart:${institutionId}:${templateId}:${version}`,
} as const;
