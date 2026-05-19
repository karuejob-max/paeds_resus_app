import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { usePaymentPolling } from "@/hooks/usePaymentPolling";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, Clock, Loader, Phone } from "lucide-react";

interface STKPushPaymentProps {
  courseId: string;
  courseName: string;
  amount: number;
  onPaymentSuccess?: () => void;
  onPaymentFailed?: () => void;
}

export function STKPushPayment({
  courseId,
  courseName,
  amount,
  onPaymentSuccess,
  onPaymentFailed,
}: STKPushPaymentProps) {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);

  const initiateSTKPushMutation = trpc.payments.initiateSTKPush.useMutation();
  const storeCheckoutRequestMutation = trpc.payments.storeCheckoutRequest.useMutation();

  const { status, isPolling, attempts, result } = usePaymentPolling({
    checkoutRequestId: checkoutRequestId || "",
    enabled: !!checkoutRequestId,
    pollInterval: 2000,
    maxAttempts: 60,
    onSuccess: (paymentResult) => {
      toast({
        title: "Payment Successful",
        description: `Payment of ${paymentResult.amount} received`,
      });
      onPaymentSuccess?.();
    },
    onFailure: (paymentResult) => {
      toast({
        title: "Payment Failed",
        description: paymentResult.message,
        variant: "destructive",
      });
      onPaymentFailed?.();
    },
    onTimeout: () => {
      toast({
        title: "Payment Timeout",
        description: "No response from M-Pesa. Please check your phone or try again.",
        variant: "destructive",
      });
    },
  });

  const handleInitiatePayment = async () => {
    // Validate phone number
    if (!phoneNumber.match(/^254\d{9}$/)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Kenyan phone number (254XXXXXXXXX)",
        variant: "destructive",
      });
      return;
    }

    setIsInitiating(true);

    try {
      // Initiate STK Push
      const stkResponse = await initiateSTKPushMutation.mutateAsync({
        phoneNumber,
        amount,
        courseId,
        courseName,
      });

      if (!stkResponse.success) {
        throw new Error("Failed to initiate STK Push");
      }

      // Store checkout request for polling
      await storeCheckoutRequestMutation.mutateAsync({
        checkoutRequestId: stkResponse.checkoutRequestId,
        merchantRequestId: stkResponse.merchantRequestId,
        phoneNumber,
        amount,
        courseId,
        courseName,
      });

      setCheckoutRequestId(stkResponse.checkoutRequestId);

      toast({
        title: "STK Push Sent",
        description: "Check your phone for the M-Pesa payment prompt",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setIsInitiating(false);
    }
  };

  // Show payment status screen if STK Push has been initiated
  if (checkoutRequestId) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === "completed" ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                Payment Successful
              </>
            ) : status === "failed" ? (
              <>
                <AlertCircle className="w-5 h-5 text-red-600" />
                Payment Failed
              </>
            ) : status === "error" ? (
              <>
                <AlertCircle className="w-5 h-5 text-red-600" />
                Error
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-blue-600 animate-spin" />
                Waiting for Payment
              </>
            )}
          </CardTitle>
          <CardDescription>
            {status === "completed"
              ? "Your payment has been received"
              : status === "failed"
                ? "Your payment was not completed"
                : status === "error"
                  ? "An error occurred"
                  : `Attempt ${attempts + 1} of 60`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Payment Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Course:</span>
              <span className="font-medium">{courseName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Amount:</span>
              <span className="font-medium">KES {amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Phone:</span>
              <span className="font-medium">{phoneNumber}</span>
            </div>
          </div>

          {/* Status Message */}
          {status === "pending" && isPolling && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Waiting for M-Pesa prompt on your phone...
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Enter your M-Pesa PIN when prompted. This will timeout in {Math.ceil((60 - attempts) * 2 / 60)} minutes.
              </p>
            </div>
          )}

          {status === "completed" && result && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-sm text-green-800 font-medium">Payment Confirmed</p>
              <p className="text-xs text-green-700 mt-1">
                Receipt: {result.transactionId}
              </p>
            </div>
          )}

          {status === "failed" && result && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-sm text-red-800 font-medium">Payment Not Completed</p>
              <p className="text-xs text-red-700 mt-1">{result.message}</p>
            </div>
          )}

          {status === "error" && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-sm text-red-800 font-medium">Error Checking Payment Status</p>
              <p className="text-xs text-red-700 mt-1">
                Please try again or contact support if the problem persists.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {status === "pending" && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCheckoutRequestId(null)}
              >
                Cancel
              </Button>
            )}
            {(status === "completed" || status === "failed" || status === "error") && (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCheckoutRequestId(null)}
                >
                  Try Again
                </Button>
                {status === "completed" && (
                  <Button className="flex-1 bg-green-600 hover:bg-green-700">
                    Continue
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show phone number input screen
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          M-Pesa Payment
        </CardTitle>
        <CardDescription>Enter your phone number to receive the payment prompt</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Course Details */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Course:</span>
            <span className="font-medium">{courseName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="font-medium">KES {amount.toLocaleString()}</span>
          </div>
        </div>

        {/* Phone Number Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Phone Number</label>
          <Input
            type="tel"
            placeholder="254712345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isInitiating}
            className="text-lg"
          />
          <p className="text-xs text-gray-500">
            Format: 254 followed by 9 digits (e.g., 254712345678)
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
          <p className="text-xs text-blue-800">
            You will receive an M-Pesa prompt on your phone. Enter your PIN to complete the payment.
          </p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleInitiatePayment}
          disabled={isInitiating || !phoneNumber}
          className="w-full"
        >
          {isInitiating ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            "Send M-Pesa Prompt"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
