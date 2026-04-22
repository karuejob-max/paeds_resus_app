/**
 * IndexedDB Persistence Layer for PaedsResusGPS
 * 
 * Manages local storage of clinical data for offline-first operation
 */

export interface ClinicalDataRecord {
  id: string;
  sessionId: string;
  type: 'intervention' | 'assessment' | 'override' | 'session';
  data: any;
  timestamp: number;
  synced: boolean;
  syncAttempts: number;
  lastSyncError?: string;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingCount: number;
  failedCount: number;
}

export class ClinicalDataStore {
  private dbName = 'PaedsResusGPS';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    const request = indexedDB.open(this.dbName, this.dbVersion);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
    };

    request.onsuccess = () => {
      this.db = request.result;
      console.log('IndexedDB initialized successfully');
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      if (!db.objectStoreNames.contains('clinicalData')) {
        const clinicalStore = db.createObjectStore('clinicalData', { keyPath: 'id' });
        clinicalStore.createIndex('sessionId', 'sessionId', { unique: false });
        clinicalStore.createIndex('timestamp', 'timestamp', { unique: false });
        clinicalStore.createIndex('synced', 'synced', { unique: false });
      }

      if (!db.objectStoreNames.contains('sessions')) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('startTime', 'startTime', { unique: false });
        sessionStore.createIndex('status', 'status', { unique: false });
      }

      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
    };
  }

  /**
   * Save clinical data record
   */
  public async saveClinicalData(record: Omit<ClinicalDataRecord, 'id'>): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['clinicalData'], 'readwrite');
      const store = transaction.objectStore('clinicalData');

      const id = `${record.sessionId}-${record.type}-${Date.now()}`;
      const fullRecord: ClinicalDataRecord = {
        ...record,
        id,
      };

      const request = store.add(fullRecord);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(id);
    });
  }

  /**
   * Get all clinical data for a session
   */
  public async getSessionData(sessionId: string): Promise<ClinicalDataRecord[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['clinicalData'], 'readonly');
      const store = transaction.objectStore('clinicalData');
      const index = store.index('sessionId');

      const request = index.getAll(sessionId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Get pending (unsynced) clinical data
   */
  public async getPendingData(limit: number = 100): Promise<ClinicalDataRecord[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['clinicalData'], 'readonly');
      const store = transaction.objectStore('clinicalData');
      const index = store.index('synced');

      const request = index.getAll(false);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result.slice(0, limit);
        resolve(results);
      };
    });
  }

  /**
   * Mark record as synced
   */
  public async markAsSynced(recordId: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['clinicalData'], 'readwrite');
      const store = transaction.objectStore('clinicalData');

      const getRequest = store.get(recordId);

      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.synced = true;
          record.syncAttempts = (record.syncAttempts || 0) + 1;
          delete record.lastSyncError;

          const updateRequest = store.put(record);
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        } else {
          reject(new Error('Record not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Mark record as sync failed
   */
  public async markSyncFailed(recordId: string, error: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['clinicalData'], 'readwrite');
      const store = transaction.objectStore('clinicalData');

      const getRequest = store.get(recordId);

      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.syncAttempts = (record.syncAttempts || 0) + 1;
          record.lastSyncError = error;

          const updateRequest = store.put(record);
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        } else {
          reject(new Error('Record not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Save session
   */
  public async saveSession(sessionData: any): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');

      const session = {
        ...sessionData,
        id: sessionData.id || `session-${Date.now()}`,
        startTime: sessionData.startTime || Date.now(),
      };

      const request = store.put(session);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(session.id);
    });
  }

  /**
   * Get session
   */
  public async getSession(sessionId: string): Promise<any> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');

      const request = store.get(sessionId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Get sync status
   */
  public async getSyncStatus(): Promise<SyncStatus> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['clinicalData'], 'readonly');
      const store = transaction.objectStore('clinicalData');

      const allRequest = store.getAll();
      allRequest.onerror = () => reject(allRequest.error);
      allRequest.onsuccess = () => {
        const records = allRequest.result;
        const pendingCount = records.filter(r => !r.synced).length;
        const failedCount = records.filter(r => r.lastSyncError).length;

        resolve({
          isSyncing: false,
          lastSyncTime: null,
          pendingCount,
          failedCount,
        });
      };
    });
  }

  /**
   * Clear all data
   */
  public async clearAll(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['clinicalData', 'sessions', 'syncQueue'], 'readwrite');

      transaction.objectStore('clinicalData').clear();
      transaction.objectStore('sessions').clear();
      transaction.objectStore('syncQueue').clear();

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  /**
   * Export session data for SBAR
   */
  public async exportSessionData(sessionId: string): Promise<any> {
    const sessionData = await this.getSession(sessionId);
    const clinicalData = await this.getSessionData(sessionId);

    return {
      session: sessionData,
      events: clinicalData,
      exportTime: Date.now(),
    };
  }
}

/**
 * React hook for using the clinical data store
 */
export function useClinicalDataStore() {
  const store = new ClinicalDataStore();

  return {
    saveClinicalData: (record: Omit<ClinicalDataRecord, 'id'>) =>
      store.saveClinicalData(record),
    getSessionData: (sessionId: string) =>
      store.getSessionData(sessionId),
    getPendingData: (limit?: number) =>
      store.getPendingData(limit),
    markAsSynced: (recordId: string) =>
      store.markAsSynced(recordId),
    markSyncFailed: (recordId: string, error: string) =>
      store.markSyncFailed(recordId, error),
    saveSession: (sessionData: any) =>
      store.saveSession(sessionData),
    getSession: (sessionId: string) =>
      store.getSession(sessionId),
    getSyncStatus: () =>
      store.getSyncStatus(),
    clearAll: () =>
      store.clearAll(),
    exportSessionData: (sessionId: string) =>
      store.exportSessionData(sessionId),
  };
}
