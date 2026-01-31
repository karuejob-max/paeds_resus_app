/**
 * Offline Storage Utility
 * 
 * Provides IndexedDB interface for storing clinical data offline.
 * Critical for LMICs where connectivity is intermittent.
 * 
 * Features:
 * - Store assessments locally when offline
 * - Queue for background sync when online
 * - Cache PR-DC drug data
 * - Cache clinical guidelines
 */

const DB_NAME = 'PaedsResusDB';
const DB_VERSION = 1;

export interface PendingAssessment {
  id?: number;
  timestamp: number;
  data: {
    patientAge: number;
    patientWeight: number;
    assessmentData: Record<string, unknown>;
    interventions: Array<{
      type: string;
      timestamp: number;
      response?: string;
    }>;
  };
  synced: boolean;
}

export interface ClinicalDataItem {
  key: string;
  value: unknown;
  timestamp: number;
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
      console.log('[IndexedDB] Upgrading database schema...');

      // Create object stores
      if (!db.objectStoreNames.contains('pendingAssessments')) {
        const assessmentStore = db.createObjectStore('pendingAssessments', {
          keyPath: 'id',
          autoIncrement: true,
        });
        assessmentStore.createIndex('timestamp', 'timestamp', { unique: false });
        assessmentStore.createIndex('synced', 'synced', { unique: false });
        console.log('[IndexedDB] Created pendingAssessments store');
      }

      if (!db.objectStoreNames.contains('clinicalData')) {
        const clinicalStore = db.createObjectStore('clinicalData', { keyPath: 'key' });
        clinicalStore.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('[IndexedDB] Created clinicalData store');
      }

      if (!db.objectStoreNames.contains('drugData')) {
        const drugStore = db.createObjectStore('drugData', { keyPath: 'drugId' });
        drugStore.createIndex('name', 'name', { unique: false });
        console.log('[IndexedDB] Created drugData store');
      }
    };
  });
}

/**
 * Save assessment to pending queue
 */
