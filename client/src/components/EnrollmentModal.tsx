import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import MpesaReconciliationStatus from "./MpesaReconciliationStatus";

interface Course {
  id: number;
  courseId: string;
  title: string;
  price: number;
  level: "foundational" | "advanced";
}

interface EnrollmentModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onEnrollmentSuccess: () => void;
}

export function EnrollmentModal({
  course,
  isOpen,
  onClose,
  onEnrollmentSuccess,
}: EnrollmentModalProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [promoCode, setPromoCode] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [enrollmentStep, setEnrollmentStep] = useState<"initial" | "promo" | "payment" | "reconciliation" | "success">("initial");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [enrollmentId, setEnrollmentId] = useState<string>("");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>("");
  const [enrollmentDate, setEnrollmentDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Phone number validation
  const validatePhoneNumber = (phone: string): boolean => {
    const pattern = /^(07\d{8}|254\d{9})$/;
    return pattern.test(phone.replace(/\s/g, ""));
  };

  const isValidPhone = phoneNumber ? validatePhoneNumber(phoneNumber) : false;

  // Mutations
  const validatePromoMutation = trpc.enrollment.validatePromo.useMutation();
  const enrollWithPaymentMutation = trpc.enrollment.enrollWithPayment.useMutation();

  // Validate promo code
  const validatePromo = async () => {
    if (!promoCode) {
      setEnrollmentStep("payment");
      return;
    }

    setIsLoading(true);
    setStatusMessage("");
    try {
      const result = await validatePromoMutation.mutateAsync({ code: promoCode });
      if (result.valid) {
        setDiscountPercent(result.discount_percent || 0);
        if (result.discount_percent === 100) {
          // Free enrollment with promo code
          await handleFreeEnrollment();
        } else {
          // Show discount preview before moving to payment
          setStatusMessage("");
          setEnrollmentStep("payment");
        }
      } else {
        // Specific error messages
        let errorMsg = "Invalid promo code";
        if (result.message?.includes("expired")) {
          errorMsg = `Code expired on ${result.expiredDate || "unknown date"}`;
        } else if (result.message?.includes("max uses")) {
          errorMsg = `Code has reached max uses (${result.currentUses}/${result.maxUses})`;
        } else if (result.message?.includes("not found")) {
          errorMsg = "Code not found";
        } else {
          errorMsg = `Invalid promo code: ${result.message}`;
        }
        setStatusMessage(errorMsg);
      }
    } catch (error) {
      setStatusMessage("Error validating promo code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle free enrollment (admin or promo code)
  const handleFreeEnrollment = async () => {
    if (!course || !user) return;

    setIsLoading(true);
    try {
      const result = await enrollWithPaymentMutation.mutateAsync({
        courseId: course.courseId,
        promoCode: promoCode || undefined,
      });
      if (result.success) {
        setEnrollmentId(result.enrollmentId || "");
        setEnrollmentDate(new Date().toLocaleDateString());
        setPaymentMethod(promoCode ? "promo-code" : "admin-free");
        setAmountPaid(0);
        setEnrollmentStep("success");
        await utils.courses.getUserEnrollments.invalidate();
        onEnrollmentSuccess();
      } else {
        setStatusMessage(result.error || "Enrollment failed");
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Error during enrollment");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle M-Pesa payment
  const handleMpesaPayment = async () => {
    if (!course || !phoneNumber || !isValidPhone) return;

    setIsLoading(true);
    setStatusMessage("");
    try {
      const result = await enrollWithPaymentMutation.mutateAsync({
        courseId: course.courseId,
        phoneNumber,
      });

      if (result.success) {
        setEnrollmentId(result.enrollmentId || "");
        setCheckoutRequestId(result.checkoutRequestId || "");
        setPaymentMethod("m-pesa");
        const finalPrice = Math.ceil(course.price * (1 - discountPercent / 100));
        setAmountPaid(finalPrice / 100);
        // Move to reconciliation step instead of immediate success
        setEnrollmentStep("reconciliation");
      } else {
        setStatusMessage(result.error || "Failed to initiate payment");
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Error initiating payment");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentComplete = async (success: boolean) => {
    if (success) {
      setEnrollmentDate(new Date().toLocaleDateString());
      await utils.courses.getUserEnrollments.invalidate();
      setEnrollmentStep("success");
      onEnrollmentSuccess();
    } else {
      setEnrollmentStep("payment");
      setStatusMessage("Payment failed. Please try again or contact support.");
    }
  };

  if (!isOpen || !course) return null;

  const isAdmin = user?.role === "admin";
  const finalPrice = Math.ceil(course.price * (1 - discountPercent / 100));
  const finalPriceKES = (finalPrice / 100).toFixed(2);
  const originalPriceKES = (course.price / 100).toFixed(2);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enroll in {course.title}</DialogTitle>
          <DialogDescription>Complete your enrollment to start learning</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Initial Step */}
          {enrollmentStep === "initial" && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <p className="text-sm font-medium">Course Cost: KES {originalPriceKES}</p>
                <p className="text-xs text-gray-600 mt-1">Level: {course.level}</p>
                <p className="text-xs text-gray-600">You'll pay via M-Pesa or use a promo code</p>
              </div>

              {/* Primary: Continue to Payment */}
              <Button
                onClick={() => setEnrollmentStep("payment")}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                Continue to Payment
              </Button>

              {/* Secondary: Promo Code */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setEnrollmentStep("promo")}
                  variant="outline"
                  className="flex-1"
                  disabled={isLoading}
                >
                  Have a Promo Code?
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>Already have a discount code? Click here to apply it</TooltipContent>
                </Tooltip>
              </div>

              {/* Tertiary: Admin Free (if applicable) */}
              {isAdmin && (
                <Button
                  onClick={handleFreeEnrollment}
                  disabled={isLoading}
                  variant="secondary"
                  className="w-full"
                >
                  {isLoading ? "Enrolling..." : "Enroll (Admin - Free)"}
                </Button>
              )}

              {/* Cancel button */}
              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Promo Code Step */}
          {enrollmentStep === "promo" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="promo">Enter Promo Code</Label>
                <Input
                  id="promo"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="PROMO123"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {/* Discount preview */}
              {discountPercent > 0 && (
                <div className="bg-green-50 p-3 rounded-md border border-green-200">
                  <p className="text-sm font-medium text-green-700">✓ Promo code applied!</p>
                  <p className="text-xs text-green-600 mt-1">
                    Discount: {discountPercent}% (KES {((course.price * discountPercent) / 100 / 100).toFixed(2)} off)
                  </p>
                  <p className="text-xs text-green-600 font-medium mt-2">
                    Final price: KES {finalPriceKES} (was KES {originalPriceKES})
                  </p>
                </div>
              )}

              <Button
                onClick={validatePromo}
                disabled={isLoading || !promoCode}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Validate Code"
                )}
              </Button>
              <Button
                onClick={() => {
                  setPromoCode("");
                  setDiscountPercent(0);
                  setStatusMessage("");
                  setEnrollmentStep("initial");
                }}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                Back
              </Button>
            </div>
          )}

          {/* Payment Step */}
          {enrollmentStep === "payment" && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <p className="text-sm font-medium">Amount to Pay: KES {finalPriceKES}</p>
                {discountPercent > 0 && (
                  <p className="text-xs text-green-600 mt-1">Discount Applied: {discountPercent}%</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="07XXXXXXXX or 254XXXXXXXXX"
                  disabled={isLoading}
                  autoFocus
                />
                {phoneNumber && !isValidPhone && (
                  <p className="text-xs text-red-600 mt-1">Phone must be 07XXXXXXXX or 254XXXXXXXXX format</p>
                )}
              </div>

              <Button
                onClick={handleMpesaPayment}
                disabled={isLoading || !isValidPhone}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Pay with M-Pesa"
                )}
              </Button>

              <Button
                onClick={() => {
                  setEnrollmentStep("initial");
                  setStatusMessage("");
                }}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                Back
              </Button>
            </div>
          )}

          {/* M-Pesa Reconciliation Step */}
          {enrollmentStep === "reconciliation" && (
            <MpesaReconciliationStatus
              enrollmentId={enrollmentId}
              checkoutRequestId={checkoutRequestId}
              phoneNumber={phoneNumber}
              amount={amountPaid}
              onPaymentComplete={handlePaymentComplete}
            />
          )}

          {/* Success Step */}
          {enrollmentStep === "success" && (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-lg">Enrollment Successful!</p>
              </div>

              {/* Enrollment Confirmation */}
              <div className="bg-green-50 p-4 rounded-md border border-green-200 space-y-2">
                <p className="text-sm font-medium text-green-700">Enrollment Confirmation</p>
                <div className="text-xs space-y-1 text-gray-700">
                  <p><span className="font-medium">Course:</span> {course.title}</p>
                  <p><span className="font-medium">Enrollment Date:</span> {enrollmentDate}</p>
                  <p><span className="font-medium">Payment Method:</span> {paymentMethod === "m-pesa" ? "M-Pesa" : paymentMethod === "admin-free" ? "Admin Free" : "Promo Code"}</p>
                  {amountPaid > 0 && <p><span className="font-medium">Amount Paid:</span> KES {amountPaid.toFixed(2)}</p>}
                  {enrollmentId && <p><span className="font-medium">Enrollment ID:</span> {enrollmentId}</p>}
                </div>
              </div>

              {/* Access Duration */}
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <p className="text-xs text-gray-700">
                  <span className="font-medium">Access Duration:</span> 1 month from enrollment date
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  <span className="font-medium">Course Duration:</span> Estimated 2-4 hours
                </p>
              </div>

              {/* Next Steps */}
              <div className="space-y-2">
                <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700">
                  Go to Course
                </Button>
                <Button onClick={onClose} variant="outline" className="w-full">
                  Download Receipt
                </Button>
              </div>

              <p className="text-xs text-gray-600 text-center">
                Certificate will be issued after course completion
              </p>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-md border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{statusMessage}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
