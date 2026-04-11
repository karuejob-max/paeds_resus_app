/**
 * Enrollment Modal - Retention-Focused
 * 
 * Retention Improvements:
 * - Payment breakdown with clear amount confirmation
 * - Flexible phone number input (accepts multiple formats)
 * - Back button preserves promo code and discount
 * - 100% discount requires explicit confirmation (not auto-enroll)
 * - Admin-free option is prominent and clear
 * - Course details visible in modal
 * - Progress indicator (Step X/Y)
 * - Clear error recovery paths
 * - Loading states prevent duplicate submissions
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, Info, ArrowLeft } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { MpesaReconciliationStatus } from "./MpesaReconciliationStatus";

interface Course {
  id: number;
  courseId: string;
  title: string;
  price: number;
  level: "foundational" | "advanced";
  description?: string;
  duration?: string;
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
  const [enrollmentStep, setEnrollmentStep] = useState<"initial" | "promo" | "payment" | "reconciliation" | "confirm-100" | "success">("initial");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [enrollmentId, setEnrollmentId] = useState<string>("");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>("");
  const [enrollmentDate, setEnrollmentDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [promoValidationError, setPromoValidationError] = useState<string>("");

  // Phone number validation - flexible format support
  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, "");
    // Accept 07XXXXXXXX (10 digits starting with 07)
    // Accept 254XXXXXXXXX (12 digits starting with 254)
    return /^(07\d{8}|254\d{9})$/.test(cleaned);
  };

  // Format phone number for display
  const formatPhoneDisplay = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("07")) {
      return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`;
    } else if (cleaned.startsWith("254")) {
      return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9)}`;
    }
    return phone;
  };

  const isValidPhone = phoneNumber ? validatePhoneNumber(phoneNumber) : false;
  const phoneDisplay = formatPhoneDisplay(phoneNumber);

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
    setPromoValidationError("");
    setStatusMessage("");
    try {
      const result = await validatePromoMutation.mutateAsync({ code: promoCode });
      if (result.valid) {
        setDiscountPercent(result.discount_percent || 0);
        if (result.discount_percent === 100) {
          // Show confirmation for 100% discount (don't auto-enroll)
          setEnrollmentStep("confirm-100");
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
        setPromoValidationError(errorMsg);
      }
    } catch (error) {
      setPromoValidationError("Error validating promo code. Please try again.");
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
        phoneNumber: phoneNumber.replace(/\D/g, ""), // Send cleaned phone number
      });

      if (result.success) {
        setEnrollmentId(result.enrollmentId || "");
        setCheckoutRequestId(result.checkoutRequestId || "");
        setPaymentMethod("m-pesa");
        const finalPrice = Math.ceil(course.price * (1 - discountPercent / 100));
        setAmountPaid(finalPrice / 100);
        // Move to reconciliation step
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
  const savingsKES = ((course.price - finalPrice) / 100).toFixed(2);

  // Calculate step number for progress indicator
  const getStepNumber = () => {
    switch (enrollmentStep) {
      case "initial": return "1/4";
      case "promo": return "2/4";
      case "payment": return "3/4";
      case "confirm-100": return "3/4";
      case "reconciliation": return "4/4";
      case "success": return "Complete";
      default: return "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Enroll in {course.title}</DialogTitle>
              <DialogDescription>Step {getStepNumber()}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Initial Step */}
          {enrollmentStep === "initial" && (
            <div className="space-y-4">
              {/* Course Details */}
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200 space-y-2">
                <p className="text-sm font-medium">Course Details</p>
                <div className="text-xs space-y-1 text-gray-700">
                  <p><span className="font-medium">Level:</span> {course.level}</p>
                  <p><span className="font-medium">Duration:</span> {course.duration || "2-4 hours"}</p>
                  {course.description && <p className="text-gray-600">{course.description}</p>}
                </div>
              </div>

              {/* Price Information */}
              <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                <p className="text-sm font-medium text-amber-900">Course Cost: KES {originalPriceKES}</p>
                <p className="text-xs text-amber-700 mt-1">You can pay with M-Pesa or use a promo code for a discount</p>
              </div>

              {/* Primary: Continue to Payment */}
              <Button
                onClick={() => setEnrollmentStep("payment")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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

              {/* Tertiary: Admin Free (if applicable) - PROMINENT */}
              {isAdmin && (
                <div className="bg-green-50 p-3 rounded-md border-2 border-green-300">
                  <p className="text-xs font-medium text-green-700 mb-2">✓ Admin Benefit Available</p>
                  <Button
                    onClick={handleFreeEnrollment}
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoading ? "Enrolling..." : "Enroll for Free (Admin)"}
                  </Button>
                  <p className="text-xs text-green-600 mt-2 text-center">You can change your role anytime</p>
                </div>
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
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoValidationError("");
                  }}
                  placeholder="e.g., WELCOME50"
                  disabled={isLoading}
                  autoFocus
                />
                {promoValidationError && (
                  <p className="text-xs text-red-600 mt-1">{promoValidationError}</p>
                )}
              </div>

              {/* Discount preview */}
              {discountPercent > 0 && (
                <div className="bg-green-50 p-3 rounded-md border border-green-200 space-y-1">
                  <p className="text-sm font-medium text-green-700">✓ Promo code applied!</p>
                  <p className="text-xs text-green-600">
                    Discount: {discountPercent}% (KES {savingsKES} off)
                  </p>
                  <p className="text-xs text-green-600 font-medium">
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

              {/* Back button - preserves promo code */}
              <Button
                onClick={() => {
                  setEnrollmentStep("initial");
                  setPromoValidationError("");
                }}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          )}

          {/* Payment Step */}
          {enrollmentStep === "payment" && (
            <div className="space-y-4">
              {/* Payment Breakdown */}
              <div className="bg-blue-50 p-4 rounded-md border border-blue-200 space-y-2">
                <p className="text-sm font-medium">Payment Breakdown</p>
                <div className="text-xs space-y-1 text-gray-700">
                  <div className="flex justify-between">
                    <span>Original price:</span>
                    <span>KES {originalPriceKES}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({discountPercent}%):</span>
                      <span>-KES {savingsKES}</span>
                    </div>
                  )}
                  <div className="border-t pt-1 flex justify-between font-medium">
                    <span>Final Amount:</span>
                    <span className="text-lg">KES {finalPriceKES}</span>
                  </div>
                </div>
              </div>

              {/* Phone Input */}
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
                  <p className="text-xs text-red-600 mt-1">
                    ✗ Phone must be 07XXXXXXXX or 254XXXXXXXXX format
                  </p>
                )}
                {phoneNumber && isValidPhone && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Phone: {phoneDisplay}
                  </p>
                )}
              </div>

              {/* Payment Confirmation */}
              <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                <p className="text-xs text-amber-900">
                  <span className="font-medium">Confirmation:</span> I understand I will be charged <span className="font-semibold">KES {finalPriceKES}</span> to <span className="font-semibold">{phoneDisplay || "my phone"}</span>
                </p>
              </div>

              {/* Pay Button */}
              <Button
                onClick={handleMpesaPayment}
                disabled={isLoading || !isValidPhone}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm & Pay with M-Pesa"
                )}
              </Button>

              {/* Back button - preserves promo code and discount */}
              <Button
                onClick={() => {
                  setEnrollmentStep("initial");
                  setStatusMessage("");
                }}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          )}

          {/* 100% Discount Confirmation Step */}
          {enrollmentStep === "confirm-100" && (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-lg">This promo code gives you FREE access!</p>
              </div>

              <div className="bg-green-50 p-4 rounded-md border border-green-200 space-y-2">
                <p className="text-sm font-medium text-green-700">Promo Code: {promoCode}</p>
                <p className="text-xs text-green-600">
                  Discount: 100% (Save KES {originalPriceKES})
                </p>
                <p className="text-xs text-green-600 font-medium">
                  You'll pay: KES 0.00
                </p>
              </div>

              <Button
                onClick={handleFreeEnrollment}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? "Enrolling..." : "Confirm Enrollment"}
              </Button>

              <Button
                onClick={() => {
                  setEnrollmentStep("promo");
                  setDiscountPercent(0);
                }}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          )}

          {/* M-Pesa Reconciliation Step */}
          {enrollmentStep === "reconciliation" && (
            <MpesaReconciliationStatus
              enrollmentId={parseInt(enrollmentId)}
              checkoutRequestId={checkoutRequestId}
              phoneNumber={phoneDisplay}
              amount={amountPaid * 100}
              onPaymentComplete={handlePaymentComplete}
            />
          )}

          {/* Success Step */}
          {enrollmentStep === "success" && (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-lg">Enrollment Successful!</p>
                <p className="text-xs text-gray-600 mt-1">Welcome to your course</p>
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

              {/* Access Information */}
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200 space-y-1">
                <p className="text-xs text-gray-700">
                  <span className="font-medium">Access Duration:</span> 1 month from enrollment
                </p>
                <p className="text-xs text-gray-700">
                  <span className="font-medium">Course Duration:</span> {course.duration || "2-4 hours"}
                </p>
              </div>

              {/* Next Steps */}
              <div className="space-y-2">
                <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700 text-white">
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
