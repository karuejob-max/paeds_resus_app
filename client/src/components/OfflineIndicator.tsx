/**
 * Offline Mode Indicator
 * 
 * Shows connection status and cached protocols count.
 * Provides visual feedback for offline capability.
 */

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getOfflineSyncCounts, listOfflineSnapshots } from '@/lib/offline/platformOfflineStore';

interface OfflineIndicatorProps {
  onInstallClick?: () => void;
  showInstallButton?: boolean;
}

export function OfflineIndicator({ onInstallClick, showInstallButton = false }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedProtocolsCount, setCachedProtocolsCount] = useState(0);
  const [pendingMutations, setPendingMutations] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[Offline Indicator] Back online - refreshing platform sync state');
      void refreshStatus();
    };
    const handleOffline = () => {
      setIsOnline(false);
      console.log('[Offline Indicator] Offline mode - changes will sync when connection returns');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    void listOfflineSnapshots('course_module').then((snapshots) => {
      setCachedProtocolsCount(snapshots.length);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshStatus = async () => {
    setIsRefreshing(true);
    try {
      const [counts, snapshots] = await Promise.all([
        getOfflineSyncCounts(),
        listOfflineSnapshots('course_module'),
      ]);
      setPendingMutations(counts.queued + counts.sending + counts.failed + counts.conflict + counts.rejected + counts.requiresReview);
      setCachedProtocolsCount(snapshots.length);
    } catch (error) {
      console.error('[Offline Indicator] Could not refresh platform offline state:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // The typed domain adapters own replay. This legacy surface only refreshes
  // status and must not trigger the old generic mutation endpoint.
  useEffect(() => {
    void refreshStatus();
    const interval = setInterval(() => void refreshStatus(), 10000);
    return () => clearInterval(interval);
  }, []);

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
          onClick={() => void refreshStatus()}
          disabled={isRefreshing}
          size="sm"
          className="bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Review status'}</span>
          <span className="sm:hidden">Review</span>
        </Button>
      )}

      {/* PWA Install Button */}
      {showInstallButton && onInstallClick && (
        <Button
          onClick={onInstallClick}
          size="sm"
          variant="cta"
          className="text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </Button>
      )}
    </div>
  );
}
