/**
 * M-Pesa Reconciliation Status Component
 * Displays payment status, polling updates, and callback handling
 * Handles: pending → completed/failed transitions
 *
 * Key behaviour:
 * - Polls every 5 seconds for up to 2 minutes (maxPolls = 24)
 * - Stops polling after 3 consecutive transport errors (Safaricom 500s on expired IDs)
 * - Stops polling if the CheckoutRequestID is older than 2 minutes (Safaricom won't query it)
 * - Shows "I Have Paid" button immediately so user can manually trigger reconciliation
 */

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Loader2, Phone, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface MpesaReconciliationStatusProps {
  enrollmentId: number;
  checkoutRequestId: string;
  phoneNumber: string;
  amount: number; // in cents
  onPaymentComplete: (success: boolean) => void;
  onRetryPayment: () => void;
}

type PaymentStatus = "pending" | "completed" | "failed" | "cancelled";

/** Safaricom only keeps a CheckoutRequestID queryable for ~2 minutes after initiation. */
const STK_QUERY_TTL_MS = 2 * 60 * 1000; // 2 minutes

export function MpesaReconciliationStatus({
  enrollmentId,
  checkoutRequestId,
  phoneNumber,
  amount,
  onPaymentComplete,
  onRetryPayment,
}: MpesaReconciliationStatusProps) {
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const [pollCount, setPollCount] = useState(0);
  const [lastPollTime, setLastPollTime] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const consecutiveErrorsRef = useRef(0);
  // Record when this component mounted — used to detect expired CheckoutRequestIDs
  const initiatedAtRef = useRef<number>(Date.now());

  // tRPC mutations
  const checkPaymentStatusMutation = trpc.mpesa.checkPaymentStatus.useMutation();
  const reconcilePaymentMutation = trpc.mpesa.reconcilePayment.useMutation();

  // Poll for payment status
  useEffect(() => {
    if (status !== "pending") return;

    let pollInterval: NodeJS.Timeout | null = null;
    let pollTimeout: NodeJS.Timeout | null = null;
    let attempts = 0;
    const maxPolls = 24; // 2 minutes (24 polls x 5 seconds)

    const stopPolling = (msg: string, newStatus: PaymentStatus = "failed") => {
      setErrorMessage(msg);
      setStatus(newStatus);
      if (pollInterval) clearInterval(pollInterval);
    };

    const poll = async () => {
      // Guard: stop if CheckoutRequestID is older than 2 minutes
      const ageMs = Date.now() - initiatedAtRef.current;
      if (ageMs > STK_QUERY_TTL_MS) {
        stopPolling(
          "M-Pesa prompt has expired. If you entered your PIN, tap \"I Have Paid\" to confirm. Otherwise, retry payment."
        );
        return;
      }

      if (attempts >= maxPolls) {
        stopPolling(
          "Still waiting for M-Pesa confirmation. If you have paid, tap \"I Have Paid\". If not, retry payment."
        );
        return;
      }

      attempts += 1;
      setPollCount(attempts);

      try {
        const result = await checkPaymentStatusMutation.mutateAsync({
          checkoutRequestId,
          enrollmentId,
        });

        setLastPollTime(new Date());
        consecutiveErrorsRef.current = 0; // reset on any successful HTTP response

        if (result.status === "completed") {
          setStatus("completed");
          setTransactionId(result.transactionId || "");
          onPaymentComplete(true);
          if (pollInterval) clearInterval(pollInterval);
        } else if (result.status === "failed") {
          stopPolling(result.errorMessage || "Payment failed. Please try again.");
        } else if (result.status === "cancelled") {
          stopPolling("Payment was cancelled. You can try again.", "cancelled");
        } else if (
          result.errorMessage?.includes("QUERY_TRANSPORT_ERROR") ||
          result.errorMessage?.includes("500")
        ) {
          // Safaricom returned a server error — likely expired ID or wrong env
          consecutiveErrorsRef.current += 1;
          if (consecutiveErrorsRef.current >= 3) {
            stopPolling(
              "M-Pesa is taking longer than usual. If you've already entered your PIN, tap \"I Have Paid\" below."
            );
          }
        }
      } catch (error) {
        console.error("[M-Pesa Reconciliation] Poll error:", error);
        consecutiveErrorsRef.current += 1;
        if (consecutiveErrorsRef.current >= 3) {
          stopPolling(
            "M-Pesa is taking longer than usual. If you've already entered your PIN, tap \"I Have Paid\" below."
          );
        }
      }
    };

    // First poll after 2.5s, then every 5s
    pollTimeout = setTimeout(() => {
      poll();
      pollInterval = setInterval(poll, 5000);
    }, 2500);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [status, checkoutRequestId, enrollmentId, onPaymentComplete, checkPaymentStatusMutation]);

  // Manual reconciliation — user confirms they paid
  const handleManualReconciliation = async () => {
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
      } else if (result.status === "cancelled") {
        setStatus("cancelled");
        setErrorMessage(result.errorMessage || "Payment was cancelled.");
      } else {
        // Still pending on Safaricom's side — give user a clear message
        setErrorMessage(
          "Payment not yet confirmed by M-Pesa. If you entered your PIN, wait 30 seconds and try again."
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to reconcile payment"
      );
    }
  };

  // Status display config
  const getStatusDisplay = () => {
    switch (status) {
      case "pending":
        return {
          icon: <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />,
          title: "Check Your Phone",
          description: `Enter your M-Pesa PIN on ${phoneNumber} to complete payment`,
          color: "bg-blue-50 border-blue-200",
        };
      case "completed":
        return {
          icon: <CheckCircle2 className="w-8 h-8 text-green-600" />,
          title: "Payment Successful",
          description: `Transaction ID: ${transactionId}`,
          color: "bg-green-50 border-green-200",
        };
      case "failed":
        return {
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          title: "Payment Not Confirmed",
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
  const maxPolls = 24;
  const secondsLeft = Math.max(0, (maxPolls - pollCount) * 5);
  const isChecking =
    checkPaymentStatusMutation.isPending || reconcilePaymentMutation.isPending;

  return (
    <Card className={`border-2 ${display.color}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {display.icon}
          <span>{display.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Description */}
        <p className="text-sm text-gray-600">{display.description}</p>

        {/* Pending: prominent PIN prompt */}
        {status === "pending" && (
          <div className="bg-blue-600 text-white rounded-lg p-4 text-center space-y-1">
            <Phone className="w-6 h-6 mx-auto mb-1" />
            <p className="font-semibold text-base">Enter your M-Pesa PIN now</p>
            <p className="text-sm opacity-90">The prompt was sent to {phoneNumber}</p>
          </div>
        )}

        {/* Payment Details */}
        <div className="bg-white p-3 rounded-md space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium">KES {(amount / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Phone:</span>
            <span className="font-medium">{phoneNumber}</span>
          </div>
          {status === "pending" && secondsLeft > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Auto-checking for:</span>
              <span className="font-medium">{secondsLeft}s</span>
            </div>
          )}
          {lastPollTime && (
            <div className="flex justify-between">
              <span className="text-gray-600">Last check:</span>
              <span className="text-xs">{lastPollTime.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Pending actions */}
        {status === "pending" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>Checking automatically every 5 seconds</span>
            </div>
            <Button
              onClick={handleManualReconciliation}
              variant="outline"
              className="w-full"
              disabled={isChecking}
            >
              {isChecking ? "Checking..." : "I Have Paid — Check Now"}
            </Button>
          </div>
        )}

        {/* Failed actions */}
        {status === "failed" && (
          <div className="space-y-3">
            <Button
              onClick={handleManualReconciliation}
              variant="outline"
              className="w-full"
              disabled={reconcilePaymentMutation.isPending}
            >
              {reconcilePaymentMutation.isPending ? "Checking..." : "I Have Paid — Check Again"}
            </Button>
            <Button onClick={onRetryPayment} variant="cta" className="w-full">
              Retry Payment
            </Button>
          </div>
        )}

        {/* Cancelled actions */}
        {status === "cancelled" && (
          <Button onClick={onRetryPayment} variant="cta" className="w-full">
            Try Payment Again
          </Button>
        )}

        {/* Success */}
        {status === "completed" && (
          <div className="bg-green-100 border border-green-300 rounded-md p-3">
            <p className="text-sm text-green-800">
              <CheckCircle2 className="w-4 h-4 inline mr-2" />
              Payment confirmed. You now have full access to this course.
            </p>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Check your M-Pesa messages for a confirmation SMS</p>
          <p>• If paid but still pending, tap "I Have Paid — Check Now"</p>
          <p>• Support: +254706781260</p>
        </div>
      </CardContent>
    </Card>
  );
}
