/**
 * Typed platform-wide offline persistence.
 *
 * This store is deliberately separate from the legacy generic queue and from
 * the ResusGPS clinical-event store. Domain adapters must decide what may be
 * cached or queued; this module only provides durable, typed primitives.
 */

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
  requiresReview: number;
}

const DB_NAME = "PaedsResusPlatformOffline";
const DB_VERSION = 1;
const SNAPSHOTS_STORE = "snapshots";
const COMMANDS_STORE = "commands";
const META_STORE = "meta";

let dbPromise: Promise<IDBDatabase> | null = null;

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
  const db = await openPlatformOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(SNAPSHOTS_STORE, "readwrite");
    transaction.objectStore(SNAPSHOTS_STORE).put(snapshot);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Could not save offline snapshot"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Offline snapshot save aborted"));
  });
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
      if (row.status === "requires_review") counts.requiresReview += 1;
      return counts;
    }, { queued: 0, sending: 0, failed: 0, conflict: 0, requiresReview: 0 });
  } catch {
    return { queued: 0, sending: 0, failed: 0, conflict: 0, requiresReview: 0 };
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
  } catch {
    // A storage failure should not crash the app; the next status refresh will keep showing the issue.
  }
}

export const offlineStoreKeys = {
  course: (courseId: string, version: string) => `course:${courseId}:${version}`,
  module: (moduleId: number, version: string) => `module:${moduleId}:${version}`,
  shift: (teamId: number, version: string) => `shift:${teamId}:${version}`,
  providerTeams: (actorId: number, horizonDays: number) => `provider-teams:${actorId}:${horizonDays}`,
  providerDuties: (actorId: number) => `provider-duties:${actorId}`,
  providerReadiness: (actorId: number) => `provider-readiness:${actorId}`,
  crashCartTemplate: (institutionId: number, templateId: number, version: string) => `crash-cart:${institutionId}:${templateId}:${version}`,
} as const;
