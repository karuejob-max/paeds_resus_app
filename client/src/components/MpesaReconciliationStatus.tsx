/**
 * Bounded UI polling: at most 24 serial checks within two minutes.
 * This is a UI limit, not a claim about the provider's CheckoutRequestID lifetime.
 */
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Phone,
  XCircle,
} from "lucide-react";
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
type StatusResult = {
  status: PaymentStatus;
  transactionId?: string;
  errorMessage?: string;
  resultCode?: string | number | null;
};
const POLLING_WINDOW_MS = 2 * 60 * 1000;
const MAX_POLLS = 24;
const UNCONFIRMED_MESSAGE =
  'Payment is not yet confirmed. Check your M-Pesa SMS, then tap "I Have Paid" to check again. A delay does not mean the payment was cancelled.';

function isUncertainResult(result: StatusResult) {
  return (
    /TRANSPORT|TIMEOUT|TIMED_OUT/i.test(String(result.resultCode ?? "")) ||
    String(result.resultCode) === "1037" ||
    /QUERY_TRANSPORT_ERROR|timed?\s*out|timeout|\b500\b/i.test(
      result.errorMessage ?? ""
    )
  );
}

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
  const [errorMessage, setErrorMessage] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [autoPolling, setAutoPolling] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [deadline, setDeadline] = useState(0);
  const checkPaymentStatusMutation =
    trpc.mpesa.checkPaymentStatus.useMutation();
  const reconcilePaymentMutation = trpc.mpesa.reconcilePayment.useMutation();

  // Mutation wrappers and parent callbacks may change on every render. They must
  // not restart the polling budget or invalidate an in-flight status request.
  const latestRef = useRef({
    checkPaymentStatusMutation,
    reconcilePaymentMutation,
    onPaymentComplete,
  });
  latestRef.current = {
    checkPaymentStatusMutation,
    reconcilePaymentMutation,
    onPaymentComplete,
  };
  const inFlightRef = useRef(false);
  const manualCheckRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    let active = true;
    let stopped = false;
    let completed = false;
    let attempts = 0;
    let consecutiveErrors = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
    const expiresAt = Date.now() + POLLING_WINDOW_MS;
    const checkoutId = checkoutRequestId.trim();
    const canQuery = Boolean(checkoutId && enrollmentId > 0);

    setStatus("pending");
    setPollCount(0);
    setLastPollTime(null);
    setTransactionId("");
    setIsChecking(inFlightRef.current);
    setDeadline(expiresAt);
    setAutoPolling(canQuery);
    setErrorMessage(
      canQuery
        ? ""
        : "Payment confirmation is unavailable because no checkout reference was returned. Contact support before retrying if you may have paid."
    );

    const stopAutomaticChecks = (message?: string) => {
      stopped = true;
      clearTimeout(timer);
      clearTimeout(deadlineTimer);
      if (!active) return;
      setAutoPolling(false);
      if (message) setErrorMessage(message);
    };

    const schedule = (delay: number) => {
      clearTimeout(timer);
      if (!active || stopped || completed) return;
      if (attempts >= MAX_POLLS || Date.now() >= expiresAt) {
        stopAutomaticChecks(UNCONFIRMED_MESSAGE);
        return;
      }
      timer = setTimeout(() => void check(false), delay);
    };

    const check = async (manual: boolean) => {
      if (!active || completed || !canQuery) return;
      if (
        !manual &&
        (stopped || attempts >= MAX_POLLS || Date.now() >= expiresAt)
      ) {
        stopAutomaticChecks(UNCONFIRMED_MESSAGE);
        return;
      }
      // One lock covers both automatic and manual requests, including an old
      // checkout request still finishing after props change.
      if (inFlightRef.current) {
        if (!manual) schedule(5000);
        return;
      }
      clearTimeout(timer);
      inFlightRef.current = true;
      setIsChecking(true);
      if (!manual) {
        attempts += 1;
        setPollCount(attempts);
      }
      try {
        const mutation = manual
          ? latestRef.current.reconcilePaymentMutation
          : latestRef.current.checkPaymentStatusMutation;
        const result: StatusResult = await mutation.mutateAsync({
          checkoutRequestId: checkoutId,
          enrollmentId,
        });
        if (!active) return;
        setLastPollTime(new Date());
        if (result.status === "completed") {
          completed = true;
          stopAutomaticChecks();
          setStatus("completed");
          setErrorMessage("");
          setTransactionId(result.transactionId || "");
          latestRef.current.onPaymentComplete(true);
        } else if (isUncertainResult(result)) {
          // An HTTP 200 carrying a query transport error is still an error.
          consecutiveErrors += 1;
          setStatus("pending");
          setErrorMessage(UNCONFIRMED_MESSAGE);
          if (consecutiveErrors >= 3) stopAutomaticChecks(UNCONFIRMED_MESSAGE);
        } else {
          consecutiveErrors = 0;
          if (result.status === "failed" || result.status === "cancelled") {
            stopAutomaticChecks();
            setStatus(result.status);
            setErrorMessage(
              result.errorMessage ||
                (result.status === "cancelled"
                  ? "M-Pesa reported that this payment was cancelled."
                  : "M-Pesa reported that this payment failed.")
            );
          } else {
            setStatus("pending");
            setErrorMessage(
              result.errorMessage ||
                (manual || stopped ? UNCONFIRMED_MESSAGE : "")
            );
          }
        }
      } catch {
        if (!active) return;
        consecutiveErrors += 1;
        setStatus("pending");
        setErrorMessage(UNCONFIRMED_MESSAGE);
        if (consecutiveErrors >= 3) stopAutomaticChecks(UNCONFIRMED_MESSAGE);
      } finally {
        inFlightRef.current = false;
        if (active) {
          setIsChecking(false);
          schedule(5000);
        }
      }
    };

    manualCheckRef.current = () => check(true);
    if (canQuery) {
      deadlineTimer = setTimeout(
        () => stopAutomaticChecks(UNCONFIRMED_MESSAGE),
        POLLING_WINDOW_MS
      );
      schedule(2500);
    }
    return () => {
      active = false;
      clearTimeout(timer);
      clearTimeout(deadlineTimer);
      manualCheckRef.current = null;
    };
  }, [checkoutRequestId, enrollmentId]);

  const canQuery = Boolean(checkoutRequestId.trim() && enrollmentId > 0);
  const display =
    status === "completed"
      ? {
          icon: <CheckCircle2 className="w-8 h-8 text-green-600" />,
          title: "Payment Successful",
          description: transactionId
            ? `Transaction ID: ${transactionId}`
            : "Payment confirmed by M-Pesa.",
          color: "bg-green-50 border-green-200",
        }
      : status === "cancelled"
        ? {
            icon: <AlertCircle className="w-8 h-8 text-yellow-600" />,
            title: "Payment Cancelled",
            description: errorMessage,
            color: "bg-yellow-50 border-yellow-200",
          }
        : status === "failed"
          ? {
              icon: <XCircle className="w-8 h-8 text-red-600" />,
              title: "Payment Failed",
              description: errorMessage,
              color: "bg-red-50 border-red-200",
            }
          : {
              icon: autoPolling ? (
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              ) : (
                <Clock className="w-8 h-8 text-blue-600" />
              ),
              title: autoPolling ? "Check Your Phone" : "Payment Not Confirmed",
              description: `The payment request was accepted. If a prompt appears on ${phoneNumber}, enter your M-Pesa PIN to pay.`,
              color: "bg-blue-50 border-blue-200",
            };
  const secondsLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));

  return (
    <Card className={`border-2 ${display.color}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {display.icon}
          <span>{display.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">{display.description}</p>
        {status === "pending" && (
          <div className="bg-blue-600 text-white rounded-lg p-4 text-center space-y-1">
            <Phone className="w-6 h-6 mx-auto mb-1" />
            <p className="font-semibold text-base">
              Check for an M-Pesa prompt
            </p>
            <p className="text-sm opacity-90">
              Acceptance does not guarantee delivery to {phoneNumber}.
            </p>
          </div>
        )}
        {status === "pending" && errorMessage && (
          <p className="text-sm text-gray-700" role="status">
            {errorMessage}
          </p>
        )}
        <div className="bg-white p-3 rounded-md space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium">KES {(amount / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Phone:</span>
            <span className="font-medium">{phoneNumber}</span>
          </div>
          {autoPolling && secondsLeft > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Auto-checking for:</span>
              <span className="font-medium">
                Up to {secondsLeft}s ({pollCount}/{MAX_POLLS} checks)
              </span>
            </div>
          )}
          {lastPollTime && (
            <div className="flex justify-between">
              <span className="text-gray-600">Last check:</span>
              <span className="text-xs">
                {lastPollTime.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
        {status !== "completed" && (
          <div className="space-y-3">
            {autoPolling && (
              <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span>
                  Checking automatically, with 5 seconds between checks
                </span>
              </div>
            )}
            <Button
              onClick={() => void manualCheckRef.current?.()}
              variant="outline"
              className="w-full"
              disabled={isChecking || !canQuery}
            >
              {isChecking ? "Checking..." : "I Have Paid — Check Now"}
            </Button>
            <p className="text-xs text-gray-600">
              Check your M-Pesa SMS first; do not retry if payment was deducted.
              If you are unsure, contact support before retrying. Another
              payment request could result in a second charge.
            </p>
            <Button
              onClick={onRetryPayment}
              variant="cta"
              className="w-full"
              disabled={isChecking}
            >
              Retry Payment
            </Button>
          </div>
        )}
        {status === "completed" && (
          <div className="bg-green-100 border border-green-300 rounded-md p-3">
            <p className="text-sm text-green-800">
              <CheckCircle2 className="w-4 h-4 inline mr-2" />
              Payment confirmed. You now have full access to this course.
            </p>
          </div>
        )}
        <div className="text-xs text-gray-500 space-y-1">
          <p>Check your M-Pesa messages for a confirmation SMS.</p>
          <p>If paid but still pending, tap "I Have Paid — Check Now".</p>
          <p>Support: +254706781260</p>
        </div>
      </CardContent>
    </Card>
  );
}
