import { useEffect, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";

export type PaymentStatus = "pending" | "completed" | "failed" | "not_found" | "error";

interface PaymentStatusResult {
  status: PaymentStatus;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  transactionId?: string;
  updatedAt?: Date;
  message: string;
}

interface UsePaymentPollingOptions {
  checkoutRequestId: string;
  enabled?: boolean;
  pollInterval?: number; // milliseconds, default 2000
  maxAttempts?: number; // default 60 (2 minutes with 2s interval)
  onSuccess?: (result: PaymentStatusResult) => void;
  onFailure?: (result: PaymentStatusResult) => void;
  onTimeout?: () => void;
}

/**
 * Hook for polling payment status after STK Push
 * Polls the backend every 2 seconds until payment completes or times out
 */
export function usePaymentPolling({
  checkoutRequestId,
  enabled = true,
  pollInterval = 2000,
  maxAttempts = 60,
  onSuccess,
  onFailure,
  onTimeout,
}: UsePaymentPollingOptions) {
  const [status, setStatus] = useState<PaymentStatus>("pending");
  const [isPolling, setIsPolling] = useState(enabled);
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<PaymentStatusResult | null>(null);

  const getPaymentStatusQuery = trpc.payments.getPaymentStatus.useQuery(
    { checkoutRequestId },
    {
      enabled: false, // Manual trigger
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  const pollPaymentStatus = useCallback(async () => {
    if (!enabled || !isPolling) return;

    try {
      const data = await getPaymentStatusQuery.refetch();

      if (!data.data) {
        console.warn("No payment status data returned");
        return;
      }

      const paymentResult = data.data;
      setResult(paymentResult);
      setStatus(paymentResult.status);

      // Stop polling if payment is completed or failed
      if (paymentResult.status === "completed") {
        setIsPolling(false);
        onSuccess?.(paymentResult);
        return;
      }

      if (paymentResult.status === "failed") {
        setIsPolling(false);
        onFailure?.(paymentResult);
        return;
      }

      // Check if we've exceeded max attempts
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= maxAttempts) {
        setIsPolling(false);
        setStatus("error");
        onTimeout?.();
      }
    } catch (error) {
      console.error("Error polling payment status:", error);
      setStatus("error");
      setIsPolling(false);
    }
  }, [enabled, isPolling, attempts, maxAttempts, getPaymentStatusQuery, onSuccess, onFailure, onTimeout]);

  // Set up polling interval
  useEffect(() => {
    if (!isPolling || !enabled) return;

    const interval = setInterval(() => {
      pollPaymentStatus();
    }, pollInterval);

    // Initial poll immediately
    pollPaymentStatus();

    return () => clearInterval(interval);
  }, [isPolling, enabled, pollInterval, pollPaymentStatus]);

  return {
    status,
    isPolling,
    attempts,
    result,
    stopPolling: () => setIsPolling(false),
    startPolling: () => setIsPolling(true),
    resetPolling: () => {
      setAttempts(0);
      setStatus("pending");
      setResult(null);
      setIsPolling(true);
    },
  };
}
