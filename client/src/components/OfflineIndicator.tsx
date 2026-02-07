/**
 * Offline Mode Indicator
 * 
 * Shows connection status and cached protocols count.
 * Provides visual feedback for offline capability.
 */

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSyncQueueStatus, syncPendingMutations } from '@/lib/syncQueue';

interface OfflineIndicatorProps {
  onInstallClick?: () => void;
  showInstallButton?: boolean;
}

export function OfflineIndicator({ onInstallClick, showInstallButton = false }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedProtocolsCount, setCachedProtocolsCount] = useState(0);
  const [pendingMutations, setPendingMutations] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[Offline Indicator] Back online - syncing data');
      syncData();
    };
    const handleOffline = () => {
      setIsOnline(false);
      console.log('[Offline Indicator] Offline mode - changes will sync when connection returns');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check cached protocols count
    if ('caches' in window) {
      caches.open('clinical-data-v1').then((cache) => {
        cache.keys().then((keys) => {
          setCachedProtocolsCount(keys.length);
        });
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check sync queue status
  useEffect(() => {
    const checkSyncQueue = async () => {
      const status = await getSyncQueueStatus();
      setPendingMutations(status.pending);
    };

    checkSyncQueue();
    const interval = setInterval(checkSyncQueue, 10000);

    return () => clearInterval(interval);
  }, []);

  // Sync data manually
  const syncData = async () => {
    setIsSyncing(true);
    try {
      const result = await syncPendingMutations();
      if (result.synced > 0) {
        console.log(`[Offline Indicator] Sync complete: ${result.synced} changes synced`);
      }
      if (result.failed > 0) {
        console.warn(`[Offline Indicator] Sync incomplete: ${result.failed} changes failed`);
      }
      const status = await getSyncQueueStatus();
      setPendingMutations(status.pending);
    } catch (error) {
      console.error('[Offline Indicator] Sync failed:', error);
      console.error('[Offline Indicator] Sync failed - check connection');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      {/* Connection Status Badge */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
          isOnline
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span className="hidden sm:inline">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="hidden sm:inline">Offline Mode</span>
          </>
        )}
        {!isOnline && cachedProtocolsCount > 0 && (
          <span className="text-xs opacity-75">
            ({cachedProtocolsCount} protocols cached)
          </span>
        )}
        {pendingMutations > 0 && (
          <span className="text-xs opacity-75">
            • {pendingMutations} pending
          </span>
        )}
      </div>

      {/* Sync Button */}
      {isOnline && pendingMutations > 0 && (
        <Button
          onClick={syncData}
          disabled={isSyncing}
          size="sm"
          className="bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          <span className="sm:hidden">Sync</span>
        </Button>
      )}

      {/* PWA Install Button */}
      {showInstallButton && onInstallClick && (
        <Button
          onClick={onInstallClick}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </Button>
      )}
    </div>
  );
}
