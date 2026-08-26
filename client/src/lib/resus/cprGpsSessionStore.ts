import type { CprEngineState, ArrestPhase, RhythmType } from './cpr-engine';
import type { CprArrestEvent } from '@/components/cpr/CprClockSharedContext';

const DB_NAME = 'PaedsResusCPRGPS';
const DB_VERSION = 1;
const STORE_NAME = 'snapshots';
const OUTBOX_STORE_NAME = 'eventOutbox';
const MAX_AGE_MS = 4 * 60 * 60 * 1000;

export interface CprGpsEventOutboxItem {
  localEventId: string;
  caseKey: string;
  sessionId: number | null;
  memberId?: number | null;
  eventType: 'compression_cycle' | 'medication' | 'defibrillation' | 'airway' | 'note' | 'outcome';
  eventTime: number;
  description?: string;
  value?: string;
  metadata?: string;
  queuedAt: number;
}

export interface CprGpsSnapshot {
  caseKey: string;
  savedAt: number;
  arrestDuration: number;
  compressionElapsed: number;
  cycleNumber: number;
  cycleTime: number;
  isRunning: boolean;
  phase: ArrestPhase;
  engineState: CprEngineState;
  rhythmType: RhythmType | null;
  roscAchieved: boolean;
  advancedAirwayPlaced: boolean;
  defibrillatorDelayed: boolean;
  defibCharging: boolean;
  chargeForShock: boolean;
  rhythmWindowElapsed: number | null;
  reassessmentTime: number;
  events: CprArrestEvent[];
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'caseKey' });
      }
      if (!db.objectStoreNames.contains(OUTBOX_STORE_NAME)) {
        db.createObjectStore(OUTBOX_STORE_NAME, { keyPath: 'localEventId' });
      }
    };
  });
}

export function persistCprGpsSnapshot(snapshot: CprGpsSnapshot): void {
  if (!snapshot.caseKey) return;
  openDb()
    .then((db) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ ...snapshot, savedAt: Date.now() });
    })
    .catch(() => {
      // Recovery is progressive enhancement; the live CPR surface must not block.
    });
}

export async function loadCprGpsSnapshot(caseKey: string): Promise<CprGpsSnapshot | null> {
  if (!caseKey) return null;
  try {
    const db = await openDb();
    return await new Promise<CprGpsSnapshot | null>((resolve) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(caseKey);
      request.onsuccess = () => {
        const snapshot = request.result as CprGpsSnapshot | undefined;
        if (!snapshot || Date.now() - snapshot.savedAt > MAX_AGE_MS) {
          resolve(null);
          return;
        }
        resolve(snapshot);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export function clearCprGpsSnapshot(caseKey: string): void {
  if (!caseKey) return;
  openDb()
    .then((db) => {
      db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(caseKey);
    })
    .catch(() => {
      // Best-effort cleanup only.
    });
}

export function enqueueCprGpsEvent(item: CprGpsEventOutboxItem): void {
  if (!item.caseKey || !item.localEventId) return;
  openDb()
    .then((db) => {
      db.transaction(OUTBOX_STORE_NAME, 'readwrite').objectStore(OUTBOX_STORE_NAME).put(item);
    })
    .catch(() => {
      // The in-memory event log remains the immediate fallback.
    });
}

export async function loadCprGpsEventOutbox(caseKey: string): Promise<CprGpsEventOutboxItem[]> {
  if (!caseKey) return [];
  try {
    const db = await openDb();
    return await new Promise<CprGpsEventOutboxItem[]>((resolve) => {
      const request = db.transaction(OUTBOX_STORE_NAME, 'readonly').objectStore(OUTBOX_STORE_NAME).getAll();
      request.onsuccess = () => resolve((request.result as CprGpsEventOutboxItem[]).filter((item) => item.caseKey === caseKey));
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export function acknowledgeCprGpsEvent(localEventId: string): void {
  if (!localEventId) return;
  openDb()
    .then((db) => {
      db.transaction(OUTBOX_STORE_NAME, 'readwrite').objectStore(OUTBOX_STORE_NAME).delete(localEventId);
    })
    .catch(() => {
      // Best-effort cleanup only.
    });
}
