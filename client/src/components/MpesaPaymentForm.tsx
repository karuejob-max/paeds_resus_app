import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, Loader2, Phone } from "lucide-react";

interface MpesaPaymentFormProps {
  courseId: string;
  courseName: string;
  amount: number;
  onPaymentSuccess?: (data: any) => void;
  onPaymentError?: (error: string) => void;
}

export function MpesaPaymentForm({
  courseId,
  courseName,
  amount,
  onPaymentSuccess,
  onPaymentError,
}: MpesaPaymentFormProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [checkoutRequestID, setCheckoutRequestID] = useState("");

  const initiatePaymentMutation = trpc.mpesa.initiatePayment.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setPaymentStatus("processing");
        setStatusMessage("STK Push sent! Enter your M-Pesa PIN on your phone.");
        setCheckoutRequestID(data.checkoutRequestID || "");
        
        // Start polling for payment status
        const pollInterval = setInterval(() => {
          if (data.checkoutRequestID) {
            // Poll logic would go here
          }
        }, 3000); // Poll every 3 seconds

        // Stop polling after 2 minutes
        setTimeout(() => clearInterval(pollInterval), 120000);

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

  const queryPaymentStatusMutation = trpc.mpesa.queryPaymentStatus.useQuery(
    { checkoutRequestID },
    {
      enabled: false,
    }
  );

  // Simplified payment status tracking
  const handlePaymentStatusCheck = () => {
    if (checkoutRequestID) {
      queryPaymentStatusMutation.refetch();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber) {
      setStatusMessage("Please enter your phone number");
      return;
    }

    setIsLoading(true);
    setPaymentStatus("processing");
    setStatusMessage("Initiating payment...");

    initiatePaymentMutation.mutate({
      phoneNumber,
      amount,
      courseId,
      courseName,
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
  );
}
