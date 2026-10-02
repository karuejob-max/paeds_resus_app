/**
 * ResusGPS Session Persistence — IndexedDB Store
 *
 * Saves the active ResusSession to IndexedDB without blocking the clinical UI.
 * Sessions, SAMPLE history, and queued events are scoped to the authenticated
 * provider. Storage failures are reported to callers; legacy unowned records
 * are quarantined and counted without exposing their payload.
 *
 * Design constraints:
 * - Writes are asynchronous and never block emergency actions.
 * - Active sessions use one private slot per authenticated provider.
 * - Event outbox rows remain local until server acknowledgement.
 */

import type { ABCDELetter, ClinicalEvent, ResusSession } from "./abcdeEngine";

/** Ensure legacy persisted sessions remain readable without hiding unrecorded dose facts. */
export function normalizeResusSession(session: ResusSession): ResusSession {
  const legacyDoseNeedsReview = session.doseReviewRequired == null && session.threats.some((threat) =>
    threat.interventions.some((intervention) =>
      Boolean(intervention.dose) &&
      (intervention.status === 'completed' || intervention.status === 'in_progress') &&
      !intervention.doseSnapshot,
    ),
  );
  return {
    ...session,
    concurrentDiagnoses: session.concurrentDiagnoses ?? [],
    undoActionLabels: session.undoActionLabels ?? [],
    activeTimers: session.activeTimers ?? [],
    doseReviewRequired: session.doseReviewRequired ?? legacyDoseNeedsReview,
  };
}

const DB_NAME = "PaedsResusDB";
const DB_VERSION = 5; // v5: actor-scoped active session/outbox indexes
const STORE_NAME = "resusSession";
const SAMPLE_STORE = "sampleHistory";
const OUTBOX_STORE = "resusEventOutbox";

// ── DB open (version-aware) ────────────────────────────────────────────────────

function openResusDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const upgradeTransaction = request.transaction;

      // Preserve existing stores from v1
      if (!db.objectStoreNames.contains("pendingAssessments")) {
        const s = db.createObjectStore("pendingAssessments", { keyPath: "id", autoIncrement: true });
        s.createIndex("timestamp", "timestamp", { unique: false });
        s.createIndex("synced", "synced", { unique: false });
      }
      if (!db.objectStoreNames.contains("clinicalData")) {
        const s = db.createObjectStore("clinicalData", { keyPath: "key" });
        s.createIndex("timestamp", "timestamp", { unique: false });
      }
      if (!db.objectStoreNames.contains("drugData")) {
        const s = db.createObjectStore("drugData", { keyPath: "drugId" });
        s.createIndex("name", "name", { unique: false });
      }

      // New in v2: active resus session slot
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }

      // New in v3: SAMPLE history across cases
      if (!db.objectStoreNames.contains(SAMPLE_STORE)) {
        db.createObjectStore(SAMPLE_STORE, { keyPath: "key" });
      }

      // New in v4: durable, idempotent non-arrest event outbox. Events are
      // retained until the server acknowledges them; local-only state is never
      // presented as server-confirmed clinical documentation.
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        const s = db.createObjectStore(OUTBOX_STORE, { keyPath: "localEventId" });
        s.createIndex("sessionId", "sessionId", { unique: false });
        s.createIndex("status", "status", { unique: false });
        s.createIndex("eventTimestamp", "eventTimestamp", { unique: false });
        s.createIndex("actorId", "actorId", { unique: false });
      } else if ((event as IDBVersionChangeEvent).oldVersion < 5 && upgradeTransaction && !upgradeTransaction.objectStore(OUTBOX_STORE).indexNames.contains("actorId")) {
        upgradeTransaction.objectStore(OUTBOX_STORE).createIndex("actorId", "actorId", { unique: false });
      }
    };
  });
}

// ── Public API ─────────────────────────────────────────────────────────────────

export type PersistedResusSessionLoad =
  | { status: 'available'; session: ResusSession }
  | { status: 'none' | 'expired' | 'actor_mismatch' | 'error' };

function notifyResusStorageFailure(message: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('resus-session-storage-error', { detail: { message } }));
  }
}

function assertActorId(actorId: number | undefined): asserts actorId is number {
  if (!Number.isInteger(actorId) || Number(actorId) <= 0) throw new Error('An authenticated provider is required to persist a resuscitation session.');
}

function activeSessionKey(actorId: number): string {
  return `active:${actorId}`;
}

