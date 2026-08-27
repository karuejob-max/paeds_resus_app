import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertTriangle, Download, RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearOfflineActorData, clearPlatformOfflineData, getOfflineMeta, getOfflineSyncCounts, listOfflineReviewCommands, pruneOfflineData, removeOfflineCommand, saveOfflineMeta, updateOfflineCommand, type OfflineCommand, type OfflineSyncCounts } from "@/lib/offline/platformOfflineStore";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function offlineDomainLabel(command: OfflineCommand) {
  const labels: Record<OfflineCommand["aggregateType"], string> = {
    course_progress: "Course progress",
    formative_practice: "Formative practice",
    cpd_attendance_intent: "CPD attendance intent",
    utl_response_intent: "UTL response intent",
    crash_cart_check: "Crash-cart check",
    role_report_draft: "Role report draft",
    targeted_report: "Targeted ERT report",
    debrief_draft: "Debrief draft",
  };
  return labels[command.aggregateType] ?? command.aggregateType;
}

const EMPTY_COUNTS: OfflineSyncCounts = {
  queued: 0,
  sending: 0,
  failed: 0,
  conflict: 0,
  rejected: 0,
  requiresReview: 0,
};

export default function PlatformOfflineStatus() {
  const { user, loading: authLoading } = useAuth();
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [counts, setCounts] = useState<OfflineSyncCounts>(EMPTY_COUNTS);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [reviewCommands, setReviewCommands] = useState<OfflineCommand[]>([]);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    const actorId = user?.id ?? null;
    void getOfflineMeta<number>("platform.activeActorId").then((previousActorId) => {
      if (previousActorId && previousActorId !== actorId) {
        void clearOfflineActorData(previousActorId);
      }
      void saveOfflineMeta("platform.activeActorId", actorId);
    });
  }, [authLoading, user?.id]);

  useEffect(() => {
    const refresh = () => {
      setIsOnline(navigator.onLine);
      void pruneOfflineData().then(() => Promise.all([getOfflineSyncCounts(), listOfflineReviewCommands(20)])).then(([nextCounts, nextReviewCommands]) => {
        setCounts(nextCounts);
        setReviewCommands(nextReviewCommands);
      });
    };
    const onOnline = () => refresh();
    const onOffline = () => refresh();
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onAppInstalled = () => setInstallPrompt(null);
    const onStorageError = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setStorageError(detail?.message ?? "Offline storage is unavailable on this device.");
    };

    refresh();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    window.addEventListener("platform-offline-storage-error", onStorageError);
    const interval = window.setInterval(() => {
      void pruneOfflineData().then(() => Promise.all([getOfflineSyncCounts(), listOfflineReviewCommands(20)])).then(([nextCounts, nextReviewCommands]) => {
        setCounts(nextCounts);
        setReviewCommands(nextReviewCommands);
      });
    }, 10_000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener("platform-offline-storage-error", onStorageError);
      window.clearInterval(interval);
    };
  }, []);

  const pendingCount = counts.queued + counts.sending + counts.failed;
  const reviewCount = counts.conflict + counts.rejected + counts.requiresReview;
  const shouldShow = !isOnline || pendingCount > 0 || reviewCount > 0 || Boolean(installPrompt) || Boolean(storageError);
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

  const handleRetryFailed = async (command: OfflineCommand) => {
    if (command.status !== "failed") return;
    await updateOfflineCommand(command.localEventId, { status: "queued", lastError: undefined });
    const [nextCounts, nextReviewCommands] = await Promise.all([getOfflineSyncCounts(), listOfflineReviewCommands(20)]);
    setCounts(nextCounts);
    setReviewCommands(nextReviewCommands);
  };

  const handleDiscard = async (command: OfflineCommand) => {
    if (!window.confirm(`Discard this local ${offlineDomainLabel(command).toLowerCase()}? This removes the device copy and cannot be undone.`)) return;
    await removeOfflineCommand(command.localEventId);
    setReviewCommands((current) => current.filter((item) => item.localEventId !== command.localEventId));
    const nextCounts = await getOfflineSyncCounts();
    setCounts(nextCounts);
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
          {storageError && <span className="font-semibold text-rose-700">Offline storage problem: {storageError}</span>}
          {isOnline && pendingCount > 0 && <span className="text-slate-600">{pendingCount} local record{pendingCount === 1 ? "" : "s"} awaiting server confirmation.</span>}
          {reviewCount > 0 && <span className="inline-flex items-center gap-1 font-semibold text-rose-700"><AlertTriangle className="h-3.5 w-3.5" />{reviewCount} local record{reviewCount === 1 ? "" : "s"} require review.</span>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {pendingCount > 0 && isOnline && <span className="inline-flex items-center gap-1 text-slate-500"><RefreshCw className="h-3.5 w-3.5" />Syncing when safe</span>}
          {reviewCount > 0 && <Button type="button" size="sm" variant="outline" onClick={() => setIsReviewOpen((open) => !open)} className="h-8 bg-white"><AlertTriangle className="mr-1.5 h-3.5 w-3.5" />{isReviewOpen ? "Hide review" : "Review records"}</Button>}
          {installPrompt && <Button type="button" size="sm" variant="outline" onClick={handleInstall} disabled={isInstalling} className="h-8 bg-white"><Download className="mr-1.5 h-3.5 w-3.5" />{isInstalling ? "Installing…" : "Install app"}</Button>}
          {(pendingCount > 0 || reviewCount > 0 || !isOnline) && <Button type="button" size="sm" variant="ghost" onClick={() => void handleClearOfflineData()} disabled={isClearing} className="h-8 text-slate-500"><Trash2 className="mr-1.5 h-3.5 w-3.5" />{isClearing ? "Clearing…" : "Clear offline data"}</Button>}
        </div>
      </div>
      {isReviewOpen && reviewCommands.length > 0 && (
        <div className="mx-auto mt-2 max-w-7xl rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-950" role="region" aria-label="Offline records requiring review">
          <p className="font-semibold">These records are not server-confirmed.</p>
          <p className="mt-1 text-rose-900/80">Review the domain, time, and server message. Conflicts and rejections need an authorised human decision; only transport failures can be retried here.</p>
          <div className="mt-2 space-y-2">
            {reviewCommands.map((command) => (
              <div key={command.localEventId} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-rose-200 bg-white p-2">
                <div className="min-w-0">
                  <p className="font-medium">{offlineDomainLabel(command)} · {command.actionType}</p>
                  <p className="truncate text-rose-900/70">Updated {new Date(command.updatedAt).toLocaleString()} · {command.status.replace("_", " ")}</p>
                  {command.lastError && <p className="mt-0.5 text-rose-900/80">{command.lastError}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  {command.status === "failed" && <Button type="button" size="sm" variant="outline" onClick={() => void handleRetryFailed(command)} className="h-8 bg-white">Retry</Button>}
                  <Button type="button" size="sm" variant="ghost" onClick={() => void handleDiscard(command)} className="h-8 text-rose-700">Discard</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
