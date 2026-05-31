import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useProviderConversionAnalytics } from "@/hooks/useProviderConversionAnalytics";
import { getProviderCourseDestination } from "@/lib/providerCourseRoutes";
import { cn } from "@/lib/utils";
import { microCourseTrackLabel, type MicroCourseTier } from "@shared/micro-course-display";

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
  const { track } = useProviderConversionAnalytics("/fellowship/enrollment-modal");

  // Steps: "confirm" (default) | "success"
  const [step, setStep] = useState<"confirm" | "success">("confirm");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<number>(0);
  const [launchEnrollmentId, setLaunchEnrollmentId] = useState<number>(0);
  const [enrollmentDate, setEnrollmentDate] = useState<string>("");

  const enrollWithPaymentMutation = trpc.enrollment.enrollWithPayment.useMutation();

  // Reset state when modal opens
  useEffect(() => {
    if (!isOpen || !course) return;
    setStep("confirm");
    setStatusMessage("");
    setEnrollmentId(0);
    setLaunchEnrollmentId(0);

    track("enrollment_started", "micro_course_enrollment_modal_opened", {
      courseId: course.courseId,
      courseTitle: course.title,
      source: "fellowship_dashboard",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, course?.courseId]);

  // ── Enroll immediately (free) ──────────────────────────────────────────────
  const handleEnroll = async () => {
    if (!course || !user) return;
    setIsLoading(true);
    setStatusMessage("");
    try {
      const result = await enrollWithPaymentMutation.mutateAsync({
        courseId: course.courseId,
      });
      if (result.success) {
        track("provider_conversion", "free_enrollment_completed", {
          courseId: course.courseId,
          paymentMethod: "admin-free",
        });
        setEnrollmentId(Number(result.enrollmentId || 0));
        setLaunchEnrollmentId(Number(result.learningEnrollmentId || result.enrollmentId || 0));
        setEnrollmentDate(new Date().toLocaleDateString());
        setStep("success");
        await utils.courses.getUserEnrollments.invalidate();
        onEnrollmentSuccess();
      } else {
        setStatusMessage(result.error || "Enrollment failed. Please try again.");
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Error during enrollment");
    } finally {
      setIsLoading(false);
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Enroll in {course.title}</DialogTitle>
          <DialogDescription>
            {step === "confirm" && "Free enrollment — get instant access"}
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
                  {microCourseTrackLabel(course.level as MicroCourseTier)} · 1 month access
                </p>
              </div>

              <div className={cn(panelSuccess, "flex items-start gap-2")}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-700 dark:text-green-300" />
                <p className="text-foreground">
                  <span className="font-semibold">Free access</span>
                  {" — "}
                  no payment required. Click below to enroll instantly.
                </p>
              </div>

              <Button
                onClick={handleEnroll}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enrolling…
                  </>
                ) : (
                  "Enroll Now — Free"
                )}
              </Button>

              <Button onClick={onClose} variant="ghost" className="w-full text-sm" disabled={isLoading}>
                Cancel
              </Button>
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
                <p className="text-lg font-semibold text-foreground">Enrollment Confirmed!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You now have access to this micro-course.
                </p>
              </div>

              <div className={cn(panelSuccess, "space-y-1.5")} data-testid="enrollment-receipt">
                <p>
                  <span className="font-semibold text-foreground">Course:</span>{" "}
                  <span className="text-foreground">{course.title}</span>
                </p>
                <p>
                  <span className="font-semibold text-foreground">Date:</span>{" "}
                  <span className="text-foreground">{enrollmentDate}</span>
                </p>
                <p>
                  <span className="font-semibold text-foreground">Access:</span>{" "}
                  <span className="text-foreground">Free</span>
                </p>
                {enrollmentId > 0 && (
                  <p>
                    <span className="font-semibold text-foreground">Enrollment ID:</span>{" "}
                    <span className="font-mono text-foreground">{enrollmentId}</span>
                  </p>
                )}
              </div>

              <div className={panelMuted}>
                <p>
                  <span className="font-semibold text-foreground">Access period:</span>{" "}
                  <span className="text-foreground">1 month from today</span>
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-foreground">Duration:</span>{" "}
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