/** Persist the current session under its authenticated owner and report storage failures to the caller. */
export function persistResusSession(session: ResusSession, actorId: number): Promise<void> {
  assertActorId(actorId);
  return openResusDB().then((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({
      key: activeSessionKey(actorId),
      actorId,
      session,
      savedAt: Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Could not save the active resuscitation session.'));
    tx.onabort = () => reject(tx.error ?? new Error('Resuscitation session save was aborted.'));
  })).catch((error) => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('resus-session-storage-error', { detail: { message: 'The active resuscitation could not be saved on this device.' } }));
    throw error;
  });
}

/** Load only the authenticated actor's session; a session never crosses account boundaries. */
export async function loadPersistedResusSession(actorId: number): Promise<PersistedResusSessionLoad> {
  assertActorId(actorId);
  const STALE_THRESHOLD_MS = 4 * 60 * 60 * 1000;
  try {
    const db = await openResusDB();
    return await new Promise<PersistedResusSessionLoad>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(activeSessionKey(actorId));
      req.onsuccess = () => {
        const row = req.result as { key: string; actorId?: number; session: ResusSession; savedAt: number } | undefined;
        if (!row) return resolve({ status: 'none' });
        if (row.actorId !== actorId) return resolve({ status: 'actor_mismatch' });
        if (Date.now() - row.savedAt > STALE_THRESHOLD_MS) return resolve({ status: 'expired' });
        if (!row.session.events || row.session.events.length === 0) return resolve({ status: 'none' });
        resolve({ status: 'available', session: normalizeResusSession(row.session) });
      };
      req.onerror = () => resolve({ status: 'error' });
    });
  } catch {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('resus-session-storage-error', { detail: { message: 'The previous resuscitation session could not be read from this device.' } }));
    return { status: 'error' };
  }
}

/** Clear only the signed-in actor's active slot after that case is explicitly ended. */
export function clearPersistedResusSession(actorId: number): Promise<void> {
  assertActorId(actorId);
  return openResusDB().then((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(activeSessionKey(actorId));
    request.onsuccess = () => {
      const row = request.result as { actorId?: number } | undefined;
      if (row?.actorId === actorId) store.delete(activeSessionKey(actorId));
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Could not clear the ended resuscitation session.'));
    tx.onabort = () => reject(tx.error ?? new Error('Resuscitation session cleanup was aborted.'));
  }));
}

// ── Non-arrest event outbox ─────────────────────────────────────────────────────

export type ResusEventOutboxStatus = 'pending' | 'sending' | 'failed';

export interface ResusEventOutboxRecord {
  localEventId: string;
  sessionId: string;
  actorId: number;
  activationEventId?: number;
  eventType: ClinicalEvent['type'];
  eventTimestamp: number;
  letter?: ABCDELetter;
  detail: string;
  data?: Record<string, unknown>;
  status: ResusEventOutboxStatus;
  attempts: number;
  nextAttemptAt?: number;
  lastError?: string;
  queuedAt: number;
  updatedAt: number;
}

