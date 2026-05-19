import { useEffect, useState } from "react";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useAuth } from "@/_core/hooks/useAuth";
import { useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, Shield, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { getIndividualCoursesByTrack } from "@/const/pricing";

export default function Enroll() {
  useScrollToTop();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const requestedCourseId = new URLSearchParams(search).get("courseId");
  const [step, setStep] = useState<"course-select" | "checkout" | "success">(
    requestedCourseId ? "checkout" : "course-select"
  );
  const [selectedCourse, setSelectedCourse] = useState<string | null>(requestedCourseId);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const createEnrollment = trpc.enrollment.create.useMutation({
    onSuccess: () => {
      setStep("success");
      setTimeout(() => setLocation("/home"), 3000);
    },
    onError: (error) => {
      alert(`Enrollment failed: ${error.message}`);
    },
  });

  const ahaCourses = getIndividualCoursesByTrack("aha_certification");
  const paedsResusCourses = getIndividualCoursesByTrack("paeds_resus");
  const enrollableCourses = [...ahaCourses, ...paedsResusCourses];
  const courses = enrollableCourses.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    price: c.price,
    duration: c.duration ?? "",
    features:
      c.id === "instructor"
        ? ["Instructor certificate path", "Teaching assignment eligibility after approval"]
        : ["Official certificate upon completion", "Learning dashboard access after payment"],
    popular: c.providerTrack === "aha_certification",
    track: c.providerTrack,
  }));
  const ahaEnrollOptions = courses.filter((course) => course.track === "aha_certification");
  const paedsResusEnrollOptions = courses.filter((course) => course.track === "paeds_resus");

  useEffect(() => {
    if (!selectedCourse) return;
    const isKnown = courses.some((c) => c.id === selectedCourse);
    if (!isKnown) {
      setSelectedCourse(null);
      setStep("course-select");
    }
  }, [selectedCourse, courses]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-surface to-background flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-lg border-border">
          <CardHeader className="bg-muted/50 border-b border-border">
            <CardTitle className="text-foreground">Sign In to Enroll</CardTitle>
              <CardDescription>Provider enrollment for AHA certification and Paeds Resus pathways</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground/90">Choose AHA certification or Paeds Resus instructor path</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground/90">Pay securely and start learning immediately</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground/90">Certificate available after completion requirements</span>
              </div>
            </div>
            <a href={getLoginUrl()}>
              <Button variant="cta" className="w-full h-12 text-base">
                Sign In to Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <p className="text-xs text-muted-foreground text-center mt-4">Quick sign-in to continue enrollment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Course Selection
  if (step === "course-select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-surface to-background py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Choose your provider path
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AHA certification (BLS, ACLS, PALS) and Paeds Resus instructor training are separate paths. Fellowship micro-courses are started in Fellowship.
            </p>
          </div>

          <div className="space-y-10">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-2">AHA certification</h2>
              <p className="text-sm text-muted-foreground mb-5">Choose BLS, ACLS, or PALS.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ahaEnrollOptions.map((course) => (
                  <div
                    id={course.id === "pals" ? "course-pals" : undefined}
                    key={course.id}
                    className={`relative transition-all cursor-pointer ${
                      selectedCourse === course.id
                        ? "ring-2 ring-primary scale-[1.02]"
                        : "hover:shadow-lg"
                    }`}
                    onClick={() => {
                      setSelectedCourse(course.id);
                      setStep("checkout");
                    }}
                  >
                    <Card
                      className={`h-full border-border ${course.popular ? "border-2 border-primary shadow-md" : "shadow-sm"}`}
                    >
                      <CardHeader className={course.popular ? "bg-muted/60" : ""}>
                        <CardTitle className="text-xl text-card-foreground leading-snug">{course.name}</CardTitle>
                        <CardDescription className="text-muted-foreground">{course.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <div className="text-4xl font-bold text-brand-orange tabular-nums">
                            KES {course.price.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                            <Clock className="w-4 h-4 shrink-0" />
                            {course.duration}
                          </div>
                        </div>
                        <ul className="space-y-3">
                          {course.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-foreground/90">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          variant={course.popular ? "cta" : "secondary"}
                          className={`w-full h-12 text-base ${course.popular ? "" : "text-foreground"}`}
                          onClick={() => {
                            setSelectedCourse(course.id);
                            setStep("checkout");
                          }}
                        >
                          Start enrollment <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-2">Paeds Resus pathways</h2>
              <p className="text-sm text-muted-foreground mb-5">Instructor training and Fellowship options.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {paedsResusEnrollOptions.map((course) => (
                  <div
                    id={course.id === "instructor" ? "course-instructor" : undefined}
                    key={course.id}
                    className={`relative transition-all cursor-pointer ${
                      selectedCourse === course.id
                        ? "ring-2 ring-primary scale-[1.02]"
                        : "hover:shadow-lg"
                    }`}
                    onClick={() => {
                      setSelectedCourse(course.id);
                      setStep("checkout");
                    }}
                  >
                    <Card className="h-full border-border shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-xl text-card-foreground leading-snug">{course.name}</CardTitle>
                        <CardDescription className="text-muted-foreground">{course.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <div className="text-4xl font-bold text-brand-orange tabular-nums">
                            KES {course.price.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                            <Clock className="w-4 h-4 shrink-0" />
                            {course.duration}
                          </div>
                        </div>
                        <ul className="space-y-3">
                          {course.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-sm text-foreground/90">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button
                          variant="secondary"
                          className="w-full h-12 text-base text-foreground"
                          onClick={() => {
                            setSelectedCourse(course.id);
                            setStep("checkout");
                          }}
                        >
                          Start enrollment <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              <div
                className="relative transition-all hover:shadow-lg"
              >
                <Card className="h-full border-border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl text-card-foreground leading-snug">Paeds Resus Fellowship</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Fellowship includes micro-courses, ResusGPS, and Care Signal in one journey.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground/90">Micro-courses with direct enroll and payment</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground/90">ResusGPS access extension on course completion</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground/90">Care Signal progress integrated in Fellowship dashboard</span>
                      </li>
                    </ul>
                    <Button
                      variant="outline"
                      className="w-full h-12 text-base"
                      onClick={() => setLocation("/fellowship")}
                    >
                      Open Fellowship <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Checkout
  if (step === "checkout" && selectedCourse) {
    const course = courses.find((c) => c.id === selectedCourse);
    if (!course) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-surface to-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-8 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setStep("course-select")}
              className="text-primary hover:underline font-medium flex items-center gap-2"
            >
              ← Back
            </button>
            <div className="flex-1 text-right text-sm text-muted-foreground">
              Step 2 of 2 — Free enrollment
            </div>
          </div>

          {/* Order Summary */}
          <Card className="mb-6 border-2 border-primary/25 bg-muted/40">
            <CardHeader>
              <CardTitle className="text-foreground">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between gap-4">
                  <span className="text-foreground/90">{course.name}</span>
                  <span className="font-semibold text-foreground tabular-nums">
                    KES {course.price.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-brand-orange tabular-nums">
                    KES {course.price.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Form */}
          <Card>
            <CardHeader>
              <CardTitle>Confirm your enrollment</CardTitle>
              <CardDescription>
                Confirm your{" "}
                {selectedCourse === "instructor" ? "Paeds Resus instructor enrollment" : "AHA certification enrollment"}{" "}
                and get instant access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!agreeToTerms) {
                    alert("Please agree to terms and conditions");
                    return;
                  }
                  const programType = selectedCourse as "bls" | "acls" | "pals" | "instructor";
                  const payload: {
                    programType: typeof programType;
                    trainingDate: Date;
                    pricingSku?: "pals";
                  } = {
                    programType,
                    trainingDate: new Date(),
                  };
                  if (programType === "pals") {
                    payload.pricingSku = "pals";
                  }
                  createEnrollment.mutate(payload);
                }}
                className="space-y-6"
              >
                {/* Terms */}
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="w-5 h-5 mt-0.5"
                    />
                    <span className="text-sm text-foreground/90">
                      I agree to the{" "}
                      <a href="/terms" className="text-primary font-medium hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="/privacy" className="text-primary font-medium hover:underline">
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="cta"
                  disabled={createEnrollment.isPending || !agreeToTerms}
                  className="w-full h-12 text-base"
                >
                  {createEnrollment.isPending ? "Enrolling..." : "Enroll Now — Free"}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4" />
                  Free enrollment — no payment required
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 3: Success
  if (step === "success") {
    const course = courses.find((c) => c.id === selectedCourse);
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-surface to-background flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-lg border-2 border-primary/30">
          <CardContent className="pt-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Enrollment Successful!
              </h2>
              <p className="text-muted-foreground mb-6">
                You're now enrolled in <strong className="text-foreground">{course?.name}</strong>
              </p>

              {/* Next Steps */}
              <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6 space-y-3 text-left">
                <p className="text-sm font-semibold text-foreground">What happens next:</p>
                <ul className="space-y-2 text-sm text-foreground/90">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-orange font-bold">1.</span>
                    <span>Check your email for course access details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-orange font-bold">2.</span>
                    <span>Start learning immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-orange font-bold">3.</span>
                    <span>Get your certificate upon completion</span>
                  </li>
                </ul>
              </div>

              <p className="text-xs text-muted-foreground mb-4">
                Redirecting to your dashboard in 3 seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
