/**
 * PWAInstallBanner
 *
 * Phase 6.1 — Mobile PWA install prompt.
 *
 * Shows a contextual "Add to Home Screen" banner:
 *   - Only when the app is installable (beforeinstallprompt fired)
 *   - Not in standalone mode (already installed)
 *   - Not dismissed in the last 7 days
 *   - Compact on mobile, full card on desktop
 *
 * Used in: ResusGPS (idle screen), ProviderDashboard, Header
 */

import React, { useEffect, useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone, Wifi } from 'lucide-react';

const DISMISS_KEY = 'pwa-install-dismissed-at';
const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

interface PWAInstallBannerProps {
  /** 'banner' = slim bottom bar (default), 'card' = full card widget */
  variant?: 'banner' | 'card';
  className?: string;
}

export default function PWAInstallBanner({ variant = 'banner', className = '' }: PWAInstallBannerProps) {
  const { isInstallable, isInstalled, handleInstallClick } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (ts && Date.now() - Number(ts) < DISMISS_TTL) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  if (!isInstallable || isInstalled || dismissed) return null;

  if (variant === 'card') {
    return (
      <div className={`rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-600 p-2 shrink-0">
            <Smartphone className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Install Paeds Resus on your device
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
              Works offline during resuscitations. No app store needed.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                onClick={handleInstallClick}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Add to Home Screen
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-blue-600"
                onClick={handleDismiss}
              >
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 text-blue-400 hover:text-blue-600 transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Banner variant — slim fixed bar at bottom
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-3 flex items-center gap-3 shadow-lg ${className}`}
      role="banner"
    >
      <Wifi className="h-4 w-4 shrink-0 opacity-80" />
      <p className="flex-1 text-sm font-medium">
        Install for offline use — works during codes without internet
      </p>
      <Button
        size="sm"
        variant="secondary"
        className="h-7 text-xs bg-white text-blue-700 hover:bg-blue-50 shrink-0"
        onClick={handleInstallClick}
      >
        <Download className="h-3 w-3 mr-1" />
        Install
      </Button>
      <button
        onClick={handleDismiss}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
