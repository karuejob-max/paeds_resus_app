import React, { useEffect, useState } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone, Wifi } from 'lucide-react';

const DISMISS_KEY = 'pwa-install-dismissed-at';
const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000;

interface PWAInstallBannerProps {
  variant?: 'banner' | 'card';
  className?: string;
}

export default function PWAInstallBanner({ variant = 'banner', className = '' }: PWAInstallBannerProps) {
  const { isInstallable, isInstalled, isIOS, showInstallInstructions, setShowInstallInstructions, handleInstallClick } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (ts && Date.now() - Number(ts) < DISMISS_TTL) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  if (!isInstallable || isInstalled || dismissed) return null;

  const installLabel = isIOS ? 'How to install' : 'Install App';
  const instructions = (
    <div className="mt-3 rounded-lg border border-blue-200 bg-white/90 p-3 text-xs text-blue-950">
      <p className="font-semibold">Install Paeds Resus on this iPhone</p>
      <ol className="mt-1 list-decimal space-y-1 pl-4">
        <li>Tap Chrome’s <strong>Share</strong> button.</li>
        <li>Choose <strong>Add to Home Screen</strong>.</li>
        <li>Tap <strong>Add</strong>, then open Paeds Resus from your Home Screen.</li>
      </ol>
      <p className="mt-2 text-blue-800">Chrome on iPhone does not provide the automatic install prompt, so these steps are required.</p>
    </div>
  );

  if (variant === 'card') {
    return (
      <div className={`rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-600 p-2 shrink-0"><Smartphone className="h-5 w-5 text-white" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Install Paeds Resus on your device</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">Quick access to the platform and offline-capable clinical features.</p>
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs" onClick={handleInstallClick}>
                <Download className="h-3.5 w-3.5 mr-1.5" />{installLabel}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs text-blue-600" onClick={handleDismiss}>Not now</Button>
            </div>
            {showInstallInstructions ? instructions : null}
          </div>
          <button onClick={handleDismiss} className="shrink-0 text-blue-400 hover:text-blue-600" aria-label="Dismiss install prompt"><X className="h-4 w-4" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-3 flex items-center gap-3 shadow-lg ${className}`} role="banner">
      <Wifi className="h-4 w-4 shrink-0 opacity-80" />
      <p className="flex-1 text-sm font-medium">{isIOS ? 'Install for quick access and offline-capable features' : 'Install for offline use — works during codes without internet'}</p>
      <Button size="sm" variant="secondary" className="h-7 text-xs bg-white text-blue-700 hover:bg-blue-50 shrink-0" onClick={handleInstallClick}>
        <Download className="h-3 w-3 mr-1" />{installLabel}
      </Button>
      <button onClick={handleDismiss} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Dismiss"><X className="h-4 w-4" /></button>
      {showInstallInstructions ? (
        <div className="absolute bottom-full left-3 right-3 mb-2 rounded-lg border border-blue-200 bg-white p-3 text-xs text-blue-950 shadow-xl">
          {instructions}
          <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs" onClick={() => setShowInstallInstructions(false)}>Close</Button>
        </div>
      ) : null}
    </div>
  );
}
