import { useState } from "react";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Clock, Users, Award, Shield, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { individualCourses, fellowshipTiers } from "@/const/pricing";

export default function Enroll() {
  useScrollToTop();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"course-select" | "checkout" | "success">("course-select");
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    phone: user?.phone || "",
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ")[1] || "",
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const createEnrollment = trpc.enrollment.create.useMutation({
    onSuccess: (data) => {
      if (data.enrollmentId && selectedCourse) {
        setLocation(`/payment?enrollmentId=${data.enrollmentId}&courseId=${selectedCourse}`);
      } else {
        setStep("success");
        setTimeout(() => setLocation("/learner-dashboard"), 3000);
      }
    },
    onError: (error) => {
      alert(`Enrollment failed: ${error.message}`);
    },
  });

  // Single source of truth: pricing.ts (aligned with Payment page)
  const fellowshipIds = ["bronze", "silver", "gold"];
  const courses = [
    ...individualCourses.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      price: c.price,
      duration: c.duration ?? "",
      features: ["Official certificate upon completion", "Lifetime access to materials"],
      popular: c.id === "bls",
    })),
    ...fellowshipTiers.map((t, i) => ({
      id: fellowshipIds[i] as string,
      name: t.name.replace(" Paeds Resus Fellowship", ""),
      description: t.description,
      price: t.price,
      duration: "6–12 months",
      features: t.features.slice(0, 3),
      popular: false,
    })),
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-surface to-background flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md shadow-lg border-border">
          <CardHeader className="bg-muted/50 border-b border-border">
            <CardTitle className="text-foreground">Sign In to Enroll</CardTitle>
            <CardDescription>Join thousands of parents learning life-saving skills</CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground/90">Learn at your own pace</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground/90">Get certified immediately</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground/90">Access lifetime resources</span>
              </div>
            </div>
            <a href={getLoginUrl()}>
              <Button variant="cta" className="w-full h-12 text-base">
                Sign In to Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Takes less than 1 minute. No credit card required.
            </p>
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
              Choose Your Course
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              All courses include video lessons, practice, and official certification
            </p>
            <p className="text-base text-foreground/90 max-w-3xl mx-auto mt-4 leading-relaxed">
              <strong>The systematic approach to a seriously ill child</strong> (program code <span className="font-mono text-sm bg-muted px-1 rounded">pals</span>,{" "}
              <strong className="text-brand-orange">KES 100</strong>) is listed as its <strong>own card</strong> in the grid below — it is the{" "}
              <strong>third</strong> tile in the first row on desktop (after BLS and ACLS), or scroll down on mobile. You can jump to it:{" "}
              <a href="#course-pals" className="text-primary underline font-medium decoration-2 underline-offset-2">
                #course-pals
              </a>
              . After checkout, payment opens at <span className="font-mono text-sm bg-muted px-1 rounded">/payment</span> with that course.
            </p>
          </div>

          {/* Course Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {courses.map((course) => (
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
                {course.popular && (
                  <div className="absolute top-0 right-0 bg-brand-orange text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                    POPULAR
                  </div>
                )}
                <Card
                  className={`h-full border-border ${course.popular ? "border-2 border-primary shadow-md" : "shadow-sm"}`}
                >
                  <CardHeader className={course.popular ? "bg-muted/60" : ""}>
                    <CardTitle className="text-xl text-card-foreground leading-snug">{course.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Price */}
                    <div>
                      <div className="text-4xl font-bold text-brand-orange tabular-nums">
                        KES {course.price.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Clock className="w-4 h-4 shrink-0" />
                        {course.duration}
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3">
                      {course.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground/90">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Button
                      variant={course.popular ? "cta" : "secondary"}
                      className={`w-full h-12 text-base ${course.popular ? "" : "text-foreground"}`}
                      onClick={() => {
                        setSelectedCourse(course.id);
                        setStep("checkout");
                      }}
                    >
                      Enroll Now <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Trust Signals */}
          <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">10,000+ Enrolled</p>
                <p className="text-sm text-muted-foreground">Parents and caregivers trained</p>
              </div>
              <div className="text-center">
                <Award className="w-8 h-8 text-brand-orange mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">Official Certificates</p>
                <p className="text-sm text-muted-foreground">Recognized and valid</p>
              </div>
              <div className="text-center">
                <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="font-semibold text-foreground mb-1">100% Secure</p>
                <p className="text-sm text-muted-foreground">Your data is protected</p>
              </div>
            </div>
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
              Step 2 of 2
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
              <CardTitle>Complete Your Enrollment</CardTitle>
              <CardDescription>Quick checkout - takes less than 1 minute</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!agreeToTerms) {
                    alert("Please agree to terms and conditions");
                    return;
                  }
                  const programType = (["bronze", "silver", "gold"].includes(selectedCourse) ? "fellowship" : selectedCourse) as "bls" | "acls" | "pals" | "fellowship";
                  createEnrollment.mutate({
                    programType,
                    trainingDate: new Date(),
                  });
                }}
                className="space-y-6"
              >
                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+254 700 000000"
                      required
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Payment Method</h3>
                  <div className="p-4 bg-muted/50 border border-border rounded-lg">
                    <p className="text-sm text-foreground/90">
                      <strong>M-Pesa:</strong> You'll receive an STK prompt to complete payment
                    </p>
                  </div>
                </div>

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
                  {createEnrollment.isPending ? "Processing..." : "Complete Enrollment"}
                </Button>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  Secure payment powered by M-Pesa
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
