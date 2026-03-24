import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, Loader2, Phone } from "lucide-react";

interface MpesaPaymentFormProps {
  courseId: string;
  courseName: string;
  amount: number;
  enrollmentId?: number;
  /** Called once when payment is confirmed (webhook/poll), not when STK is only initiated. */
  onPaymentComplete?: () => void;
  onPaymentError?: (error: string) => void;
}

export function MpesaPaymentForm({
  courseId,
  courseName,
  amount,
  enrollmentId,
  onPaymentComplete,
  onPaymentError,
}: MpesaPaymentFormProps) {
  const completionNotified = useRef(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [checkoutRequestID, setCheckoutRequestID] = useState("");
  const [pollEnrollmentId, setPollEnrollmentId] = useState<number | null>(null);

  const { data: checkoutPoll } = trpc.mpesa.getPaymentByCheckoutRequestId.useQuery(
    { checkoutRequestID },
    {
      enabled: paymentStatus === "processing" && checkoutRequestID.length > 0,
      refetchInterval: (q) => {
        const s = q.state.data?.status;
        if (s === "completed" || s === "failed") return false;
        return 3000;
      },
    }
  );

  const { data: enrollmentPoll } = trpc.mpesa.getPaymentStatusForEnrollment.useQuery(
    { enrollmentId: pollEnrollmentId! },
    {
      enabled: paymentStatus === "processing" && !!pollEnrollmentId && !checkoutRequestID,
      refetchInterval: (q) => {
        const s = q.state.data?.paymentStatus ?? q.state.data?.enrollmentPaymentStatus;
        if (s === "completed" || s === "failed") return false;
        return 3000;
      },
    }
  );

  useEffect(() => {
    if (paymentStatus !== "processing") return;

    if (checkoutPoll?.found && checkoutPoll.status === "completed") {
      setPaymentStatus("success");
      setStatusMessage("Payment received. Thank you!");
      return;
    }
    if (checkoutPoll?.found && checkoutPoll.status === "failed") {
      setPaymentStatus("error");
      setStatusMessage("Payment was not completed. You can try again.");
      onPaymentError?.("Payment failed");
    }
  }, [checkoutPoll, paymentStatus, onPaymentError]);

  useEffect(() => {
    if (paymentStatus !== "processing" || checkoutRequestID) return;
    if (!enrollmentPoll?.ok) return;

    const pay = enrollmentPoll.paymentStatus;
    const enr = enrollmentPoll.enrollmentPaymentStatus;
    if (pay === "completed" || enr === "completed") {
      setPaymentStatus("success");
      setStatusMessage("Payment received. Thank you!");
    } else if (pay === "failed") {
      setPaymentStatus("error");
      setStatusMessage("Payment was not completed.");
      onPaymentError?.("Payment failed");
    }
  }, [enrollmentPoll, paymentStatus, checkoutRequestID, onPaymentError]);

  useEffect(() => {
    if (paymentStatus !== "success" || completionNotified.current) return;
    completionNotified.current = true;
    onPaymentComplete?.();
  }, [paymentStatus, onPaymentComplete]);

  const initiatePaymentMutation = trpc.mpesa.initiatePayment.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setPaymentStatus("processing");
        setStatusMessage("STK Push sent! Enter your M-Pesa PIN on your phone. Waiting for confirmation…");
        const ck = data.checkoutRequestID || "";
        setCheckoutRequestID(ck);
        if (data.enrollmentId) {
          setPollEnrollmentId(data.enrollmentId);
        }
      } else {
        setPaymentStatus("error");
        setStatusMessage(data.error || "Payment initiation failed");
        onPaymentError?.(data.error || "Payment initiation failed");
      }
      setIsLoading(false);
    },
    onError: (error) => {
      setPaymentStatus("error");
      setStatusMessage(error.message || "Payment initiation failed");
      onPaymentError?.(error.message || "Payment initiation failed");
      setIsLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber) {
      setStatusMessage("Please enter your phone number");
      return;
    }

    setIsLoading(true);
    setPaymentStatus("processing");
    setStatusMessage("Initiating payment...");
    setCheckoutRequestID("");
    setPollEnrollmentId(enrollmentId ?? null);

    initiatePaymentMutation.mutate({
      phoneNumber,
      amount,
      courseId,
      courseName,
      ...(enrollmentId !== undefined && { enrollmentId }),
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-green-600" />
          M-Pesa Payment
        </CardTitle>
        <CardDescription>Pay for {courseName}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">Amount to Pay</p>
            <p className="text-3xl font-bold text-slate-900">KES {amount.toLocaleString()}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">M-Pesa Phone Number</label>
            <Input
              type="tel"
              placeholder="0712345678 or 254712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading || paymentStatus === "success"}
              className="w-full"
            />
            <p className="text-xs text-slate-500 mt-1">Enter your M-Pesa registered phone number</p>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-lg flex items-start gap-2 ${
                paymentStatus === "success"
                  ? "bg-green-50 border border-green-200"
                  : paymentStatus === "error"
                    ? "bg-red-50 border border-red-200"
                    : "bg-blue-50 border border-blue-200"
              }`}
            >
              {paymentStatus === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : paymentStatus === "error" ? (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              ) : (
                <Loader2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0 animate-spin" />
              )}
              <p
                className={`text-sm ${
                  paymentStatus === "success"
                    ? "text-green-700"
                    : paymentStatus === "error"
                      ? "text-red-700"
                      : "text-blue-700"
                }`}
              >
                {statusMessage}
              </p>
            </div>
          )}

          {paymentStatus === "processing" && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-900 mb-2">What to do next:</p>
              <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
                <li>Check your phone for the M-Pesa prompt</li>
                <li>Enter your M-Pesa PIN</li>
                <li>This page updates automatically when payment completes</li>
              </ol>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || paymentStatus === "success" || paymentStatus === "processing"}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : paymentStatus === "success" ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Payment Complete
              </>
            ) : paymentStatus === "processing" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Waiting for payment…
              </>
            ) : (
              <>
                <Phone className="w-4 h-4 mr-2" />
                Pay KES {amount.toLocaleString()}
              </>
            )}
          </Button>

          <p className="text-xs text-slate-500 text-center">Secure payment powered by M-Pesa.</p>
        </form>
      </CardContent>
    </Card>
  );
}
