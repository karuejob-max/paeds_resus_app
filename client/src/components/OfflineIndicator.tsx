/**
 * Offline Mode Indicator
 * 
 * Shows connection status and cached protocols count.
 * Provides visual feedback for offline capability.
 */

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OfflineIndicatorProps {
  onInstallClick?: () => void;
  showInstallButton?: boolean;
}

export function OfflineIndicator({ onInstallClick, showInstallButton = false }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedProtocolsCount, setCachedProtocolsCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

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
      </div>

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
