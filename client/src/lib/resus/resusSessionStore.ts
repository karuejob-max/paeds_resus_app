/**
 * ResusGPS Session Persistence — IndexedDB Store
 *
 * Saves the active ResusSession to IndexedDB on every state change.
 * On app load, ResusGPS checks for an unfinished session and offers
 * the provider the option to resume it — protecting against accidental
 * browser refreshes during live resuscitations.
 *
 * Design constraints:
 * - Writes are fire-and-forget (never block the clinical UI)
 * - A single "active" slot is used (key = ACTIVE_SESSION_KEY)
 * - Session is cleared when the provider explicitly ends the case
 */

import type { ResusSession } from "./abcdeEngine";

const DB_NAME = "PaedsResusDB";
const DB_VERSION = 3; // v3: add sampleHistory store
const STORE_NAME = "resusSession";
const ACTIVE_SESSION_KEY = "active";
const SAMPLE_STORE = "sampleHistory";
const LAST_SAMPLE_KEY = "last";

// ── DB open (version-aware) ────────────────────────────────────────────────────

function openResusDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

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
    };
  });
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Persist the current session state. Fire-and-forget — never awaited by the UI.
 */
export function persistResusSession(session: ResusSession): void {
  openResusDB()
    .then((db) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put({
        key: ACTIVE_SESSION_KEY,
        session,
        savedAt: Date.now(),
      });
    })
    .catch(() => {
      // Silent — IndexedDB unavailable (private browsing, etc.)
    });
}

/**
 * Load a previously persisted session, if one exists and is recent enough.
 * Returns null if nothing is found or the session is stale (> 4 hours old).
 */
export async function loadPersistedResusSession(): Promise<ResusSession | null> {
  const STALE_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours
  try {
    const db = await openResusDB();
    return await new Promise<ResusSession | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(ACTIVE_SESSION_KEY);
      req.onsuccess = () => {
        const row = req.result as { key: string; session: ResusSession; savedAt: number } | undefined;
        if (!row) return resolve(null);
        if (Date.now() - row.savedAt > STALE_THRESHOLD_MS) return resolve(null);
        // Only offer to resume if the session has at least one event (not a blank new session)
        if (!row.session.events || row.session.events.length === 0) return resolve(null);
        resolve(row.session);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Clear the active session slot — call when the provider ends the case.
 */
export function clearPersistedResusSession(): void {
  openResusDB()
    .then((db) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(ACTIVE_SESSION_KEY);
    })
    .catch(() => {
      // Silent
    });
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
export function saveSampleHistory(sample: PersistedSampleHistory): void {
  const hasContent = Object.values(sample).some((v) => v && v.trim().length > 0);
  if (!hasContent) return;
  openResusDB()
    .then((db) => {
      const tx = db.transaction(SAMPLE_STORE, "readwrite");
      tx.objectStore(SAMPLE_STORE).put({
        key: LAST_SAMPLE_KEY,
        sample,
        savedAt: Date.now(),
      });
    })
    .catch(() => {
      // Silent
    });
}

/**
 * Load the last saved SAMPLE history for pre-filling a new case.
 * Returns null if nothing was saved or data is older than 30 days.
 */
export async function loadLastSampleHistory(): Promise<PersistedSampleHistory | null> {
  const STALE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  try {
    const db = await openResusDB();
    return await new Promise<PersistedSampleHistory | null>((resolve) => {
      const tx = db.transaction(SAMPLE_STORE, "readonly");
      const req = tx.objectStore(SAMPLE_STORE).get(LAST_SAMPLE_KEY);
      req.onsuccess = () => {
        const row = req.result as
          | { key: string; sample: PersistedSampleHistory; savedAt: number }
          | undefined;
        if (!row) return resolve(null);
        if (Date.now() - row.savedAt > STALE_THRESHOLD_MS) return resolve(null);
        resolve(row.sample);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Clear the saved SAMPLE history — call if the provider explicitly dismisses
 * the pre-fill suggestion.
 */
export function clearSampleHistory(): void {
  openResusDB()
    .then((db) => {
      const tx = db.transaction(SAMPLE_STORE, "readwrite");
      tx.objectStore(SAMPLE_STORE).delete(LAST_SAMPLE_KEY);
    })
    .catch(() => {
      // Silent
    });
}