export async function saveAssessmentOffline(assessment: Omit<PendingAssessment, 'id'>): Promise<number> {
  const db = await openDB();
  const tx = db.transaction('pendingAssessments', 'readwrite');
  const store = tx.objectStore('pendingAssessments');

  return new Promise((resolve, reject) => {
    const request = store.add(assessment);

    request.onsuccess = () => {
      console.log('[IndexedDB] Assessment saved offline:', request.result);
      resolve(request.result as number);

      // Register background sync if available
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
          // @ts-ignore - sync API may not be in types yet
          return registration.sync?.register('sync-assessments');
        }).catch((err) => {
          console.warn('[IndexedDB] Background sync registration failed:', err);
        });
      }
    };

    request.onerror = () => {
      console.error('[IndexedDB] Failed to save assessment:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get all pending assessments
 */
export async function getPendingAssessments(): Promise<PendingAssessment[]> {
  const db = await openDB();
  const tx = db.transaction('pendingAssessments', 'readonly');
  const store = tx.objectStore('pendingAssessments');

  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => {
      console.log('[IndexedDB] Retrieved pending assessments:', request.result.length);
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('[IndexedDB] Failed to get pending assessments:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Mark assessment as synced
 */
export async function markAssessmentSynced(id: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('pendingAssessments', 'readwrite');
  const store = tx.objectStore('pendingAssessments');

  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const assessment = getRequest.result;
      if (assessment) {
        assessment.synced = true;
        const updateRequest = store.put(assessment);

        updateRequest.onsuccess = () => {
          console.log('[IndexedDB] Assessment marked as synced:', id);
          resolve();
        };

        updateRequest.onerror = () => {
          console.error('[IndexedDB] Failed to mark assessment as synced:', updateRequest.error);
          reject(updateRequest.error);
        };
      } else {
        resolve();
      }
    };

    getRequest.onerror = () => {
      console.error('[IndexedDB] Failed to get assessment:', getRequest.error);
      reject(getRequest.error);
    };
  });
}

/**
 * Delete synced assessments
 */
export async function deleteSyncedAssessments(): Promise<number> {
  const db = await openDB();
  const tx = db.transaction('pendingAssessments', 'readwrite');
  const store = tx.objectStore('pendingAssessments');
  const index = store.index('synced');

  return new Promise((resolve, reject) => {
    const request = index.openCursor(IDBKeyRange.only(true));
    let deletedCount = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        deletedCount++;
        cursor.continue();
      } else {
        console.log('[IndexedDB] Deleted synced assessments:', deletedCount);
        resolve(deletedCount);
      }
    };

    request.onerror = () => {
      console.error('[IndexedDB] Failed to delete synced assessments:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Cache clinical data
 */
export async function cacheClinicalData(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('clinicalData', 'readwrite');
  const store = tx.objectStore('clinicalData');

  const data: ClinicalDataItem = {
    key,
    value,
    timestamp: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const request = store.put(data);

    request.onsuccess = () => {
      console.log('[IndexedDB] Clinical data cached:', key);
      resolve();

      // Also notify service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_CLINICAL_DATA',
          payload: data,
        });
      }
    };

    request.onerror = () => {
      console.error('[IndexedDB] Failed to cache clinical data:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get cached clinical data
 */
export async function getCachedClinicalData(key: string): Promise<unknown | null> {
  const db = await openDB();
  const tx = db.transaction('clinicalData', 'readonly');
  const store = tx.objectStore('clinicalData');

  return new Promise((resolve, reject) => {
    const request = store.get(key);

    request.onsuccess = () => {
      const result = request.result;
      if (result) {
        console.log('[IndexedDB] Clinical data retrieved from cache:', key);
        resolve(result.value);
      } else {
        console.log('[IndexedDB] Clinical data not found in cache:', key);
        resolve(null);
      }
    };

    request.onerror = () => {
      console.error('[IndexedDB] Failed to get clinical data:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Cache drug data from PR-DC
 */
export async function cacheDrugData(drugs: Array<{ drugId: string; name: string; data: unknown }>): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('drugData', 'readwrite');
  const store = tx.objectStore('drugData');

  return new Promise((resolve, reject) => {
    let completed = 0;

    drugs.forEach((drug) => {
      const request = store.put(drug);

      request.onsuccess = () => {
        completed++;
        if (completed === drugs.length) {
          console.log('[IndexedDB] Drug data cached:', drugs.length);
          resolve();
        }
      };

      request.onerror = () => {
        console.error('[IndexedDB] Failed to cache drug data:', request.error);
        reject(request.error);
      };
    });
  });
}

/**
 * Get drug data
 */
export async function getDrugData(drugId: string): Promise<unknown | null> {
  const db = await openDB();
  const tx = db.transaction('drugData', 'readonly');
  const store = tx.objectStore('drugData');

  return new Promise((resolve, reject) => {
    const request = store.get(drugId);

    request.onsuccess = () => {
      console.log('[IndexedDB] Drug data retrieved:', drugId);
      resolve(request.result?.data || null);
    };

    request.onerror = () => {
      console.error('[IndexedDB] Failed to get drug data:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Search drugs by name
 */
export async function searchDrugs(query: string): Promise<Array<{ drugId: string; name: string }>> {
  const db = await openDB();
  const tx = db.transaction('drugData', 'readonly');
  const store = tx.objectStore('drugData');
  const index = store.index('name');

  return new Promise((resolve, reject) => {
    const request = index.openCursor();
    const results: Array<{ drugId: string; name: string }> = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const drug = cursor.value;
        if (drug.name.toLowerCase().includes(query.toLowerCase())) {
          results.push({ drugId: drug.drugId, name: drug.name });
        }
        cursor.continue();
      } else {
        console.log('[IndexedDB] Drug search complete:', results.length);
        resolve(results);
      }
    };

    request.onerror = () => {
      console.error('[IndexedDB] Drug search failed:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Listen for online/offline events
 */
export function onConnectivityChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Get storage usage
 */
export async function getStorageUsage(): Promise<{ used: number; quota: number; percentage: number }> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (used / quota) * 100 : 0;

    return { used, quota, percentage };
  }

  return { used: 0, quota: 0, percentage: 0 };
}

/**
 * Clear all offline data (for testing or reset)
 */
export async function clearAllOfflineData(): Promise<void> {
  const db = await openDB();

  const stores = ['pendingAssessments', 'clinicalData', 'drugData'];

  for (const storeName of stores) {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => {
        console.log(`[IndexedDB] Cleared ${storeName}`);
        resolve();
      };

      request.onerror = () => {
        console.error(`[IndexedDB] Failed to clear ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  }

  console.log('[IndexedDB] All offline data cleared');
}
