import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useProviderConversionAnalytics } from "@/hooks/useProviderConversionAnalytics";
import { getProviderCourseDestination } from "@/lib/providerCourseRoutes";

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
          <DialogTitle>Enroll in {course.title}</DialogTitle>
          <DialogDescription>
            {step === "confirm" && "Free enrollment — get instant access"}
            {step === "success" && "Enrollment confirmed"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">

          {/* ── CONFIRM STEP ─────────────────────────────────────────────── */}
          {step === "confirm" && (
            <div className="space-y-4">
              {/* Course info */}
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">{course.title}</p>
                <p className="text-xs text-blue-700 mt-0.5 capitalize">{course.level} · 1 month access</p>
              </div>

              <div className="flex items-start gap-2 p-3 bg-green-50 rounded-md border border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-800">
                  <strong>Free access</strong> — no payment required. Click below to enroll instantly.
                </p>
              </div>

              <Button
                onClick={handleEnroll}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
            <div className="space-y-4">
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-lg">Enrollment Confirmed!</p>
              </div>
              <div className="bg-green-50 p-4 rounded-md border border-green-200 space-y-1.5 text-xs text-gray-700">
                <p><span className="font-medium">Course:</span> {course.title}</p>
                <p><span className="font-medium">Date:</span> {enrollmentDate}</p>
                <p><span className="font-medium">Access:</span> Free</p>
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

          {/* ── Status / Error messages ───────────────────────────────────── */}
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
