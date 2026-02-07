/**
 * IndexedDB Wrapper for Offline Clinical Data Storage
 * 
 * Stores clinical assessments, CPR sessions, interventions locally
 * when offline. Syncs with server when connectivity returns.
 */

const DB_NAME = 'ResusGPS';
const DB_VERSION = 2;

// Object store names
export const STORES = {
  PENDING_MUTATIONS: 'pendingMutations',
  CLINICAL_ASSESSMENTS: 'clinicalAssessments',
  CPR_SESSIONS: 'cprSessions',
  INTERVENTIONS: 'interventions',
  PROTOCOLS: 'protocols',
  SYNC_QUEUE: 'syncQueue',
} as const;

export interface PendingMutation {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface ClinicalAssessment {
  id?: number;
  sessionId: string;
  patientAge: number;
  patientWeight: number;
  surveyData: unknown;
  differentials: unknown[];
  interventions: unknown[];
  timestamp: number;
  synced: boolean;
}

export interface CPRSession {
  id?: number;
  sessionId: string;
  sessionCode: string;
  patientAge: number;
  patientWeight: number;
  startTime: number;
  endTime?: number;
  events: unknown[];
  teamMembers: unknown[];
  synced: boolean;
}

export interface Intervention {
  id?: number;
  sessionId: string;
  type: string;
  data: unknown;
  timestamp: number;
  synced: boolean;
}

export interface Protocol {
  id: string;
  name: string;
  category: string;
  content: unknown;
  version: string;
  lastUpdated: number;
}

export interface SyncQueueItem {
  id?: number;
  type: 'assessment' | 'session' | 'intervention';
  data: unknown;
  timestamp: number;
  attempts: number;
}

/**
 * Open IndexedDB database
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[IndexedDB] Failed to open database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log('[IndexedDB] Database opened successfully');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log(`[IndexedDB] Upgrading database from version ${event.oldVersion} to ${DB_VERSION}`);

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.PENDING_MUTATIONS)) {
        const store = db.createObjectStore(STORES.PENDING_MUTATIONS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CLINICAL_ASSESSMENTS)) {
        const store = db.createObjectStore(STORES.CLINICAL_ASSESSMENTS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('sessionId', 'sessionId', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CPR_SESSIONS)) {
        const store = db.createObjectStore(STORES.CPR_SESSIONS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('sessionId', 'sessionId', { unique: true });
        store.createIndex('sessionCode', 'sessionCode', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('startTime', 'startTime', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.INTERVENTIONS)) {
        const store = db.createObjectStore(STORES.INTERVENTIONS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('sessionId', 'sessionId', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PROTOCOLS)) {
        const store = db.createObjectStore(STORES.PROTOCOLS, {
          keyPath: 'id',
        });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const store = db.createObjectStore(STORES.SYNC_QUEUE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      console.log('[IndexedDB] Database upgrade complete');
    };
  });
}

/**
 * Generic add operation
 */
export async function addItem<T>(storeName: string, item: T): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);

    request.onsuccess = () => {
      console.log(`[IndexedDB] Added item to ${storeName}:`, request.result);
      resolve(request.result as number);
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Failed to add item to ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

/**
 * Generic get operation
 */
export async function getItem<T>(storeName: string, id: number): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result as T | undefined);
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Failed to get item from ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

/**
 * Generic get all operation
 */
export async function getAllItems<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as T[]);
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Failed to get all items from ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

/**
 * Generic update operation
 */
