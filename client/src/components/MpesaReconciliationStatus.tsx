/**
 * M-Pesa Reconciliation Status Component
 * Displays payment status, polling updates, and callback handling
 * Handles: pending → completed/failed transitions
 */

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
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

    const poll = async () => {
      if (attempts >= maxPolls) {
        setErrorMessage(
          "Still waiting for M-Pesa confirmation. If you have paid, tap Check Now. If not, retry payment."
        );
        setStatus("failed");
        if (pollInterval) clearInterval(pollInterval);
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

        if (result.status === "completed") {
          setStatus("completed");
          setTransactionId(result.transactionId || "");
          onPaymentComplete(true);
          if (pollInterval) clearInterval(pollInterval);
        } else if (result.status === "failed") {
          setStatus("failed");
          setErrorMessage(result.errorMessage || "Payment failed. Please try again.");
          if (pollInterval) clearInterval(pollInterval);
        } else if (result.status === "cancelled") {
          setStatus("cancelled");
          setErrorMessage("Payment was cancelled.");
          if (pollInterval) clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("[M-Pesa Reconciliation] Poll error:", error);
        setErrorMessage("Error checking payment status. Retrying...");
      }
    };

    pollTimeout = setTimeout(() => {
      poll();
      pollInterval = setInterval(poll, 5000);
    }, 2500);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [status, checkoutRequestId, enrollmentId, onPaymentComplete, checkPaymentStatusMutation]);

  // Manual reconciliation (admin/user can trigger)
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
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to reconcile payment"
      );
    }
  };

  // Status display
  const getStatusDisplay = () => {
    switch (status) {
      case "pending":
        return {
          icon: <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />,
          title: "Payment Pending",
          description: `Waiting for M-Pesa confirmation on ${phoneNumber}`,
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
  const maxPolls = 24;
  const checksRemaining = Math.max(0, maxPolls - pollCount);
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
          <div className="flex justify-between">
            <span className="text-gray-600">Checkout ID:</span>
            <span className="font-mono text-xs">{checkoutRequestId.substring(0, 20)}...</span>
          </div>
          {status === "pending" && (
            <div className="flex justify-between">
              <span className="text-gray-600">Polls:</span>
              <span className="font-medium">{pollCount}/24</span>
            </div>
          )}
          {lastPollTime && (
            <div className="flex justify-between">
              <span className="text-gray-600">Last Check:</span>
              <span className="text-xs">{lastPollTime.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Status-Specific Actions */}
        {status === "pending" && (
          <div className="space-y-3">
            <div className="bg-blue-100 border border-blue-300 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <Clock className="w-4 h-4 inline mr-2" />
                Checking automatically every 5 seconds. Approximate time left: {checksRemaining * 5}s
              </p>
            </div>
            <Button
              onClick={handleManualReconciliation}
              variant="outline"
              className="w-full"
              disabled={isChecking}
            >
              {isChecking ? "Checking..." : "I Have Paid - Check Now"}
            </Button>
          </div>
        )}

        {status === "failed" && (
          <div className="space-y-3">
            <div className="bg-red-100 border border-red-300 rounded-md p-3">
              <p className="text-sm text-red-800">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                {errorMessage}
              </p>
            </div>
            <Button
              onClick={handleManualReconciliation}
              variant="outline"
              className="w-full"
              disabled={reconcilePaymentMutation.isPending}
            >
              {reconcilePaymentMutation.isPending ? "Checking..." : "Check Again"}
            </Button>
            <Button onClick={onRetryPayment} variant="cta" className="w-full">
              Retry Payment
            </Button>
          </div>
        )}

        {status === "cancelled" && (
          <div className="space-y-3">
            <div className="bg-yellow-100 border border-yellow-300 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                You can try the payment again or use a different method.
              </p>
            </div>
            <Button onClick={onRetryPayment} variant="cta" className="w-full">
              Try Payment Again
            </Button>
          </div>
        )}

        {status === "completed" && (
          <div className="space-y-3">
            <div className="bg-green-100 border border-green-300 rounded-md p-3">
              <p className="text-sm text-green-800">
                <CheckCircle2 className="w-4 h-4 inline mr-2" />
                Your payment has been successfully processed. You can now access the course.
              </p>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Check your M-Pesa message for confirmation</p>
          <p>• If payment was successful but still pending, tap "I Have Paid - Check Now"</p>
          <p>• Contact support if issues persist: +254706781260</p>
        </div>
      </CardContent>
    </Card>
  );
}
