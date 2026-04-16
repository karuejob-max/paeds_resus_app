import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MpesaPaymentForm } from "@/components/MpesaPaymentForm";
import { CheckCircle2, Clock, AlertCircle, CreditCard, Smartphone, Building2 } from "lucide-react";
import { getIndividualCoursesByTrack, individualCourses } from "@/const/pricing";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useProviderConversionAnalytics } from "@/hooks/useProviderConversionAnalytics";
import { getProviderCourseDestination } from "@/lib/providerCourseRoutes";

export default function Payment() {
  useScrollToTop();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const urlEnrollmentId = params.get("enrollmentId");
  const urlCourseId = params.get("courseId");
  const parsedEnroll = urlEnrollmentId ? parseInt(urlEnrollmentId, 10) : NaN;
  const enrollmentIdFromEnroll = Number.isFinite(parsedEnroll) ? parsedEnroll : undefined;

  const [selectedCourse, setSelectedCourse] = useState<string | null>(
    enrollmentIdFromEnroll !== undefined ? null : urlCourseId || null
  );
  const [, setLocation] = useLocation();
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "bank" | "card">("mpesa");
  const [bankIntentSaved, setBankIntentSaved] = useState(false);
  const { track } = useProviderConversionAnalytics("/payment");

  const {
    data: enrollmentRow,
    isLoading: enrollmentLoading,
    isFetched: enrollmentFetched,
    isError: enrollmentQueryError,
  } = trpc.enrollment.getById.useQuery(
    { enrollmentId: enrollmentIdFromEnroll! },
    { enabled: enrollmentIdFromEnroll !== undefined }
  );

  const { data: payCaps } = trpc.mpesa.getClientPaymentCapabilities.useQuery(undefined, {
    staleTime: 60_000,
  });

  const [bankReference, setBankReference] = useState("");

  const recordBankPayment = trpc.enrollment.recordPayment.useMutation({
    onSuccess: () => {
      toast.success(
        "Payment details saved. Our team will verify your bank transfer—check your email and learner dashboard for updates."
      );
      setBankReference("");
      setBankIntentSaved(true);
    },
    onError: (e) => toast.error(e.message || "Could not record payment"),
  });

  const lockCourseSelection = enrollmentIdFromEnroll !== undefined;

  useEffect(() => {
    if (!payCaps) return;
    if (!payCaps.stkPushOffered && paymentMethod === "mpesa") {
      setPaymentMethod("bank");
    }
  }, [payCaps, paymentMethod]);

  useEffect(() => {
    if (enrollmentIdFromEnroll !== undefined) {
      if (!enrollmentRow) return;
      const p = enrollmentRow.programType;
      if (p === "fellowship") {
        setSelectedCourse(null);
      } else {
        setSelectedCourse(p);
      }
      return;
    }
    if (urlCourseId) setSelectedCourse(urlCourseId);
  }, [enrollmentIdFromEnroll, enrollmentRow, urlCourseId]);

  const urlCourseMismatch =
    enrollmentRow &&
    urlCourseId &&
    urlCourseId !== enrollmentRow.programType;

  const enrollmentMissing =
    enrollmentIdFromEnroll !== undefined && enrollmentFetched && !enrollmentLoading && !enrollmentRow;

  /** Only attach M-Pesa to an enrollment after the server confirms it belongs to this user. */
  const mpesaEnrollmentId =
    enrollmentIdFromEnroll !== undefined && enrollmentRow ? enrollmentIdFromEnroll : undefined;

  const courseIcons: Record<string, string> = {
    bls: "🏥",
    acls: "❤️",
    pals: "👶",
    instructor: "🎓",
  };
  const selectedTrack = individualCourses.find((c) => c.id === selectedCourse)?.providerTrack;
  const availableBaseCourses = getIndividualCoursesByTrack("aha_certification");
  const availableCourses =
    selectedTrack === "paeds_resus"
      ? [...availableBaseCourses, ...getIndividualCoursesByTrack("paeds_resus")]
      : availableBaseCourses;
  const courses = availableCourses
    .map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      price: c.price,
      duration: c.duration ?? "",
      icon: courseIcons[c.id] ?? "📋",
    }));
  const selectedCourseData = courses.find((c) => c.id === selectedCourse);
  const selectedProgramType = enrollmentRow?.programType ?? selectedCourse ?? null;
  const isPaedsResusPayment = selectedProgramType === "instructor";
  const paymentPageTitle = lockCourseSelection
    ? "Complete your payment"
    : isPaedsResusPayment
      ? "Pay for Paeds Resus training"
      : "Pay for AHA certification";
  const paymentPageSubtitle = lockCourseSelection
    ? "This payment is locked to your existing enrollment."
    : isPaedsResusPayment
      ? "Complete payment for your Paeds Resus instructor pathway enrollment."
      : "Select BLS, ACLS, or PALS to create and complete enrollment payment.";
  const courseSelectTitle = lockCourseSelection
    ? "Enrollment details"
    : isPaedsResusPayment
      ? "Select Paeds Resus training"
      : "Select AHA certification";

  useEffect(() => {
    if (!selectedCourseData) return;
    track("provider_conversion", "payment_course_selected", {
      courseId: selectedCourseData.id,
      amountCents: selectedCourseData.price,
      enrollmentId: enrollmentIdFromEnroll ?? null,
    });
  }, [selectedCourseData?.id, selectedCourseData?.price, enrollmentIdFromEnroll, track]);

  useEffect(() => {
    if (!selectedCourseData) return;
    track("provider_conversion", "payment_method_selected", {
      paymentMethod,
      courseId: selectedCourseData.id,
      amountCents: selectedCourseData.price,
    });
  }, [paymentMethod, selectedCourseData?.id, selectedCourseData?.price, track]);

  const mpesaSelectable = payCaps?.stkPushOffered ?? true;

  const paymentMethods = useMemo(
    () => [
      {
        id: "mpesa" as const,
        name: "M-Pesa",
        description: mpesaSelectable
          ? "Fastest option - confirmation usually in seconds"
          : "Unavailable — use bank transfer or contact support",
        icon: Smartphone,
        available: mpesaSelectable,
      },
      {
        id: "bank" as const,
        name: "Bank Transfer",
        description: "Manual confirmation after transfer review",
        icon: Building2,
        available: true,
      },
      {
        id: "card" as const,
        name: "Card Payment",
        description: "Visa, Mastercard, American Express",
        icon: CreditCard,
        available: false,
      },
    ],
    [mpesaSelectable]
  );

  const canSubmitBankIntent = Boolean(
    enrollmentIdFromEnroll &&
      enrollmentRow &&
      selectedCourseData &&
      !recordBankPayment.isPending
  );

  const copyBankInstructions = () => {
    if (!selectedCourseData) return;
    const lines = [
      "Paeds Resus — bank transfer",
      "Bank: Equity Bank Kenya",
      "Account name: Paeds Resus",
      "Account number: 1150286006733",
      `Amount (KES): ${selectedCourseData.price.toLocaleString()}`,
      enrollmentIdFromEnroll
        ? `Reference: include enrollment #${enrollmentIdFromEnroll} in the transfer narration`
        : "Reference: use your full name + course",
      "",
      "After paying, use the button on the site to register your transfer and send proof to payments@paeds-resus.com",
    ];
    void navigator.clipboard.writeText(lines.join("\n")).then(
      () => toast.success("Bank details copied"),
      () => toast.error("Could not copy — select and copy manually")
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-surface to-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-[var(--brand-teal)] to-[#143333] text-primary-foreground py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 tracking-tight">
            {paymentPageTitle}
          </h1>
          <p className="text-xl text-white/90">
            {paymentPageSubtitle}
          </p>
          <p className="text-sm text-white/80 mt-3">
            M-Pesa is the fastest path. Most confirmations arrive within seconds after STK approval.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
        {enrollmentIdFromEnroll !== undefined && enrollmentLoading && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Loading your payment details</AlertTitle>
            <AlertDescription>Confirming the linked enrollment before payment.</AlertDescription>
          </Alert>
        )}
        {enrollmentQueryError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not verify enrollment</AlertTitle>
            <AlertDescription>Try again or start from Enroll to get a fresh payment link.</AlertDescription>
          </Alert>
        )}
        {enrollmentMissing && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Enrollment not found</AlertTitle>
            <AlertDescription>
              This link may be invalid or belong to another account. Go to Enroll to create a new enrollment.
            </AlertDescription>
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={() => setLocation("/enroll")}>
                Go to Enroll
              </Button>
            </div>
          </Alert>
        )}
        {lockCourseSelection && enrollmentRow && (
          <Alert className="border-primary/30 bg-muted/50">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertTitle className="text-foreground">This payment is locked to your enrollment</AlertTitle>
            <AlertDescription className="text-foreground/90">
              Course selection is locked so your payment is applied to the correct enrollment.
            </AlertDescription>
          </Alert>
        )}
        {urlCourseMismatch && enrollmentRow && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Course adjusted</AlertTitle>
            <AlertDescription>
              The selected course was aligned with your locked enrollment.
            </AlertDescription>
          </Alert>
        )}
        {enrollmentRow?.programType === "fellowship" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Use Fellowship checkout</AlertTitle>
            <AlertDescription>
              Fellowship micro-course payments are handled inside the Fellowship journey. Please return to the Fellowship page and retry checkout there.
            </AlertDescription>
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={() => setLocation("/fellowship")}>
                Open Fellowship
              </Button>
            </div>
          </Alert>
        )}
        {payCaps?.userMessage && (
          <Alert className="border-amber-200 bg-amber-50/90">
            <AlertCircle className="h-4 w-4 text-amber-800" />
            <AlertTitle className="text-amber-950">Payments notice</AlertTitle>
            <AlertDescription className="text-amber-900">{payCaps.userMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Course Selection */}
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {courseSelectTitle}
            </h2>
            <div className="space-y-3">
              {(lockCourseSelection ? (selectedCourseData ? [selectedCourseData] : []) : courses).map((course) => (
                <Card
                  key={course.id}
                  className={`transition-all ${
                    lockCourseSelection ? "cursor-default" : "cursor-pointer hover:shadow-lg"
                  } ${
                    selectedCourse === course.id
                      ? "ring-2 ring-primary bg-muted/60"
                      : ""
                  }`}
                  onClick={() => {
                    if (lockCourseSelection) return;
                    setSelectedCourse(course.id);
                  }}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl">{course.icon}</span>
                          <div>
                            <h3 className="font-bold text-card-foreground">{course.name}</h3>
                            <p className="text-sm text-muted-foreground">{course.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-brand-orange tabular-nums">
                          KES {course.price.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">{course.duration}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Payment Summary & Method */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCourseData ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Course</p>
                      <p className="font-bold text-foreground">{selectedCourseData.name}</p>
                    </div>
                    <div className="border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-3xl font-bold text-brand-orange tabular-nums">
                        KES {selectedCourseData.price.toLocaleString()}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Select a course to continue</p>
                )}
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            {selectedCourseData && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => method.available && setPaymentMethod(method.id)}
                          disabled={!method.available}
                          className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                            paymentMethod === method.id
                              ? "border-primary bg-muted/70"
                              : method.available
                                ? "border-border hover:border-primary/50"
                                : "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-foreground" />
                            <div>
                              <p className="font-semibold text-foreground">{method.name}</p>
                              <p className="text-xs text-muted-foreground">{method.description}</p>
                            </div>
                            {!method.available && (
                              <Badge className="ml-auto" variant="secondary">
                                {method.id === "mpesa" ? "Unavailable" : "Coming Soon"}
                              </Badge>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Payment Form */}
                {paymentMethod === "mpesa" &&
                  !enrollmentQueryError &&
                  (enrollmentIdFromEnroll === undefined || enrollmentRow) &&
                  !enrollmentMissing && (
                  <MpesaPaymentForm
                    courseId={selectedCourseData.id}
                    courseName={selectedCourseData.name}
                    amount={selectedCourseData.price}
                    enrollmentId={mpesaEnrollmentId}
                    onPaymentComplete={() => {
                      track("provider_conversion", "payment_completed_redirect", {
                        paymentMethod: "mpesa",
                        courseId: selectedCourseData.id,
                        enrollmentId: mpesaEnrollmentId ?? null,
                      });
                      window.location.href = getProviderCourseDestination(
                        selectedCourseData.id,
                        mpesaEnrollmentId
                      );
                    }}
                    onPaymentError={(message) => {
                      if (/payments server|Failed to fetch|network/i.test(message)) {
                        setPaymentMethod("bank");
                        toast.error("M-Pesa could not connect. Switched to bank transfer as a fallback.");
                      }
                    }}
                  />
                )}

                {paymentMethod === "bank" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Bank Transfer Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                        <div>
                          <p className="text-sm text-slate-600">Account Name</p>
                          <p className="font-bold text-slate-900">Paeds Resus</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Account Number</p>
                          <p className="font-bold text-slate-900">1150286006733</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Bank</p>
                          <p className="font-bold text-slate-900">Equity Bank Kenya</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Amount to Transfer</p>
                          <p className="font-bold text-blue-600 text-lg">
                            KES {selectedCourseData.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button className="w-full" variant="outline" onClick={copyBankInstructions}>
                        Copy Details
                      </Button>
                      {enrollmentIdFromEnroll && enrollmentRow && (
                        <div className="space-y-2">
                          <Label htmlFor="bank-reference">Transfer reference (optional)</Label>
                          <Input
                            id="bank-reference"
                            value={bankReference}
                            onChange={(e) => setBankReference(e.target.value)}
                            placeholder="e.g. MPE123ABC or bank receipt number"
                          />
                          <Button
                            className="w-full"
                            disabled={!canSubmitBankIntent}
                            onClick={() => {
                              if (!selectedCourseData || !enrollmentIdFromEnroll) return;
                              recordBankPayment.mutate({
                                enrollmentId: enrollmentIdFromEnroll,
                                amount: selectedCourseData.price,
                                paymentMethod: "bank_transfer",
                                transactionId: bankReference.trim() || undefined,
                              });
                            }}
                          >
                            {recordBankPayment.isPending ? "Saving..." : "I Have Paid by Bank Transfer"}
                          </Button>
                          {bankIntentSaved && (
                            <Button
                              className="w-full"
                              variant="secondary"
                              onClick={() => {
                                if (!selectedCourseData) return;
                                setLocation(
                                  getProviderCourseDestination(selectedCourseData.id, enrollmentIdFromEnroll)
                                );
                              }}
                            >
                              Continue to learning dashboard
                            </Button>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-slate-500">
                        After transfer, send proof of payment to payments@paeds-resus.com
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>

        <Alert className="mt-10 border-primary/30 bg-primary/5">
          <Clock className="h-4 w-4 text-primary" />
          <AlertTitle>Need a faster checkout?</AlertTitle>
          <AlertDescription>
            Use M-Pesa for the quickest confirmation. If you already paid and do not see an update, use the retry/check
            action in the payment status panel before switching methods.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
