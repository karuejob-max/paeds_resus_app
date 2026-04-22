/**
 * Background Sync and Conflict Resolution Engine
 * 
 * Manages synchronization of offline clinical data with server
 */

import { ClinicalDataStore, type ClinicalDataRecord } from './indexed-db';

export interface SyncConflict {
  recordId: string;
  localVersion: ClinicalDataRecord;
  serverVersion: any;
  conflictType: 'timestamp' | 'data_mismatch' | 'deletion';
  resolution: 'local' | 'server' | 'merge';
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: SyncConflict[];
  duration: number;
}

export class BackgroundSyncEngine {
  private store: ClinicalDataStore;
  private isSyncing: boolean = false;
  private syncInterval: number = 30000; // 30 seconds
  private maxRetries: number = 3;
  private syncCallbacks: Array<(result: SyncResult) => void> = [];

  constructor() {
    this.store = new ClinicalDataStore();
    this.initializeSync();
  }

  private initializeSync(): void {
    // Register for background sync if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.sync.register('sync-clinical-data').catch((err) => {
          console.warn('Background sync registration failed:', err);
        });
      });
    }

    // Start periodic sync
    this.startPeriodicSync();
  }

  private startPeriodicSync(): void {
    setInterval(() => {
      if (!this.isSyncing && navigator.onLine) {
        this.syncPendingData();
      }
    }, this.syncInterval);
  }

  /**
   * Sync pending clinical data with server
   */
  public async syncPendingData(): Promise<SyncResult> {
    if (this.isSyncing) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        conflicts: [],
        duration: 0,
      };
    }

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      const pendingData = await this.store.getPendingData(50);

      if (pendingData.length === 0) {
        return {
          success: true,
          synced: 0,
          failed: 0,
          conflicts: [],
          duration: Date.now() - startTime,
        };
      }

      const result: SyncResult = {
        success: true,
        synced: 0,
        failed: 0,
        conflicts: [],
        duration: 0,
      };

      // Sync each record
      for (const record of pendingData) {
        try {
          const syncSuccess = await this.syncRecord(record);

          if (syncSuccess) {
            result.synced++;
            await this.store.markAsSynced(record.id);
          } else {
            result.failed++;
          }
        } catch (error) {
          result.failed++;
          await this.store.markSyncFailed(record.id, String(error));
        }
      }

      result.duration = Date.now() - startTime;
      result.success = result.failed === 0;

      // Notify callbacks
      this.syncCallbacks.forEach(callback => callback(result));

      return result;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync individual record
   */
  private async syncRecord(record: ClinicalDataRecord): Promise<boolean> {
    try {
      const response = await fetch('/api/sync-clinical-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId: record.id,
          sessionId: record.sessionId,
          type: record.type,
          data: record.data,
          timestamp: record.timestamp,
          syncAttempts: record.syncAttempts,
        }),
      });

      if (response.ok) {
        return true;
      }

      if (response.status === 409) {
        // Conflict detected
        const serverData = await response.json();
        await this.handleConflict(record, serverData);
        return false;
      }

      return false;
    } catch (error) {
      console.error('Sync record failed:', error);
      return false;
    }
  }

  /**
   * Handle sync conflicts
   */
  private async handleConflict(localRecord: ClinicalDataRecord, serverData: any): Promise<void> {
    const conflict: SyncConflict = {
      recordId: localRecord.id,
      localVersion: localRecord,
      serverVersion: serverData,
      conflictType: this.determineConflictType(localRecord, serverData),
      resolution: this.resolveConflict(localRecord, serverData),
    };

    // Apply resolution
    if (conflict.resolution === 'server') {
      // Discard local changes, use server version
      await this.store.markAsSynced(localRecord.id);
    } else if (conflict.resolution === 'local') {
      // Keep local version, retry sync
      await this.syncRecord(localRecord);
    } else if (conflict.resolution === 'merge') {
      // Merge changes
      const merged = this.mergeRecords(localRecord, serverData);
      await this.store.saveClinicalData({
        sessionId: merged.sessionId,
        type: merged.type,
        data: merged.data,
        timestamp: merged.timestamp,
        synced: false,
        syncAttempts: 0,
      });
    }
  }

  /**
   * Determine conflict type
   */
  private determineConflictType(
    localRecord: ClinicalDataRecord,
    serverData: any
  ): SyncConflict['conflictType'] {
    if (!serverData) {
      return 'deletion';
    }

    if (JSON.stringify(localRecord.data) !== JSON.stringify(serverData.data)) {
      return 'data_mismatch';
    }

    return 'timestamp';
  }

  /**
   * Resolve conflict based on clinical priority
   */
  private resolveConflict(
    localRecord: ClinicalDataRecord,
    serverData: any
  ): SyncConflict['resolution'] {
    // Critical interventions always take precedence
    if (localRecord.type === 'intervention' && this.isCriticalIntervention(localRecord.data)) {
      return 'local';
    }

    // Assessments: use most recent
    if (localRecord.type === 'assessment') {
      const localTime = localRecord.timestamp;
      const serverTime = serverData?.timestamp || 0;
      return localTime > serverTime ? 'local' : 'server';
    }

    // Overrides: use most recent
    if (localRecord.type === 'override') {
      return 'local';
    }

    // Default: server wins
    return 'server';
  }

  /**
   * Check if intervention is critical
   */
  private isCriticalIntervention(data: any): boolean {
    const criticalActions = [
      'epinephrine',
      'shock',
      'intubation',
      'epi_im',
      'compressions',
    ];

    return criticalActions.some(action =>
      JSON.stringify(data).toLowerCase().includes(action)
    );
  }

  /**
   * Merge records
   */
  private mergeRecords(localRecord: ClinicalDataRecord, serverData: any): any {
    // For clinical data, merge by combining both versions
    // with local data taking precedence for critical fields
    return {
      ...serverData,
      ...localRecord,
      data: {
        ...serverData.data,
        ...localRecord.data,
      },
      timestamp: Math.max(localRecord.timestamp, serverData.timestamp),
    };
  }

  /**
   * Register sync callback
   */
  public onSync(callback: (result: SyncResult) => void): () => void {
    this.syncCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Force immediate sync
   */
  public async forceSync(): Promise<SyncResult> {
    return this.syncPendingData();
  }

  /**
   * Get sync status
   */
  public async getSyncStatus() {
    return this.store.getSyncStatus();
  }

  /**
   * Set sync interval
   */
  public setSyncInterval(interval: number): void {
    this.syncInterval = interval;
  }
}

/**
 * React hook for background sync
 */
export function useBackgroundSync() {
  const engine = new BackgroundSyncEngine();

  return {
    syncPendingData: () => engine.syncPendingData(),
    forceSync: () => engine.forceSync(),
    getSyncStatus: () => engine.getSyncStatus(),
    onSync: (callback: (result: SyncResult) => void) => engine.onSync(callback),
    setSyncInterval: (interval: number) => engine.setSyncInterval(interval),
  };
}
