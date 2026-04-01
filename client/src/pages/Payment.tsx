import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
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
import { individualCourses, fellowshipTiers } from "@/const/pricing";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Payment() {
  useScrollToTop();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const urlEnrollmentId = params.get("enrollmentId");
  const urlCourseId = params.get("courseId");
  const parsedEnroll = urlEnrollmentId ? parseInt(urlEnrollmentId, 10) : NaN;
  const enrollmentIdFromEnroll = Number.isFinite(parsedEnroll) ? parsedEnroll : undefined;

  const [selectedCourse, setSelectedCourse] = useState<string | null>(urlCourseId || null);
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "bank" | "card">("mpesa");

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
    },
    onError: (e) => toast.error(e.message || "Could not record payment"),
  });

  const lockCourseSelection = Boolean(enrollmentIdFromEnroll && enrollmentRow);

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
        const tier =
          urlCourseId && ["bronze", "silver", "gold"].includes(urlCourseId) ? urlCourseId : "bronze";
        setSelectedCourse(tier);
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
    (enrollmentRow.programType === "fellowship"
      ? !["bronze", "silver", "gold"].includes(urlCourseId)
      : urlCourseId !== enrollmentRow.programType);

  const enrollmentMissing =
    enrollmentIdFromEnroll !== undefined && enrollmentFetched && !enrollmentLoading && !enrollmentRow;

  /** Only attach M-Pesa to an enrollment after the server confirms it belongs to this user. */
  const mpesaEnrollmentId =
    enrollmentIdFromEnroll !== undefined && enrollmentRow ? enrollmentIdFromEnroll : undefined;

  const courseIcons: Record<string, string> = { bls: "🏥", acls: "❤️", pals: "👶", bronze: "🥉", silver: "🥈", gold: "🥇" };
  const fellowshipDurations: Record<string, string> = { bronze: "6 weeks", silver: "12 weeks", gold: "16 weeks" };
  const courses = [
    ...individualCourses.map((c) => ({
      id: c.id,
      name: `${c.name} Certification`,
      description: c.description,
      price: c.price,
      duration: c.duration ?? "",
      icon: courseIcons[c.id] ?? "📋",
    })),
    ...fellowshipTiers.map((t, i) => ({
      id: ["bronze", "silver", "gold"][i] as string,
      name: t.name.split(" ")[0] + " Fellowship",
      description: t.description,
      price: t.price,
      duration: fellowshipDurations[["bronze", "silver", "gold"][i]] ?? "",
      icon: courseIcons[["bronze", "silver", "gold"][i]] ?? "📋",
    })),
  ];

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);

  const mpesaSelectable = payCaps?.stkPushOffered ?? true;

  const paymentMethods = useMemo(
    () => [
      {
        id: "mpesa" as const,
        name: "M-Pesa",
        description: mpesaSelectable
          ? "Instant mobile money payment"
          : "Unavailable — use bank transfer or contact support",
        icon: Smartphone,
        available: mpesaSelectable,
      },
      {
        id: "bank" as const,
        name: "Bank Transfer",
        description: "Direct bank transfer — recommended when mobile money is paused",
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
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Secure Payment</h1>
          <p className="text-xl text-white/90">
            Choose your course and complete payment to start your training journey
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-6">
        {enrollmentIdFromEnroll !== undefined && enrollmentLoading && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertTitle>Loading your enrollment</AlertTitle>
            <AlertDescription>Checking enrollment #{enrollmentIdFromEnroll}…</AlertDescription>
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
          </Alert>
        )}
        {lockCourseSelection && enrollmentRow && (
          <Alert className="border-primary/30 bg-muted/50">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertTitle className="text-foreground">Completing enrollment #{enrollmentRow.id}</AlertTitle>
            <AlertDescription className="text-foreground/90">
              Course selection is locked to match your enrollment so payment applies to the same record.
            </AlertDescription>
          </Alert>
        )}
        {urlCourseMismatch && enrollmentRow && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Course adjusted</AlertTitle>
            <AlertDescription>
              The selected course was aligned with your enrollment (
              {enrollmentRow.programType === "fellowship" ? "fellowship tier" : enrollmentRow.programType.toUpperCase()}
              ).
            </AlertDescription>
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
            <h2 className="text-2xl font-bold text-foreground mb-6">Select Your Course</h2>
            <div className="space-y-3">
              {courses.map((course) => (
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
                      if (selectedCourseData.id === "pals" && mpesaEnrollmentId) {
                        window.location.href = `/course/seriously-ill-child?enrollmentId=${mpesaEnrollmentId}`;
                        return;
                      }
                      window.location.href = "/learner-dashboard";
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
                      <Button className="w-full" variant="outline">
                        Copy Details
                      </Button>
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

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <CheckCircle2 className="w-8 h-8 text-green-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Secure Payment</h3>
              <p className="text-sm text-slate-600">
                All transactions are encrypted and secure
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Clock className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Instant Confirmation</h3>
              <p className="text-sm text-slate-600">
                Receive confirmation immediately after payment
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <AlertCircle className="w-8 h-8 text-orange-600 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Support Available</h3>
              <p className="text-sm text-slate-600">
                24/7 customer support for payment issues
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
