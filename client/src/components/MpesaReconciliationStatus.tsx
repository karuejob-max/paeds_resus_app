/**
 * M-Pesa Reconciliation Status Component - Retention-Focused
 * Displays payment status with reassurance, countdown, and offline detection
 * Handles: pending → completed/failed transitions
 * 
 * Retention Improvements:
 * - Clear messaging: "Waiting for M-Pesa prompt on 07XXXXXXXX..."
 * - Countdown timer (2:00 remaining)
 * - "Still waiting?" message at 30 seconds with manual check option
 * - Phone icon animation to draw attention
 * - Offline detection with clear messaging
 * - "Do NOT close this window" warning
 * - Prevents user abandonment during payment
 */

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Loader2, XCircle, Smartphone, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface MpesaReconciliationStatusProps {
  enrollmentId: number;
  checkoutRequestId: string;
  phoneNumber: string;
  amount: number; // in KES
  onPaymentComplete: (success: boolean) => void;
}

type PaymentStatus = "pending" | "completed" | "failed" | "cancelled" | "offline";

export function MpesaReconciliationStatus({
  enrollmentId,
  checkoutRequestId,
  phoneNumber,
  amount,
  onPaymentComplete,
}: MpesaReconciliationStatusProps) {
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const [pollCount, setPollCount] = useState(0);
  const [lastPollTime, setLastPollTime] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [secondsRemaining, setSecondsRemaining] = useState(120); // 2 minutes
  const [showStillWaiting, setShowStillWaiting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // tRPC mutations
  const checkPaymentStatusMutation = trpc.mpesa.checkPaymentStatus.useMutation();
  const reconcilePaymentMutation = trpc.mpesa.reconcilePayment.useMutation();

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setStatus("offline");
      setErrorMessage("No internet connection. Please check your connection and try again.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (status !== "pending" || !isOnline) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setErrorMessage("Payment verification timed out. Please check your M-Pesa history or contact support.");
          setStatus("failed");
          onPaymentComplete(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, isOnline, onPaymentComplete]);

  // Show "Still waiting?" message at 30 seconds
  useEffect(() => {
    if (status === "pending" && secondsRemaining === 30 && !showStillWaiting) {
      setShowStillWaiting(true);
    }
  }, [secondsRemaining, status, showStillWaiting]);

  // Format countdown display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Poll for payment status
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let pollTimeout: NodeJS.Timeout | null = null;

    const startPolling = async () => {
      // Poll for up to 2 minutes (24 polls × 5 seconds)
      const maxPolls = 24;

      const poll = async () => {
        if (pollCount >= maxPolls || !isOnline) {
          return;
        }

        try {
          const result = await checkPaymentStatusMutation.mutateAsync({
            checkoutRequestId,
            enrollmentId,
          });

          setLastPollTime(new Date());
          setPollCount((prev) => prev + 1);

          if (result.status === "completed") {
            setStatus("completed");
            setTransactionId(result.transactionId || "");
            onPaymentComplete(true);
            if (pollInterval) clearInterval(pollInterval);
          } else if (result.status === "failed") {
            setStatus("failed");
            setErrorMessage(result.errorMessage || "Payment failed. Please try again.");
            onPaymentComplete(false);
            if (pollInterval) clearInterval(pollInterval);
          } else if (result.status === "cancelled") {
            setStatus("cancelled");
            setErrorMessage("Payment was cancelled.");
            onPaymentComplete(false);
            if (pollInterval) clearInterval(pollInterval);
          }
          // If still pending, continue polling
        } catch (error) {
          console.error("[M-Pesa Reconciliation] Poll error:", error);
          // Don't show error on every poll, just keep trying
        }
      };

      // Initial poll after 2.5 seconds (allow STK to be displayed)
      pollTimeout = setTimeout(() => {
        poll();
        // Then poll every 5 seconds
        pollInterval = setInterval(poll, 5000);
      }, 2500);
    };

    if (status === "pending" && isOnline) {
      startPolling();
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [status, pollCount, checkoutRequestId, enrollmentId, onPaymentComplete, checkPaymentStatusMutation, isOnline]);

  // Manual reconciliation (admin/user can trigger)
  const handleManualReconciliation = async () => {
    if (!isOnline) {
      setErrorMessage("No internet connection. Please check your connection and try again.");
      return;
    }

    try {
      const result = await reconcilePaymentMutation.mutateAsync({
        checkoutRequestId,
        enrollmentId,
      });

      if (result.status === "completed") {
        setStatus("completed");
        setTransactionId(result.transactionId || "");
        onPaymentComplete(true);
      } else if (result.status === "failed") {
        setStatus("failed");
        setErrorMessage(result.errorMessage || "Payment reconciliation failed.");
        onPaymentComplete(false);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to reconcile payment"
      );
    }
  };

  // Status display with retention-focused messaging
  const getStatusDisplay = () => {
    switch (status) {
      case "pending":
        return {
          icon: <Smartphone className="w-8 h-8 text-blue-600 animate-bounce" />,
          title: "Waiting for M-Pesa",
          description: `Check your phone for the M-Pesa prompt on ${phoneNumber}`,
          color: "bg-blue-50 border-blue-200",
          subtitle: `Time remaining: ${formatTime(secondsRemaining)}`,
        };
      case "offline":
        return {
          icon: <WifiOff className="w-8 h-8 text-gray-600" />,
          title: "No Internet Connection",
          description: "Please check your connection and try again",
          color: "bg-gray-50 border-gray-200",
        };
      case "completed":
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-green-600" />,
          title: "Payment Successful!",
          description: `Transaction ID: ${transactionId}`,
          color: "bg-green-50 border-green-200",
        };
      case "failed":
        return {
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          title: "Payment Failed",
          description: errorMessage,
          color: "bg-red-50 border-red-200",
        };
      case "cancelled":
        return {
          icon: <AlertCircle className="w-8 h-8 text-yellow-600" />,
          title: "Payment Cancelled",
          description: "You cancelled the payment. Please try again.",
          color: "bg-yellow-50 border-yellow-200",
        };
    }
  };

  const display = getStatusDisplay();

  return (
    <Card className={`border-2 ${display.color}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {display.icon}
          <span>{display.title}</span>
        </CardTitle>
        {display.subtitle && (
          <p className="text-sm text-gray-600 mt-2">{display.subtitle}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Description */}
        <p className="text-sm text-gray-600">{display.description}</p>

        {/* Payment Details */}
        <div className="bg-white p-3 rounded-md space-y-2 text-sm border border-gray-200">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount to Pay:</span>
            <span className="font-medium text-lg">KES {(amount / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Phone Number:</span>
            <span className="font-medium">{phoneNumber}</span>
          </div>
          {status === "pending" && (
            <div className="flex justify-between">
              <span className="text-gray-600">Status Checks:</span>
              <span className="font-medium">{pollCount}/24</span>
            </div>
          )}
        </div>

        {/* Status-Specific Actions */}
        {status === "pending" && (
          <div className="space-y-3">
            {/* Warning: Don't close */}
            <div className="bg-amber-100 border border-amber-300 rounded-md p-3">
              <p className="text-sm text-amber-900 font-semibold">
                ⚠️ Do NOT close this window or go back
              </p>
              <p className="text-xs text-amber-800 mt-1">
                Closing may cause payment issues. We're checking your payment status.
              </p>
            </div>

            {/* Auto-checking message */}
            <div className="bg-blue-100 border border-blue-300 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <Clock className="w-4 h-4 inline mr-2" />
                Checking payment status automatically every 5 seconds...
              </p>
            </div>

            {/* Still waiting? message at 30 seconds */}
            {showStillWaiting && (
              <div className="bg-orange-100 border border-orange-300 rounded-md p-3">
                <p className="text-sm text-orange-900 font-semibold">
                  Still waiting for M-Pesa?
                </p>
                <p className="text-xs text-orange-800 mt-1">
                  If you don't see the prompt, check your phone or click "Check Now" to verify payment status.
                </p>
              </div>
            )}

            {/* Manual check button */}
            <Button
              onClick={handleManualReconciliation}
              variant="outline"
              className="w-full"
              disabled={checkPaymentStatusMutation.isPending}
            >
              {checkPaymentStatusMutation.isPending ? "Checking..." : "Check Now"}
            </Button>
          </div>
        )}

        {status === "offline" && (
          <div className="space-y-3">
            <div className="bg-gray-100 border border-gray-300 rounded-md p-3">
              <p className="text-sm text-gray-800">
                <WifiOff className="w-4 h-4 inline mr-2" />
                Your internet connection was lost. Please restore your connection and try again.
              </p>
            </div>
            <Button
              onClick={handleManualReconciliation}
              variant="outline"
              className="w-full"
              disabled={!isOnline}
            >
              {isOnline ? "Retry" : "Waiting for connection..."}
            </Button>
          </div>
        )}

        {status === "failed" && (
          <div className="space-y-3">
            <div className="bg-red-100 border border-red-300 rounded-md p-3">
              <p className="text-sm text-red-800 font-semibold">Payment Failed</p>
              <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
            </div>
            <Button
              onClick={handleManualReconciliation}
              variant="outline"
              className="w-full"
              disabled={reconcilePaymentMutation.isPending}
            >
              {reconcilePaymentMutation.isPending ? "Retrying..." : "Retry Payment"}
            </Button>
            <p className="text-xs text-gray-600 text-center">
              If the problem persists, contact support: +254706781260
            </p>
          </div>
        )}

        {status === "cancelled" && (
          <div className="space-y-3">
            <div className="bg-yellow-100 border border-yellow-300 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                You cancelled the payment. You can try again anytime.
              </p>
            </div>
          </div>
        )}

        {status === "completed" && (
          <div className="space-y-3">
            <div className="bg-green-100 border border-green-300 rounded-md p-3">
              <p className="text-sm text-green-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 inline mr-2" />
                Payment confirmed!
              </p>
              <p className="text-sm text-green-700 mt-1">
                You can now access the course. Your enrollment is active for 1 month.
              </p>
            </div>
          </div>
        )}

        {/* Help Text - Retention focused */}
        <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-md">
          <p className="font-semibold text-gray-700">Need help?</p>
          <p>• Check your phone for the M-Pesa prompt</p>
          <p>• If payment was successful but status shows pending, click "Check Now"</p>
          <p>• If you see an error, click "Retry Payment"</p>
          <p>• Contact support: +254706781260 (available 24/7)</p>
        </div>
      </CardContent>
    </Card>
  );
}