export function enqueueResusEvent(record: Omit<ResusEventOutboxRecord, 'status' | 'attempts' | 'queuedAt' | 'updatedAt'>): Promise<void> {
  assertActorId(record.actorId);
  return openResusDB().then((db) => new Promise<void>((resolve, reject) => {
    const now = Date.now();
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    tx.objectStore(OUTBOX_STORE).put({
      ...record,
      status: 'pending',
      attempts: 0,
      queuedAt: now,
      updatedAt: now,
    } satisfies ResusEventOutboxRecord);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}

export async function listPendingResusEvents(actorId: number, limit = 100): Promise<ResusEventOutboxRecord[]> {
  assertActorId(actorId);
  try {
    const db = await openResusDB();
    return await new Promise<ResusEventOutboxRecord[]>((resolve, reject) => {
      const rows: ResusEventOutboxRecord[] = [];
      const tx = db.transaction(OUTBOX_STORE, 'readonly');
      const request = tx.objectStore(OUTBOX_STORE).index('eventTimestamp').openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor || rows.length >= limit) return resolve(rows);
        const row = cursor.value as ResusEventOutboxRecord;
        if (row.actorId === actorId) rows.push(row);
        cursor.continue();
      };
      request.onerror = () => reject(request.error ?? new Error('Could not read the local clinical event outbox.'));
    });
  } catch (error) {
    notifyResusStorageFailure('The local clinical event outbox could not be read. Do not assume queued events are synced.');
    throw error;
  }
}

/** Count quarantined legacy rows without exposing their clinical payload. */
export async function countUnownedResusRecords(): Promise<number> {
  try {
    const db = await openResusDB();
    return await new Promise<number>((resolve, reject) => {
      const tx = db.transaction([STORE_NAME, SAMPLE_STORE, OUTBOX_STORE], 'readonly');
      const requests = [
        tx.objectStore(STORE_NAME).getAll(),
        tx.objectStore(SAMPLE_STORE).getAll(),
        tx.objectStore(OUTBOX_STORE).getAll(),
      ];
      const counts = [0, 0, 0];
      let remaining = requests.length;
      requests.forEach((request, index) => {
        request.onsuccess = () => {
          const rows = request.result as Array<{ key?: string; actorId?: number }>;
          counts[index] = rows.filter((row) => {
            if (index === 0) return !Number.isInteger(row.actorId) || row.key !== activeSessionKey(row.actorId as number);
            if (index === 1) return !Number.isInteger(row.actorId) || row.key !== sampleHistoryKey(row.actorId as number);
            return !Number.isInteger(row.actorId);
          }).length;
          remaining -= 1;
          if (remaining === 0) resolve(counts.reduce((sum, value) => sum + value, 0));
        };
        request.onerror = () => reject(request.error ?? new Error('Could not inspect legacy local clinical records.'));
      });
      tx.onerror = () => reject(tx.error ?? new Error('Could not inspect legacy local clinical records.'));
    });
  } catch (error) {
    notifyResusStorageFailure('Legacy local clinical records could not be checked. Do not assume this shared device is clear.');
    throw error;
  }
}

export async function markResusEventSending(localEventId: string, actorId: number): Promise<boolean> {
  assertActorId(actorId);
  try {
    const db = await openResusDB();
    return await new Promise<boolean>((resolve, reject) => {
      let claimed = false;
      const now = Date.now();
      const tx = db.transaction(OUTBOX_STORE, 'readwrite');
      const store = tx.objectStore(OUTBOX_STORE);
      const request = store.get(localEventId);
      request.onsuccess = () => {
        const row = request.result as ResusEventOutboxRecord | undefined;
        if (!row) {
          tx.abort();
          reject(new Error('The local clinical event no longer exists.'));
          return;
        }
        if (row.actorId !== actorId) {
          tx.abort();
          reject(new Error('This clinical event belongs to another provider account.'));
          return;
        }
        if ((row.status === 'sending' && row.updatedAt >= now - 30_000) || (row.nextAttemptAt != null && row.nextAttemptAt > now)) return;
        store.put({
          ...row,
          status: 'sending',
          attempts: row.attempts + 1,
          nextAttemptAt: undefined,
          updatedAt: now,
        } satisfies ResusEventOutboxRecord);
        claimed = true;
      };
      request.onerror = () => reject(request.error ?? new Error('Could not read the local clinical event before sending.'));
      tx.oncomplete = () => resolve(claimed);
      tx.onerror = () => reject(tx.error ?? new Error('Could not claim the local clinical event for sending.'));
      tx.onabort = () => reject(tx.error ?? new Error('Local clinical event claim was aborted.'));
    });
  } catch (error) {
    notifyResusStorageFailure('The local clinical event could not be claimed for sending. Do not assume it is synced.');
    throw error;
  }
}

/** Count all unacknowledged event rows for one actor without exposing their payload. */
export async function countPendingResusEvents(actorId: number): Promise<number> {
  assertActorId(actorId);
  try {
    const db = await openResusDB();
    return await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(OUTBOX_STORE, 'readonly');
      const request = tx.objectStore(OUTBOX_STORE).getAll();
      request.onsuccess = () => {
        const rows = request.result as ResusEventOutboxRecord[];
        resolve(rows.filter((row) => row.actorId === actorId).length);
      };
      request.onerror = () => reject(request.error ?? new Error('Could not count the local clinical event outbox.'));
    });
  } catch (error) {
    notifyResusStorageFailure('The local clinical event outbox count could not be read. Do not assume queued events are synced.');
    throw error;
  }
}

