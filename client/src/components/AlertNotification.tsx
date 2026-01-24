import React, { useEffect, useState } from "react";
import { X, AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";
import { trpc } from "../lib/trpc";

interface Alert {
  id: number;
  patientId: number;
  alertType: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  message: string;
  data?: string;
  isRead: boolean;
  isAcknowledged: boolean;
  createdAt: Date;
}

export const AlertNotification: React.FC<{ alert: Alert; onDismiss: (id: number) => void }> = ({
  alert,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const acknowledgeAlert = trpc.alerts.acknowledgeAlert.useMutation();

  useEffect(() => {
    // Play sound if critical
    if (alert.severity === "critical") {
      playAlertSound();
    }

    // Auto-dismiss after 10 seconds if not critical
    if (alert.severity !== "critical") {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss(alert.id);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [alert, onDismiss]);

  const playAlertSound = () => {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const handleAcknowledge = () => {
    acknowledgeAlert.mutate({ alertId: alert.id });
    setIsVisible(false);
    onDismiss(alert.id);
  };

  if (!isVisible) return null;

  const severityStyles = {
    critical: "bg-red-900 border-red-700 text-white",
    high: "bg-orange-800 border-orange-700 text-white",
    medium: "bg-yellow-700 border-yellow-600 text-white",
    low: "bg-blue-800 border-blue-700 text-white",
  };

  const severityIcons = {
    critical: <AlertTriangle className="w-6 h-6" />,
    high: <AlertCircle className="w-6 h-6" />,
    medium: <Info className="w-6 h-6" />,
    low: <CheckCircle className="w-6 h-6" />,
  };

  return (
    <div
      className={`fixed top-4 right-4 max-w-md p-4 rounded-lg border-2 shadow-lg ${severityStyles[alert.severity]} animate-pulse`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{severityIcons[alert.severity]}</div>
        <div className="flex-1">
          <h3 className="font-bold text-lg">{alert.title}</h3>
          <p className="text-sm mt-1 opacity-90">{alert.message}</p>
          <div className="flex gap-2 mt-3">
            {alert.severity === "critical" && (
              <button
                onClick={handleAcknowledge}
                className="bg-white text-red-900 px-3 py-1 rounded text-sm font-semibold hover:bg-gray-100"
              >
                Acknowledge
              </button>
            )}
            <button
              onClick={() => {
                setIsVisible(false);
                onDismiss(alert.id);
              }}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss(alert.id);
          }}
          className="flex-shrink-0 hover:opacity-75"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export const AlertCenter: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());

  const getAlerts = trpc.alerts.getAlerts.useQuery({
    limit: 10,
    unreadOnly: true,
  });

  useEffect(() => {
    if (getAlerts.data) {
      setAlerts(getAlerts.data);
    }
  }, [getAlerts.data]);

  const handleDismiss = (alertId: number) => {
    setDismissedAlerts((prev) => new Set(prev).add(alertId));
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id));

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {visibleAlerts.map((alert) => (
        <AlertNotification key={alert.id} alert={alert} onDismiss={handleDismiss} />
      ))}
    </div>
  );
};
