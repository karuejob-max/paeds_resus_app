import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, Loader2, Phone, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MpesaPaymentFormProps {
  courseId: string;
  courseName: string;
  amount: number;
  enrollmentId?: number;
  onPaymentSuccess?: (data: any) => void;
  onPaymentError?: (error: string) => void;
}

export function MpesaPaymentForm({
  courseId,
  courseName,
  amount,
  enrollmentId,
  onPaymentSuccess,
  onPaymentError,
}: MpesaPaymentFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [checkoutRequestID, setCheckoutRequestID] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedPhoneNumber, setConfirmedPhoneNumber] = useState("");

  const initiatePaymentMutation = trpc.mpesa.initiatePayment.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setPaymentStatus("processing");
        setStatusMessage("STK Push sent! Enter your M-Pesa PIN on your phone.");
        setCheckoutRequestID(data.checkoutRequestID || "");
        
        // Start polling for payment status
  

        onPaymentSuccess?.(data);
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

  const queryPaymentStatusMutation = trpc.mpesa.queryPaymentStatus.useMutation({
    onSuccess: (data) => {
      if (data.resultCode === 0) {
        // Payment successful
        setPaymentStatus("success");
        setStatusMessage("Payment successful! Certificate issued.");
        onPaymentSuccess?.(data);
      } else if (data.resultCode === 1) {
        // Payment failed
        setPaymentStatus("error");
        setStatusMessage("Payment failed. Please try again.");
        onPaymentError?.("Payment failed");
      }
      // resultCode 2 = user timeout, keep polling
    },
    onError: (error) => {
      // Continue polling on transient errors
      console.error("Payment status query error:", error);
    },
  });

  // Start polling for payment status after STK push
  useEffect(() => {
    if (!checkoutRequestID || paymentStatus !== "processing") return;

    const pollInterval = setInterval(() => {
      queryPaymentStatusMutation.mutate({ checkoutRequestID });
    }, 3000); // Poll every 3 seconds

    // Stop polling after 2 minutes
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      if (paymentStatus === "processing") {
        setPaymentStatus("error");
        setStatusMessage("Payment confirmation timeout. Please check your M-Pesa balance.");
      }
    }, 120000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [checkoutRequestID, paymentStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber) {
      setStatusMessage("Please enter your phone number");
      return;
    }

    // Show confirmation dialog instead of directly initiating payment
    setConfirmedPhoneNumber(phoneNumber);
    setShowConfirmation(true);
  };

  const handleConfirmPayment = () => {
    setShowConfirmation(false);
    setIsLoading(true);
    setPaymentStatus("processing");
    setStatusMessage("Initiating payment...");

    initiatePaymentMutation.mutate({
      phoneNumber: confirmedPhoneNumber,
      amount,
      courseId,
      courseName,
      ...(enrollmentId !== undefined && { enrollmentId }),
    });
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    if (phone.startsWith("254")) {
      return `+${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
    }
    return phone;
  };

  return (
    <>
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
            {/* Amount Display */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">Amount to Pay</p>
              <p className="text-3xl font-bold text-slate-900">KES {amount.toLocaleString()}</p>
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                M-Pesa Phone Number
              </label>
              <Input
                type="tel"
                placeholder="0712345678 or 254712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isLoading || paymentStatus === "success"}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter your M-Pesa registered phone number
              </p>
            </div>

            {/* Status Messages */}
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

            {/* Instructions */}
            {paymentStatus === "processing" && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-900 mb-2">What to do next:</p>
                <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
                  <li>A popup will appear on your phone</li>
                  <li>Enter your M-Pesa PIN</li>
                  <li>Wait for confirmation</li>
                </ol>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || paymentStatus === "success"}
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
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  Pay KES {amount.toLocaleString()}
                </>
              )}
            </Button>

            {/* Footer */}
            <p className="text-xs text-slate-500 text-center">
              Secure payment powered by M-Pesa. Your phone number is encrypted.
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Confirm Payment
            </DialogTitle>
            <DialogDescription>
              Please review the payment details before proceeding
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Course Details */}
            <div className="p-4 bg-slate-50 rounded-lg space-y-3">
              <div>
                <p className="text-sm text-slate-600">Course</p>
                <p className="font-bold text-slate-900">{courseName}</p>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm text-slate-600">Amount</p>
                <p className="text-2xl font-bold text-green-600">KES {amount.toLocaleString()}</p>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm text-slate-600">Payment To</p>
                <p className="font-bold text-slate-900">Paeds Resus Limited</p>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm text-slate-600">Phone Number</p>
                <p className="font-bold text-slate-900">{formatPhoneNumber(confirmedPhoneNumber)}</p>
              </div>
            </div>

            {/* Warning */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900">
                <strong>Note:</strong> You will receive an M-Pesa prompt on your phone. Enter your PIN to complete the payment.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm & Pay"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
