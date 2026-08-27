import { useEffect, useState } from "react";
import { AlertTriangle, Download, RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearPlatformOfflineData, getOfflineSyncCounts, type OfflineSyncCounts } from "@/lib/offline/platformOfflineStore";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const EMPTY_COUNTS: OfflineSyncCounts = {
  queued: 0,
  sending: 0,
  failed: 0,
  conflict: 0,
  requiresReview: 0,
};

export default function PlatformOfflineStatus() {
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [counts, setCounts] = useState<OfflineSyncCounts>(EMPTY_COUNTS);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setIsOnline(navigator.onLine);
      void getOfflineSyncCounts().then(setCounts);
    };
    const onOnline = () => refresh();
    const onOffline = () => refresh();
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => setInstallPrompt(null);

    refresh();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    const interval = window.setInterval(() => void getOfflineSyncCounts().then(setCounts), 10_000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      window.clearInterval(interval);
    };
  }, []);

  const pendingCount = counts.queued + counts.sending + counts.failed;
  const reviewCount = counts.conflict + counts.requiresReview;
  const shouldShow = !isOnline || pendingCount > 0 || reviewCount > 0 || Boolean(installPrompt);
  if (!shouldShow) return null;

  const handleClearOfflineData = async () => {
    if (!window.confirm("Clear cached coursework, shift snapshots, and offline drafts from this device? This cannot be undone. ResusGPS and CPR session recovery data are stored separately.")) return;
    setIsClearing(true);
    try {
      await clearPlatformOfflineData();
      setCounts(EMPTY_COUNTS);
    } finally {
      setIsClearing(false);
    }
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    setIsInstalling(true);
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } finally {
      setInstallPrompt(null);
      setIsInstalling(false);
    }
  };

  return (
    <div className="border-b border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur" role="status" aria-live="polite">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex min-w-0 items-center gap-2">
          {isOnline ? <Wifi className="h-4 w-4 shrink-0 text-emerald-700" /> : <WifiOff className="h-4 w-4 shrink-0 text-amber-700" />}
          <span className="font-semibold text-slate-900">{isOnline ? "Online" : "Offline mode"}</span>
          {!isOnline && <span className="text-slate-600">Saved local work is not server-confirmed until synchronization completes.</span>}
          {isOnline && pendingCount > 0 && <span className="text-slate-600">{pendingCount} local record{pendingCount === 1 ? "" : "s"} awaiting server confirmation.</span>}
          {reviewCount > 0 && <span className="inline-flex items-center gap-1 font-semibold text-rose-700"><AlertTriangle className="h-3.5 w-3.5" />{reviewCount} conflict{reviewCount === 1 ? "" : "s"} require review.</span>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {pendingCount > 0 && isOnline && <span className="inline-flex items-center gap-1 text-slate-500"><RefreshCw className="h-3.5 w-3.5" />Syncing when safe</span>}
          {installPrompt && <Button type="button" size="sm" variant="outline" onClick={handleInstall} disabled={isInstalling} className="h-8 bg-white"><Download className="mr-1.5 h-3.5 w-3.5" />{isInstalling ? "Installing…" : "Install app"}</Button>}
          {(pendingCount > 0 || reviewCount > 0 || !isOnline) && <Button type="button" size="sm" variant="ghost" onClick={() => void handleClearOfflineData()} disabled={isClearing} className="h-8 text-slate-500"><Trash2 className="mr-1.5 h-3.5 w-3.5" />{isClearing ? "Clearing…" : "Clear offline data"}</Button>}
        </div>
      </div>
    </div>
  );
}
