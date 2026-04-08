import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";

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
  const [enrollmentStep, setEnrollmentStep] = useState<"initial" | "promo" | "payment" | "success">("initial");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);

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
    try {
      const result = await validatePromoMutation.mutateAsync({ code: promoCode });
      if (result.valid) {
        setDiscountPercent(result.discount_percent || 0);
        if (result.discount_percent === 100) {
          // Free enrollment with promo code
          await handleFreeEnrollment();
        } else {
          setEnrollmentStep("payment");
        }
      } else {
        setStatusMessage(`Invalid promo code: ${result.message}`);
      }
    } catch (error) {
      setStatusMessage("Error validating promo code");
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
        setEnrollmentStep("success");
        await utils.courses.getEnrollments.invalidate();
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
    if (!course || !phoneNumber) return;

    setIsLoading(true);
    try {
      const result = await enrollWithPaymentMutation.mutateAsync({
        courseId: course.courseId,
        phoneNumber,
      });

      if (result.success) {
        setStatusMessage("STK Push sent! Check your phone for M-Pesa prompt");
        // Wait for webhook confirmation before marking as success
        setTimeout(async () => {
          await utils.courses.getEnrollments.invalidate();
          setEnrollmentStep("success");
          onEnrollmentSuccess();
        }, 2000);
      } else {
        setStatusMessage(result.error || "Failed to initiate payment");
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Error initiating payment");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !course) return null;

  const isAdmin = user?.role === "admin";
  const finalPrice = Math.ceil(course.price * (1 - discountPercent / 100));
  const finalPriceKES = (finalPrice / 100).toFixed(2);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enroll in {course.title}</DialogTitle>
          <DialogDescription>Complete your enrollment to start learning</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Initial Step */}
          {enrollmentStep === "initial" && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm font-medium">Course Cost: KES {(course.price / 100).toFixed(2)}</p>
                <p className="text-xs text-gray-600">Level: {course.level}</p>
              </div>

              {/* Admin can enroll for free */}
              {isAdmin && (
                <Button
                  onClick={handleFreeEnrollment}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? "Enrolling..." : "Enroll (Admin - Free)"}
                </Button>
              )}

              <Button
                onClick={() => setEnrollmentStep("promo")}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                Have a Promo Code?
              </Button>
              <Button
                onClick={() => setEnrollmentStep("payment")}
                className="w-full"
                disabled={isLoading}
              >
                Continue to Payment
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
                />
              </div>
              <Button
                onClick={validatePromo}
                disabled={isLoading || !promoCode}
                className="w-full"
              >
                {isLoading ? "Validating..." : "Validate Code"}
              </Button>
              <Button
                onClick={() => {
                  setPromoCode("");
                  setDiscountPercent(0);
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
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm font-medium">Amount to Pay: KES {finalPriceKES}</p>
                {discountPercent > 0 && (
                  <p className="text-xs text-green-600">Discount Applied: {discountPercent}%</p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0712345678"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleMpesaPayment}
                disabled={isLoading || !phoneNumber}
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
                onClick={() => setEnrollmentStep("initial")}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                Back
              </Button>
            </div>
          )}

          {/* Success Step */}
          {enrollmentStep === "success" && (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
              <p className="font-medium">Enrollment Successful!</p>
              <p className="text-sm text-gray-600">You can now access the course</p>
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-600">{statusMessage}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
