import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useProviderConversionAnalytics } from "@/hooks/useProviderConversionAnalytics";
import { getProviderCourseDestination } from "@/lib/providerCourseRoutes";
import { cn } from "@/lib/utils";
import {
  microCourseTrackLabel,
  type MicroCourseTier,
} from "@shared/micro-course-display";
import { examPolicyHref } from "@shared/exam-policy-learner-content";
import { normalizeKenyanPhoneNumber } from "@shared/kenyan-phone";
import { MpesaReconciliationStatus } from "./MpesaReconciliationStatus";

/** High-contrast panels — readable on light and dark backgrounds (no pastel-on-pastel). */
const panelClass = "rounded-lg border p-3 sm:p-4 text-sm text-foreground";
const panelMuted = cn(panelClass, "border-border bg-muted/70");
const panelSuccess = cn(
  panelClass,
  "border-green-700/25 bg-green-50 text-green-950",
  "dark:border-green-600/40 dark:bg-green-950/45 dark:text-green-50"
);
const panelInfo = cn(
  panelClass,
  "border-primary/25 bg-primary/5",
  "dark:border-primary/35 dark:bg-primary/10"
);

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
  const { track } = useProviderConversionAnalytics(
    "/fellowship/enrollment-modal"
  );

  const [step, setStep] = useState<"confirm" | "reconciling" | "success">(
    "confirm"
  );
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<number>(0);
  const [launchEnrollmentId, setLaunchEnrollmentId] = useState<number>(0);
  const [enrollmentDate, setEnrollmentDate] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [checkoutRequestId, setCheckoutRequestId] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [amountPaid, setAmountPaid] = useState<number | null>(null);
  const [retryRequested, setRetryRequested] = useState(false);
  const [previousPaymentUnconfirmed, setPreviousPaymentUnconfirmed] =
    useState(false);
  const sessionRef = useRef(0);
  const submissionRef = useRef(false);
  const latestRef = useRef({ track, utils, onEnrollmentSuccess });
  latestRef.current = { track, utils, onEnrollmentSuccess };
  const capabilitiesQuery = trpc.mpesa.getClientPaymentCapabilities.useQuery(
    undefined,
    { enabled: isOpen && Boolean(user) }
  );
  const promoQuery = trpc.enrollment.validatePromo.useQuery(
    { code: promoCode.trim(), coursePrice: course?.price ?? 0 },
    {
      enabled:
        isOpen && Boolean(user) && Boolean(course) && Boolean(promoCode.trim()),
    }
  );
  const stkOffered = capabilitiesQuery.data?.stkPushOffered === true;
  const adminFree = user?.role === "admin";
  const zeroPricePromo =
    Boolean(promoCode.trim()) &&
    promoQuery.data?.valid === true &&
    promoQuery.data.finalPrice === 0;
  const canEnroll =
    Boolean(user) && (stkOffered || adminFree || zeroPricePromo);
  const capabilityReason = !user
    ? "Sign in before starting enrollment."
    : capabilitiesQuery.data?.stkPushOffered === false
      ? capabilitiesQuery.data.userMessage ||
        "M-Pesa checkout is currently unavailable. Contact support."
      : capabilitiesQuery.isError
        ? "Unable to check payment availability. Please try again later."
        : !stkOffered
          ? "Checking payment availability…"
          : "";

  const enrollWithPaymentMutation =
    trpc.enrollment.enrollWithPayment.useMutation();

  // Every opening/course change gets a new session. Old responses must not
  // populate a different course or notify a parent after the modal closes.
  useEffect(() => {
    const session = ++sessionRef.current;
    setStep("confirm");
    setStatusMessage("");
    setEnrollmentId(0);
    setLaunchEnrollmentId(0);
    setEnrollmentDate("");
    setPhoneNumber("");
    setPromoCode("");
    setCheckoutRequestId("");
    setPaymentMessage("");
    setAmountPaid(null);
    setRetryRequested(false);
    setPreviousPaymentUnconfirmed(false);
    setIsLoading(false);

    if (isOpen && course) {
      latestRef.current.track(
        "enrollment_started",
        "micro_course_enrollment_modal_opened",
        {
          courseId: course.courseId,
          courseTitle: course.title,
          source: "fellowship_dashboard",
        }
      );
    }
    return () => {
      if (sessionRef.current === session) sessionRef.current += 1;
    };
  }, [isOpen, course?.courseId, course?.id]);

  const confirmEnrollment = () => {
    setStatusMessage("");
    setEnrollmentDate(new Date().toLocaleDateString());
    setStep("success");
    latestRef.current.onEnrollmentSuccess();
    void Promise.resolve(
      latestRef.current.utils.courses.getUserEnrollments.invalidate()
    ).catch(() => {});
  };

  // ── Start the server-priced payment flow ───────────────────────────────────
  const handleEnroll = async () => {
    if (!isOpen || !course || !user || !canEnroll || submissionRef.current)
      return;
    const code = promoCode.trim();
    const normalizedPhone = normalizeKenyanPhoneNumber(phoneNumber);
    const phoneOptional = zeroPricePromo || adminFree;
    if (
      (phoneNumber.trim() && !normalizedPhone) ||
      (!normalizedPhone && !phoneOptional)
    ) {
      setStatusMessage(
        "Enter a valid Kenyan M-Pesa mobile number, such as 0712345678 or 0112345678."
      );
      return;
    }
    const session = sessionRef.current;
    submissionRef.current = true;
    setIsLoading(true);
    setStatusMessage("");
    try {
      const result = await enrollWithPaymentMutation.mutateAsync({
        courseId: course.courseId,
        ...(normalizedPhone ? { phoneNumber: normalizedPhone } : {}),
        ...(code ? { promoCode: code } : {}),
        ...(retryRequested ? { retryStk: true } : {}),
        paymentPath: "stk_push",
      });
      if (sessionRef.current !== session) return;
      if (result.success) {
        latestRef.current.track(
          "provider_conversion",
          "paid_enrollment_started",
          {
            courseId: course.courseId,
            paymentMethod: result.paymentMethod ?? "m-pesa",
          }
        );
        setEnrollmentId(Number(result.enrollmentId || 0));
        setLaunchEnrollmentId(
          Number(result.learningEnrollmentId || result.enrollmentId || 0)
        );
        const confirmedAmount =
          typeof result.amountPaid === "number"
            ? result.amountPaid
            : result.paymentMethod === "admin-free"
              ? 0
              : null;
        setAmountPaid(confirmedAmount);
        setPreviousPaymentUnconfirmed(
          "previousPaymentUnconfirmed" in result &&
            result.previousPaymentUnconfirmed === true
        );
        setRetryRequested(false);
        if (normalizedPhone) setPhoneNumber(normalizedPhone);
        const checkoutId = result.checkoutRequestId?.trim() || "";
        setCheckoutRequestId(checkoutId);
        setPaymentMessage(result.message || "");
        const freeSuccess =
          !checkoutId &&
          (result.paymentMethod === "admin-free" || confirmedAmount === 0);
        if (
          freeSuccess ||
          ("paymentCompleted" in result && result.paymentCompleted === true)
        ) {
          confirmEnrollment();
        } else {
          setStep("reconciling");
        }
      } else {
        setStatusMessage(
          result.error || "Enrollment failed. Please try again."
        );
      }
    } catch (error) {
      if (sessionRef.current === session) {
        setStatusMessage(
          error instanceof Error ? error.message : "Error during enrollment"
        );
      }
    } finally {
      submissionRef.current = false;
      if (sessionRef.current === session) setIsLoading(false);
    }
  };

  // ── Go to course ───────────────────────────────────────────────────────────
  const handleGoToCourse = () => {
    if (!course) return;
    const targetEnrollmentId = launchEnrollmentId || enrollmentId;
    const destination = getProviderCourseDestination(
      course.courseId,
      targetEnrollmentId || undefined
    );
    track("provider_conversion", "enrollment_success_primary_cta_clicked", {
      courseId: course.courseId,
      enrollmentId: targetEnrollmentId || null,
      destination,
    });
    onClose();
    window.location.href = destination;
  };

  if (!isOpen || !course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Enroll in {course.title}
          </DialogTitle>
          <DialogDescription>
            {step === "confirm" &&
              "Start payment — access follows confirmation"}
            {step === "reconciling" && "Waiting for payment confirmation"}
            {step === "success" && "Enrollment confirmed"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ── CONFIRM STEP ─────────────────────────────────────────────── */}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className={panelInfo}>
                <p className="font-semibold text-foreground">{course.title}</p>
                <p className="mt-0.5 text-muted-foreground">
                  {microCourseTrackLabel(course.level as MicroCourseTier)} · 1
                  month access
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Part of the{" "}
                  <Link
                    href="/fellowship/about"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Paeds Resus Fellowship
                  </Link>{" "}
                  — not AHA certification.{" "}
                  <Link
                    href={examPolicyHref("fellowship")}
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Assessment policy
                  </Link>
                </p>
              </div>

              <div className={panelInfo}>
                <p className="font-semibold text-foreground">
                  KES{" "}
                  {(course.price / 100).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Payment is reconciled before course access or certificate
                  eligibility is granted.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="enrollment-mpesa-phone"
                  className="text-sm font-medium"
                >
                  M-Pesa phone number
                </label>
                <Input
                  id="enrollment-mpesa-phone"
                  value={phoneNumber}
                  onChange={event => setPhoneNumber(event.target.value)}
                  placeholder="0712345678 or 254712345678"
                  inputMode="tel"
                  autoComplete="tel"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="enrollment-promo-code"
                  className="text-sm font-medium"
                >
                  Promo or access code (optional)
                </label>
                <Input
                  id="enrollment-promo-code"
                  value={promoCode}
                  onChange={event => setPromoCode(event.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Any discount is validated and priced by the server when you
                  submit. The confirmed amount will be shown with the payment
                  request.
                </p>
                {zeroPricePromo && (
                  <p className="text-sm">
                    This code provides free access; no M-Pesa payment is
                    required.
                  </p>
                )}
                {promoCode.trim() && promoQuery.data?.valid === false && (
                  <p className="text-sm text-destructive">
                    {promoQuery.data.error || "This promo code is not valid."}
                  </p>
                )}
              </div>
              {retryRequested && (
                <p className={panelMuted}>
                  Check your M-Pesa SMS first; do not retry if payment was
                  deducted. Submitting again requests another payment and may
                  cause a second charge.
                </p>
              )}
              {capabilityReason && (
                <p className={panelMuted} role="status">
                  {capabilityReason}
                </p>
              )}

              <p className="text-center text-sm text-muted-foreground">
                <Link
                  href={examPolicyHref("fellowship")}
                  className="text-primary font-medium underline-offset-2 hover:underline"
                >
                  Read assessment policy
                </Link>{" "}
                before you enroll.
              </p>

              <Button
                onClick={handleEnroll}
                disabled={isLoading || !canEnroll}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enrolling…
                  </>
                ) : adminFree || zeroPricePromo ? (
                  "Confirm free enrollment"
                ) : (
                  "Start M-Pesa payment"
                )}
              </Button>

              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full text-sm"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          )}

          {step === "reconciling" && (
            <div
              className="space-y-4"
              data-testid="enrollment-reconciliation-step"
            >
              {paymentMessage && <p className={panelMuted}>{paymentMessage}</p>}
              {previousPaymentUnconfirmed && (
                <p className={panelMuted}>
                  A previous payment is still unconfirmed. Check your M-Pesa SMS
                  first; do not retry if payment was deducted.
                </p>
              )}
              <MpesaReconciliationStatus
                key={`${enrollmentId}:${checkoutRequestId}`}
                enrollmentId={enrollmentId}
                checkoutRequestId={checkoutRequestId}
                phoneNumber={phoneNumber}
                amount={amountPaid ?? course.price}
                onPaymentComplete={success => {
                  if (success) confirmEnrollment();
                }}
                onRetryPayment={() => {
                  setRetryRequested(true);
                  setCheckoutRequestId("");
                  setStatusMessage("");
                  setStep("confirm");
                }}
              />
            </div>
          )}

          {/* ── SUCCESS STEP ─────────────────────────────────────────────── */}
          {step === "success" && (
            <div className="space-y-4" data-testid="enrollment-success-step">
              <div className="text-center">
                <CheckCircle2
                  className="mx-auto mb-2 h-12 w-12 text-green-700 dark:text-green-400"
                  aria-hidden
                />
                <p className="text-lg font-semibold text-foreground">
                  Enrollment Confirmed!
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You now have access to this micro-course.
                </p>
              </div>

              <div
                className={cn(panelSuccess, "space-y-1.5")}
                data-testid="enrollment-receipt"
              >
                <p>
                  <span className="font-semibold text-foreground">Course:</span>{" "}
                  <span className="text-foreground">{course.title}</span>
                </p>
                <p>
                  <span className="font-semibold text-foreground">Date:</span>{" "}
                  <span className="text-foreground">{enrollmentDate}</span>
                </p>
                <p>
                  <span className="font-semibold text-foreground">Amount:</span>{" "}
                  <span className="text-foreground">
                    {amountPaid === 0
                      ? "Free"
                      : amountPaid !== null
                        ? `KES ${(amountPaid / 100).toFixed(2)}`
                        : "Payment confirmed"}
                  </span>
                </p>
                {enrollmentId > 0 && (
                  <p>
                    <span className="font-semibold text-foreground">
                      Enrollment ID:
                    </span>{" "}
                    <span className="font-mono text-foreground">
                      {enrollmentId}
                    </span>
                  </p>
                )}
              </div>

              <div className={panelMuted}>
                <p>
                  <span className="font-semibold text-foreground">
                    Access period:
                  </span>{" "}
                  <span className="text-foreground">1 month from today</span>
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-foreground">
                    Duration:
                  </span>{" "}
                  <span className="text-foreground">Estimated 2–4 hours</span>
                </p>
              </div>

              <div className="space-y-2">
                <Button onClick={handleGoToCourse} className="w-full" size="lg">
                  Start Learning Now
                </Button>
                <Button onClick={onClose} variant="outline" className="w-full">
                  Close
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Certificate issued after course completion
              </p>
            </div>
          )}

          {/* ── Status / Error messages ───────────────────────────────────── */}
          {statusMessage && (
            <div
              className={cn(
                panelClass,
                "flex items-start gap-2 border-destructive/40 bg-destructive/10 text-destructive",
                "dark:border-red-800/50 dark:bg-red-950/35 dark:text-red-200"
              )}
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p className="text-sm">{statusMessage}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