export function markResusEventFailed(localEventId: string, actorId: number, error: string): Promise<void> {
  return updateResusEventOutbox(localEventId, actorId, (row) => ({
    ...row,
    status: 'failed',
    lastError: error.slice(0, 500),
    nextAttemptAt: Date.now() + Math.min(5 * 60_000, 5_000 * 2 ** Math.min(row.attempts, 6)),
    updatedAt: Date.now(),
  }));
}

export function removeResusEvent(localEventId: string, actorId: number): Promise<void> {
  assertActorId(actorId);
  return openResusDB().then((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    const store = tx.objectStore(OUTBOX_STORE);
    const request = store.get(localEventId);
    request.onsuccess = () => {
      const row = request.result as ResusEventOutboxRecord | undefined;
      if (!row) return;
      if (row.actorId !== actorId) {
        reject(new Error('This clinical event belongs to another provider account.'));
        tx.abort();
        return;
      }
      store.delete(localEventId);
    };
    request.onerror = () => reject(request.error ?? new Error('Could not read the local clinical event before removal.'));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}

function updateResusEventOutbox(localEventId: string, actorId: number, updater: (row: ResusEventOutboxRecord) => ResusEventOutboxRecord): Promise<void> {
  assertActorId(actorId);
  return openResusDB().then((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    const store = tx.objectStore(OUTBOX_STORE);
    const request = store.get(localEventId);
    request.onsuccess = () => {
      const row = request.result as ResusEventOutboxRecord | undefined;
      if (!row) return;
      if (row.actorId !== actorId) {
        reject(new Error('This clinical event belongs to another provider account.'));
        tx.abort();
        return;
      }
      store.put(updater(row));
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}

// ── SAMPLE History Persistence ────────────────────────────────────────────────

export interface PersistedSampleHistory {
  signs?: string;
  allergies?: string;
  medications?: string;
  pastHistory?: string;
  lastMeal?: string;
  events?: string;
}

/**
 * Save the SAMPLE history from the current session so it can be pre-filled
 * in the next case. Called whenever a SAMPLE field is updated.
 * Only saves if at least one field is non-empty.
 */
function sampleHistoryKey(actorId: number): string {
  return `last:${actorId}`;
}

export function saveSampleHistory(sample: PersistedSampleHistory, actorId: number): Promise<void> {
  assertActorId(actorId);
  const hasContent = Object.values(sample).some((v) => v && v.trim().length > 0);
  if (!hasContent) return Promise.resolve();
  return openResusDB().then((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(SAMPLE_STORE, 'readwrite');
    tx.objectStore(SAMPLE_STORE).put({ key: sampleHistoryKey(actorId), actorId, sample, savedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Could not save provider SAMPLE history.'));
    tx.onabort = () => reject(tx.error ?? new Error('SAMPLE history save was aborted.'));
  }));
}

/**
 * Load the last saved SAMPLE history for pre-filling a new case.
 * Returns null if nothing was saved or data is older than 30 days.
 */
export async function loadLastSampleHistory(actorId: number): Promise<PersistedSampleHistory | null> {
  assertActorId(actorId);
  const STALE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  try {
    const db = await openResusDB();
    return await new Promise<PersistedSampleHistory | null>((resolve) => {
      const tx = db.transaction(SAMPLE_STORE, "readonly");
      const req = tx.objectStore(SAMPLE_STORE).get(sampleHistoryKey(actorId));
      req.onsuccess = () => {
        const row = req.result as
          | { key: string; actorId?: number; sample: PersistedSampleHistory; savedAt: number }
          | undefined;
        if (!row) return resolve(null);
        if (row.actorId !== actorId) return resolve(null);
        if (Date.now() - row.savedAt > STALE_THRESHOLD_MS) return resolve(null);
        resolve(row.sample);
      };
      req.onerror = () => resolve(null);
    });
  } catch (error) {
    notifyResusStorageFailure('Saved SAMPLE history could not be read from this device.');
    throw error;
  }
}

/**
 * Clear the saved SAMPLE history — call if the provider explicitly dismisses
 * the pre-fill suggestion.
 */
export function clearSampleHistory(actorId: number): Promise<void> {
  assertActorId(actorId);
  return openResusDB().then((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(SAMPLE_STORE, 'readwrite');
    tx.objectStore(SAMPLE_STORE).delete(sampleHistoryKey(actorId));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Could not clear provider SAMPLE history.'));
    tx.onabort = () => reject(tx.error ?? new Error('SAMPLE history cleanup was aborted.'));
  }));
}
