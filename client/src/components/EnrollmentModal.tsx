import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, Info, ChevronDown, ChevronUp, Phone } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { MpesaReconciliationStatus } from "./MpesaReconciliationStatus";
import { useProviderConversionAnalytics } from "@/hooks/useProviderConversionAnalytics";
import { getProviderCourseDestination } from "@/lib/providerCourseRoutes";
import { toast } from "sonner";

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
  const { track } = useProviderConversionAnalytics("/fellowship/enrollment-modal");

  // ── State ──────────────────────────────────────────────────────────────────
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [promoCode, setPromoCode] = useState<string>("");
  const [showPromo, setShowPromo] = useState(false);
  const [showManualLipa, setShowManualLipa] = useState(false);
  const [manualReceiptCode, setManualReceiptCode] = useState<string>("");
  const [manualPayerPhone, setManualPayerPhone] = useState<string>("");

  // Steps: "payment" (default) | "reconciliation" | "success"
  const [step, setStep] = useState<"payment" | "reconciliation" | "success">("payment");

  const [statusMessage, setStatusMessage] = useState<string>("");
  const [infoMessage, setInfoMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [enrollmentId, setEnrollmentId] = useState<number>(0);
  const [launchEnrollmentId, setLaunchEnrollmentId] = useState<number>(0);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>("");
  const [enrollmentDate, setEnrollmentDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validatePhoneNumber = (phone: string): boolean =>
    /^(07\d{8}|254\d{9})$/.test(phone.replace(/\s/g, ""));

  const isValidPhone = phoneNumber ? validatePhoneNumber(phoneNumber) : false;

  // ── tRPC ───────────────────────────────────────────────────────────────────
  const { data: payCaps } = trpc.mpesa.getClientPaymentCapabilities.useQuery(undefined, {
    staleTime: 60_000,
  });
  const warmDarajaAuth = trpc.mpesa.warmDarajaAuth.useMutation();
  const enrollWithPaymentMutation = trpc.enrollment.enrollWithPayment.useMutation();
  const submitManualMpesaReferenceMutation = trpc.enrollment.submitManualMpesaReference.useMutation();

  // ── Pre-warm Daraja token when modal opens ─────────────────────────────────
  // Fire-and-forget: by the time the user types their number, the token is cached.
  useEffect(() => {
    if (!isOpen || !course) return;
    // Reset state on open
    setStep("payment");
    setStatusMessage("");
    setInfoMessage("");
    setDiscountPercent(0);
    setPromoCode("");
    setShowPromo(false);
    setShowManualLipa(false);
    setEnrollmentId(0);
    setLaunchEnrollmentId(0);
    setCheckoutRequestId("");
    setPaymentMethod("");
    setAmountPaid(0);

    // Pre-warm token silently
    warmDarajaAuth.mutate(undefined, {
      onError: () => {/* silent — STK push will re-auth if needed */},
    });

    track("enrollment_started", "micro_course_enrollment_modal_opened", {
      courseId: course.courseId,
      courseTitle: course.title,
      source: "fellowship_dashboard",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, course?.courseId]);

  // ── Promo code validation ──────────────────────────────────────────────────
  const validatePromo = async () => {
    if (!promoCode) return;
    setIsLoading(true);
    setStatusMessage("");
    try {
      const result = await utils.enrollment.validatePromo.fetch({
        code: promoCode,
        coursePrice: course?.price ?? 0,
      });
      if (result.valid) {
        setDiscountPercent(result.discountPercent || 0);
        if (result.discountPercent === 100) {
          await handleFreeEnrollment();
        } else {
          toast.success(`Promo applied — ${result.discountPercent}% off`);
          setShowPromo(false);
        }
      } else {
        let msg = "Invalid promo code";
        if (result.error?.includes("expired")) msg = "Code expired";
        else if (result.error?.includes("max uses")) msg = "Code has reached maximum uses";
        else if (result.error?.includes("not found")) msg = "Code not found";
        else msg = result.error ?? "Invalid promo code";
        setStatusMessage(msg);
      }
    } catch {
      setStatusMessage("Error validating promo code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Free enrollment (admin / 100% promo) ──────────────────────────────────
  const handleFreeEnrollment = async () => {
    if (!course || !user) return;
    setIsLoading(true);
    try {
      const result = await enrollWithPaymentMutation.mutateAsync({
        courseId: course.courseId,
        promoCode: promoCode || undefined,
      });
      if (result.success) {
        track("provider_conversion", "free_enrollment_completed", {
          courseId: course.courseId,
          paymentMethod: promoCode ? "promo-code" : "admin-free",
        });
        setEnrollmentId(Number(result.enrollmentId || 0));
        setLaunchEnrollmentId(Number(result.learningEnrollmentId || result.enrollmentId || 0));
        setEnrollmentDate(new Date().toLocaleDateString());
        setPaymentMethod(promoCode ? "promo-code" : "admin-free");
        setAmountPaid(0);
        setStep("success");
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

  // ── M-Pesa STK Push ────────────────────────────────────────────────────────
  const handleMpesaPayment = async () => {
    if (!course || !phoneNumber || !isValidPhone) return;
    setIsLoading(true);
    setStatusMessage("");
    setInfoMessage("");
    track("payment_initiated", "micro_course_mpesa_initiated", {
      courseId: course.courseId,
      amountCents: finalPrice,
      source: "enrollment_modal",
    });
    try {
      const result = await enrollWithPaymentMutation.mutateAsync({
        courseId: course.courseId,
        phoneNumber,
        promoCode: promoCode || undefined,
      });
      if (result.success) {
        setEnrollmentId(Number(result.enrollmentId || 0));
        setLaunchEnrollmentId(Number(result.learningEnrollmentId || result.enrollmentId || 0));
        setCheckoutRequestId(result.checkoutRequestId || "");
        setPaymentMethod("m-pesa");
        setAmountPaid(finalPrice);
        // Show a toast immediately so the user knows to check their phone
        toast.success("📱 M-Pesa prompt sent!", {
          description: "Check your phone and enter your M-Pesa PIN to complete payment.",
          duration: 8000,
        });
        setStep("reconciliation");
      } else {
        track("provider_conversion", "micro_course_mpesa_initiation_failed", {
          courseId: course.courseId,
          reason: result.error || "unknown",
        });
        setStatusMessage(result.error || "Failed to initiate payment. Please try again.");
      }
    } catch (error) {
      track("provider_conversion", "micro_course_mpesa_initiation_failed", {
        courseId: course.courseId,
        reason: error instanceof Error ? error.message : "unknown_error",
      });
      setStatusMessage(error instanceof Error ? error.message : "Error initiating payment");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Manual Lipa na M-Pesa ─────────────────────────────────────────────────
  const handleManualLipaSubmission = async () => {
    if (!course) return;
    const trimmedReceipt = manualReceiptCode.trim().toUpperCase();
    const trimmedPhone = manualPayerPhone.trim();
    if (!trimmedReceipt) { setStatusMessage("Enter your M-Pesa confirmation code."); return; }
    if (!validatePhoneNumber(trimmedPhone)) { setStatusMessage("Enter payer phone in 07XXXXXXXX or 254XXXXXXXXX format."); return; }
    setIsLoading(true);
    setStatusMessage("");
    try {
      let targetEnrollmentId = enrollmentId;
      let targetLearningEnrollmentId = launchEnrollmentId;
      if (!targetEnrollmentId) {
        const enrollResult = await enrollWithPaymentMutation.mutateAsync({
          courseId: course.courseId,
          phoneNumber: trimmedPhone,
          paymentPath: "manual_lipa",
        });
        if (!enrollResult.success || !enrollResult.enrollmentId) {
          setStatusMessage(enrollResult.error || "Could not open manual payment flow.");
          return;
        }
        targetEnrollmentId = Number(enrollResult.enrollmentId);
        targetLearningEnrollmentId = Number(enrollResult.learningEnrollmentId || enrollResult.enrollmentId);
        setEnrollmentId(targetEnrollmentId);
        setLaunchEnrollmentId(targetLearningEnrollmentId);
      }
      const result = await submitManualMpesaReferenceMutation.mutateAsync({
        microEnrollmentId: targetEnrollmentId,
        receiptCode: trimmedReceipt,
        payerPhone: trimmedPhone,
      });
      setManualReceiptCode("");
      setInfoMessage(result.message);
      toast.success("Reference received. We will verify and activate your course.");
      track("provider_conversion", "manual_lipa_reference_submitted", {
        courseId: course.courseId,
        enrollmentId: targetEnrollmentId,
        learningEnrollmentId: targetLearningEnrollmentId || null,
      });
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not submit reference. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Reconciliation callbacks ───────────────────────────────────────────────
  const handlePaymentComplete = async (success: boolean) => {
    if (success) {
      track("provider_conversion", "micro_course_payment_reconciled_completed", { courseId: course?.courseId });
      setEnrollmentDate(new Date().toLocaleDateString());
      await utils.courses.getUserEnrollments.invalidate();
      setStep("success");
      onEnrollmentSuccess();
    } else {
      track("provider_conversion", "micro_course_payment_reconciled_failed", { courseId: course?.courseId });
      setStep("reconciliation");
      setStatusMessage("Payment not yet confirmed. Tap 'I Have Paid' or retry.");
    }
  };

  const handleRetryPaymentFromReconciliation = () => {
    track("provider_conversion", "micro_course_payment_retry_requested", {
      courseId: course?.courseId,
      enrollmentId,
      checkoutRequestId,
    });
    setStep("payment");
    setStatusMessage("");
    setInfoMessage("");
  };

  // ── Go to course ───────────────────────────────────────────────────────────
  const handleGoToCourse = () => {
    if (!course) return;
    const targetEnrollmentId = launchEnrollmentId || enrollmentId;
    const destination = getProviderCourseDestination(course.courseId, targetEnrollmentId || undefined);
    track("provider_conversion", "enrollment_success_primary_cta_clicked", {
      courseId: course.courseId,
      enrollmentId: targetEnrollmentId || null,
      destination,
    });
    onClose();
    window.location.href = destination;
  };

  if (!isOpen || !course) return null;

  const isAdmin = user?.role === "admin";
  const finalPrice = Math.ceil(course.price * (1 - discountPercent / 100));
  const finalPriceKES = (finalPrice / 100).toFixed(2);
  const originalPriceKES = (course.price / 100).toFixed(2);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enroll in {course.title}</DialogTitle>
          <DialogDescription>
            {step === "payment" && `KES ${finalPriceKES} · Pay with M-Pesa`}
            {step === "reconciliation" && "Waiting for M-Pesa confirmation"}
            {step === "success" && "Enrollment confirmed"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">

          {/* ── PAYMENT STEP ─────────────────────────────────────────────── */}
          {step === "payment" && (
            <div className="space-y-4">
              {/* Price summary */}
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    {discountPercent > 0 ? (
                      <>KES {finalPriceKES} <span className="line-through text-gray-400 font-normal">KES {originalPriceKES}</span></>
                    ) : (
                      <>KES {originalPriceKES}</>
                    )}
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">{course.level} · 1 month access</p>
                </div>
                {discountPercent > 0 && (
                  <span className="text-xs bg-green-100 text-green-800 font-medium px-2 py-0.5 rounded-full">
                    {discountPercent}% off
                  </span>
                )}
              </div>

              {/* Phone number input */}
              <div>
                <Label htmlFor="phone" className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> M-Pesa Phone Number
                </Label>
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="07XXXXXXXX or 254XXXXXXXXX"
                  disabled={isLoading}
                  autoFocus
                  className="mt-1"
                />
                {phoneNumber && !isValidPhone && (
                  <p className="text-xs text-red-600 mt-1">Use format 07XXXXXXXX or 254XXXXXXXXX</p>
                )}
              </div>

              {/* Primary CTA */}
              <Button
                onClick={handleMpesaPayment}
                disabled={isLoading || !isValidPhone}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending M-Pesa prompt…
                  </>
                ) : (
                  <>Pay KES {finalPriceKES} with M-Pesa</>
                )}
              </Button>

              {/* Admin free enroll */}
              {isAdmin && (
                <Button
                  onClick={handleFreeEnrollment}
                  disabled={isLoading}
                  variant="secondary"
                  className="w-full"
                >
                  {isLoading ? "Enrolling…" : "Enroll (Admin — Free)"}
                </Button>
              )}

              {/* Promo code — collapsible */}
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowPromo((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <span>Have a promo code?</span>
                  {showPromo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showPromo && (
                  <div className="px-3 pb-3 space-y-2 border-t border-gray-200 pt-2">
                    <Input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="PROMO123"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={validatePromo}
                      disabled={isLoading || !promoCode}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      {isLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                      Apply Code
                    </Button>
                  </div>
                )}
              </div>

              {/* Manual Lipa fallback — collapsible */}
              <div className="border border-amber-200 rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowManualLipa((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-amber-800 hover:bg-amber-50 transition-colors"
                >
                  <span>Pay manually via Paybill instead</span>
                  {showManualLipa ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showManualLipa && (
                  <div className="px-3 pb-3 space-y-2 border-t border-amber-200 pt-2 bg-amber-50">
                    <p className="text-xs text-amber-900">
                      Paybill: <span className="font-semibold">{payCaps?.paybillNumber || "4034223"}</span>
                      {" · "}Account: <span className="font-semibold">{payCaps?.accountNumber || `E${enrollmentId || "NEW"}`}</span>
                    </p>
                    <div className="space-y-1">
                      <Label htmlFor="manual-payer-phone" className="text-xs">Payer Phone</Label>
                      <Input
                        id="manual-payer-phone"
                        value={manualPayerPhone}
                        onChange={(e) => setManualPayerPhone(e.target.value)}
                        placeholder="07XXXXXXXX"
                        disabled={isLoading}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="manual-receipt" className="text-xs">M-Pesa Reference Code</Label>
                      <Input
                        id="manual-receipt"
                        value={manualReceiptCode}
                        onChange={(e) => setManualReceiptCode(e.target.value.toUpperCase())}
                        placeholder="e.g. TFG7H2K9M"
                        disabled={isLoading}
                        className="text-sm"
                      />
                    </div>
                    <Button
                      onClick={handleManualLipaSubmission}
                      variant="outline"
                      className="w-full"
                      size="sm"
                      disabled={isLoading || !manualReceiptCode.trim() || !manualPayerPhone.trim()}
                    >
                      Submit Reference
                    </Button>
                  </div>
                )}
              </div>

              <Button onClick={onClose} variant="ghost" className="w-full text-sm" disabled={isLoading}>
                Cancel
              </Button>
            </div>
          )}

          {/* ── RECONCILIATION STEP ──────────────────────────────────────── */}
          {step === "reconciliation" && (
            <div className="space-y-3">
              {/* Immediate confirmation banner */}
              <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-start gap-2">
                <Phone className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">M-Pesa prompt sent to your phone</p>
                  <p className="text-xs text-green-700 mt-0.5">Enter your M-Pesa PIN to complete payment. This page will update automatically.</p>
                </div>
              </div>
              <MpesaReconciliationStatus
                enrollmentId={enrollmentId}
                checkoutRequestId={checkoutRequestId}
                phoneNumber={phoneNumber}
                amount={amountPaid}
                onPaymentComplete={handlePaymentComplete}
                onRetryPayment={handleRetryPaymentFromReconciliation}
              />
            </div>
          )}

          {/* ── SUCCESS STEP ─────────────────────────────────────────────── */}
          {step === "success" && (
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-lg">Enrollment Confirmed!</p>
              </div>
              <div className="bg-green-50 p-4 rounded-md border border-green-200 space-y-1.5 text-xs text-gray-700">
                <p><span className="font-medium">Course:</span> {course.title}</p>
                <p><span className="font-medium">Date:</span> {enrollmentDate}</p>
                <p><span className="font-medium">Payment:</span> {paymentMethod === "m-pesa" ? "M-Pesa" : paymentMethod === "admin-free" ? "Admin Free" : "Promo Code"}</p>
                {amountPaid > 0 && <p><span className="font-medium">Amount:</span> KES {(amountPaid / 100).toFixed(2)}</p>}
                {enrollmentId > 0 && <p><span className="font-medium">Enrollment ID:</span> {enrollmentId}</p>}
              </div>
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200 text-xs text-gray-700">
                <p><span className="font-medium">Access:</span> 1 month from today</p>
                <p className="mt-0.5"><span className="font-medium">Duration:</span> Estimated 2–4 hours</p>
              </div>
              <div className="space-y-2">
                <Button onClick={handleGoToCourse} className="w-full bg-green-600 hover:bg-green-700">
                  Start Learning Now
                </Button>
                <Button onClick={onClose} variant="outline" className="w-full">
                  Close
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center">Certificate issued after course completion</p>
            </div>
          )}

          {/* ── Status / Info messages ────────────────────────────────────── */}
          {statusMessage && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-md border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{statusMessage}</p>
            </div>
          )}
          {infoMessage && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-md border border-blue-200">
              <Info className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700">{infoMessage}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