export async function updateItem<T>(storeName: string, item: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => {
      console.log(`[IndexedDB] Updated item in ${storeName}`);
      resolve();
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Failed to update item in ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

/**
 * Generic delete operation
 */
export async function deleteItem(storeName: string, id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log(`[IndexedDB] Deleted item from ${storeName}:`, id);
      resolve();
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Failed to delete item from ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

/**
 * Get items by index
 */
export async function getItemsByIndex<T>(
  storeName: string,
  indexName: string,
  value: unknown
): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);

    request.onsuccess = () => {
      resolve(request.result as T[]);
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Failed to get items by index from ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

/**
 * Clear all data from a store
 */
export async function clearStore(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => {
      console.log(`[IndexedDB] Cleared store: ${storeName}`);
      resolve();
    };

    request.onerror = () => {
      console.error(`[IndexedDB] Failed to clear store ${storeName}:`, request.error);
      reject(request.error);
    };
  });
}

// Specialized functions for common operations

/**
 * Queue a mutation for background sync
 */
export async function queueMutation(mutation: Omit<PendingMutation, 'id'>): Promise<number> {
  return addItem(STORES.PENDING_MUTATIONS, mutation);
}

/**
 * Get all pending mutations
 */
export async function getPendingMutations(): Promise<PendingMutation[]> {
  return getAllItems<PendingMutation>(STORES.PENDING_MUTATIONS);
}

/**
 * Delete a synced mutation
 */
export async function deleteMutation(id: number): Promise<void> {
  return deleteItem(STORES.PENDING_MUTATIONS, id);
}

/**
 * Save clinical assessment offline
 */
export async function saveClinicalAssessment(assessment: Omit<ClinicalAssessment, 'id'>): Promise<number> {
  return addItem(STORES.CLINICAL_ASSESSMENTS, assessment);
}

/**
 * Get unsynced clinical assessments
 */
export async function getUnsyncedAssessments(): Promise<ClinicalAssessment[]> {
  return getItemsByIndex<ClinicalAssessment>(STORES.CLINICAL_ASSESSMENTS, 'synced', false);
}

/**
 * Save CPR session offline
 */
export async function saveCPRSession(session: Omit<CPRSession, 'id'>): Promise<number> {
  return addItem(STORES.CPR_SESSIONS, session);
}

/**
 * Get CPR session by session ID
 */
export async function getCPRSessionBySessionId(sessionId: string): Promise<CPRSession | undefined> {
  const sessions = await getItemsByIndex<CPRSession>(STORES.CPR_SESSIONS, 'sessionId', sessionId);
  return sessions[0];
}

/**
 * Get unsynced CPR sessions
 */
export async function getUnsyncedCPRSessions(): Promise<CPRSession[]> {
  return getItemsByIndex<CPRSession>(STORES.CPR_SESSIONS, 'synced', false);
}

/**
 * Save intervention offline
 */
export async function saveIntervention(intervention: Omit<Intervention, 'id'>): Promise<number> {
  return addItem(STORES.INTERVENTIONS, intervention);
}

/**
 * Get interventions for a session
 */
export async function getInterventionsBySession(sessionId: string): Promise<Intervention[]> {
  return getItemsByIndex<Intervention>(STORES.INTERVENTIONS, 'sessionId', sessionId);
}

/**
 * Cache protocol for offline access
 */
export async function cacheProtocol(protocol: Protocol): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PROTOCOLS], 'readwrite');
    const store = transaction.objectStore(STORES.PROTOCOLS);
    const request = store.put(protocol);

    request.onsuccess = () => {
      console.log(`[IndexedDB] Cached protocol: ${protocol.id}`);
      resolve();
    };

    request.onerror = () => {
      console.error('[IndexedDB] Failed to cache protocol:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get cached protocol
 */
export async function getCachedProtocol(id: string): Promise<Protocol | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PROTOCOLS], 'readonly');
    const store = transaction.objectStore(STORES.PROTOCOLS);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result as Protocol | undefined);
    };

    request.onerror = () => {
      console.error('[IndexedDB] Failed to get cached protocol:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get database statistics
 */
export async function getDBStats(): Promise<Record<string, number>> {
  const stats: Record<string, number> = {};

  for (const storeName of Object.values(STORES)) {
    const items = await getAllItems(storeName);
    stats[storeName] = items.length;
  }

  return stats;
}

console.log('[IndexedDB] Offline DB module loaded');
