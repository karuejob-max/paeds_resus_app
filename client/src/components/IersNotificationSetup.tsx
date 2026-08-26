import { useState } from "react";
import { Bell, BellRing, CheckCircle2, Volume2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { trpc } from "@/lib/trpc";
import {
  browserNotificationPermission,
  enableIersAudio,
  isIersAudioEnabled,
  requestIersBrowserPermission,
  subscribeIersPush,
} from "@/lib/iers-notification-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function IersNotificationSetup({
  enabled: enabledProp = true,
}: {
  enabled?: boolean;
}) {
  const { user, isAuthenticated } = useAuth();
  const { role } = useUserRole();
  const enabled = Boolean(
    enabledProp && user && isAuthenticated && role === "provider"
  );
  const statusQuery = trpc.iersNotifications.getStatus.useQuery(undefined, {
    enabled,
    staleTime: 60_000,
    retry: 1,
  });
  const subscribeMutation = trpc.iersNotifications.subscribe.useMutation({
    onSuccess: () => void statusQuery.refetch(),
  });
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >(() => browserNotificationPermission());
  const [audioEnabled, setAudioEnabled] = useState(() => isIersAudioEnabled());
  const [message, setMessage] = useState<string | null>(null);
  const [isEnabling, setIsEnabling] = useState(false);

  if (!enabled || statusQuery.isLoading) return null;

  const pushActive = Boolean(statusQuery.data?.active);
  const pushConfigured = Boolean(
    statusQuery.data?.configured && statusQuery.data?.publicKey
  );
  const migrationReady = statusQuery.data?.migrationReady !== false;
  const ready = audioEnabled && (pushActive || !pushConfigured);

  async function enableUrgentAlerts() {
    setIsEnabling(true);
    setMessage(null);
    try {
      const audioReady = await enableIersAudio();
      setAudioEnabled(audioReady);
      const nextPermission = await requestIersBrowserPermission();
      setPermission(nextPermission);
      let backgroundPushReady = pushActive;
      let backgroundPushMessage: string | null = null;

      if (
        nextPermission === "granted" &&
        pushConfigured &&
        statusQuery.data?.publicKey
      ) {
        const subscription = await subscribeIersPush(
          statusQuery.data.publicKey
        );
        if (!subscription) {
          backgroundPushMessage =
            "Sound is enabled, but this browser could not create a push subscription. Keep the app open for the in-app alert.";
        } else {
          const result = await subscribeMutation.mutateAsync(subscription);
          if (!result.success) {
            backgroundPushMessage =
              "Sound is enabled, but background push is not ready on this server yet. The in-app alert remains active.";
          } else {
            backgroundPushReady = true;
          }
        }
      }

      if (!audioReady && nextPermission !== "granted") {
        setMessage(
          "This browser did not grant sound or notification permission. The visual in-app alert remains active."
        );
      } else if (backgroundPushMessage) {
        setMessage(backgroundPushMessage);
      } else if (!pushConfigured) {
        setMessage(
          "Foreground sound is enabled. Background push will become available after the server is configured."
        );
      } else if (nextPermission !== "granted") {
        setMessage(
          "Foreground sound is enabled. Browser notifications were not granted, so keep the app open for the in-app alert."
        );
      } else if (backgroundPushReady) {
        setMessage(
          "Urgent alerts are enabled on this device. Device sound and connectivity settings can still affect delivery."
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not enable urgent alerts on this device."
      );
    } finally {
      setIsEnabling(false);
    }
  }

  return (
    <Alert
      className={
        ready
          ? "border-emerald-200 bg-emerald-50 text-emerald-950"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }
    >
      {ready ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      <AlertTitle className="flex items-center gap-2">
        {ready
          ? "Urgent alerts ready on this device"
          : "Enable urgent ERT alerts"}
        {audioEnabled && (
          <Volume2 className="h-4 w-4" aria-label="Foreground sound enabled" />
        )}
        {pushActive && (
          <BellRing className="h-4 w-4" aria-label="Background push enabled" />
        )}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          {ready
            ? "The app will use a visual alert and foreground sound when an activation reaches this account. Background browser push is best-effort, not a hospital alarm."
            : "Enable sound and browser notifications before taking a dated ERT duty. This does not replace the in-app alert or local escalation policy."}
        </p>
        {!migrationReady && (
          <p className="text-xs font-medium">
            Server notification storage is awaiting migration; foreground alerts
            remain available.
          </p>
        )}
        {permission === "denied" && (
          <p className="text-xs font-medium">
            Browser notifications are blocked. Allow them in browser site
            settings, then try again.
          </p>
        )}
        {message && (
          <p className="text-xs font-medium" role="status">
            {message}
          </p>
        )}
        {!ready && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isEnabling || subscribeMutation.isPending}
            onClick={() => void enableUrgentAlerts()}
          >
            {isEnabling ? "Enabling…" : "Enable on this device"}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
