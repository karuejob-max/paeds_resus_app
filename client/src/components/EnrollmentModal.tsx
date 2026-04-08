import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface Course {
  id: number;
  courseId: string;
  title: string;
  price: number; // in cents
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
  const [step, setStep] = useState<"details" | "payment" | "success">("details");
  const [promoCode, setPromoCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Queries and mutations
  const validatePromoMutation = trpc.enrollment.validatePromo.useQuery(
    { code: promoCode, coursePrice: course?.price || 0 },
    { enabled: promoCode.length > 0 && isOpen }
  );

  const enrollMutation = trpc.enrollment.enrollWithPayment.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        setStep("success");
        setTimeout(() => {
          onClose();
          onEnrollmentSuccess();
        }, 2000);
      } else {
        setError(result.error || "Enrollment failed");
      }
      setLoading(false);
    },
    onError: (error) => {
      setError(error.message || "An error occurred");
      setLoading(false);
    },
  });

  if (!course) return null;

  const priceInKES = Math.ceil(course.price / 100);
  const promoDiscount = validatePromoMutation.data?.valid
    ? validatePromoMutation.data.finalPrice
    : priceInKES;
  const savings = priceInKES - promoDiscount;
  const isAdmin = user?.role === "admin";

  const handleEnroll = async () => {
    setError(null);
    setLoading(true);

    // Determine enrollment method
    if (isAdmin) {
      // Admin free enrollment
      enrollMutation.mutate({
        courseId: course.courseId,
      });
    } else if (promoCode && validatePromoMutation.data?.valid) {
      // Promo code enrollment
      enrollMutation.mutate({
        courseId: course.courseId,
        promoCode,
      });
    } else if (phoneNumber) {
      // M-Pesa enrollment
      if (!/^254\d{9}$/.test(phoneNumber)) {
        setError("Please enter a valid Kenyan phone number (254XXXXXXXXX)");
        setLoading(false);
        return;
      }
      enrollMutation.mutate({
        courseId: course.courseId,
        phoneNumber,
      });
    } else {
      setError("Please provide phone number for M-Pesa payment");
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enroll in {course.title}</DialogTitle>
          <DialogDescription>
            {course.level === "foundational"
              ? "Foundational Course"
              : "Advanced Course"}
          </DialogDescription>
        </DialogHeader>

        {step === "details" && (
          <div className="space-y-6">
            {/* Cost Display */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Course Price:</span>
                  <span className="font-semibold text-lg">
                    KES {priceInKES.toLocaleString()}
                  </span>
                </div>

                {/* Promo Code Section */}
                {!isAdmin && (
                  <div className="pt-4 border-t border-blue-200">
                    <Label htmlFor="promo" className="text-sm font-medium">
                      Have a promo code?
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="promo"
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        disabled={loading}
                        className="flex-1"
                      />
                      {validatePromoMutation.isLoading && (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500 mt-2" />
                      )}
                    </div>

                    {/* Promo validation feedback */}
                    {promoCode && validatePromoMutation.data && (
                      <div className="mt-2">
                        {validatePromoMutation.data.valid ? (
                          <div className="flex items-start gap-2 p-2 bg-green-50 rounded border border-green-200">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-green-900">
                                {validatePromoMutation.data.discountPercent}% discount applied!
                              </p>
                              <p className="text-green-700">
                                New price: KES {validatePromoMutation.data.finalPrice.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2 p-2 bg-red-50 rounded border border-red-200">
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">
                              {validatePromoMutation.data.error}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Final Price */}
                {!isAdmin && (promoCode || promoDiscount !== priceInKES) && (
                  <div className="pt-4 border-t border-blue-200 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">You pay:</span>
                      <span className="font-bold text-xl text-blue-600">
                        KES {promoDiscount.toLocaleString()}
                      </span>
                    </div>
                    {savings > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-green-700 text-sm">You save:</span>
                        <span className="font-semibold text-green-600">
                          KES {savings.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {isAdmin && (
                  <div className="pt-4 border-t border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Admin Access - Free Enrollment
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Phone Number for M-Pesa (if not admin and no valid promo) */}
            {!isAdmin && (!promoCode || !validatePromoMutation.data?.valid) && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-medium">
                  Phone Number (for M-Pesa payment)
                </Label>
                <Input
                  id="phone"
                  placeholder="254XXXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                  type="tel"
                  pattern="254\d{9}"
                />
                <p className="text-xs text-gray-500">
                  Enter your Kenyan phone number. You'll receive an M-Pesa prompt.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEnroll}
                disabled={
                  loading ||
                  (!isAdmin && !promoCode && !phoneNumber) ||
                  (promoCode && !validatePromoMutation.data?.valid)
                }
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : isAdmin ? (
                  "Enroll Now (Admin)"
                ) : promoCode && validatePromoMutation.data?.valid ? (
                  "Enroll with Promo"
                ) : (
                  "Pay with M-Pesa"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center space-y-4 py-8">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-green-900">
                Enrollment Successful!
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                {isAdmin
                  ? "You have been enrolled as admin."
                  : promoCode
                    ? "Your promo code has been applied."
                    : "Check your phone for the M-Pesa payment prompt."}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
