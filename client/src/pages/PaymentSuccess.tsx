/**
 * Google Ads conversion thank-you page — `/payment/success`.
 * Shown only after server confirms enrollment.paymentStatus === "completed".
 * Bank transfer: users stay on /payment until admin/webhook confirms; do not deep-link here early.
 */
import { useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useProviderConversionAnalytics } from "@/hooks/useProviderConversionAnalytics";
import { getProviderCourseDestination, isAhaProgramSlug } from "@/lib/providerCourseRoutes";
import { parsePaymentSuccessSearch } from "@shared/payment-success";

const AUTO_REDIRECT_MS = 3000;

export default function PaymentSuccess() {
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const params = parsePaymentSuccessSearch(searchString);
  const { track } = useProviderConversionAnalytics("/payment/success");
  const conversionTracked = useRef(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(AUTO_REDIRECT_MS / 1000));

  usePageMeta({
    title: "Payment successful — Paeds Resus",
    description:
      "Your course payment is confirmed. Start your Paeds Resus or AHA-aligned training from your learner dashboard.",
    path: "/payment/success",
    robots: "noindex, nofollow",
  });

  const { data, isLoading, isFetched } = trpc.enrollment.getPaymentSuccessView.useQuery(
    {
      enrollmentId: params?.enrollmentId ?? 0,
      courseId: params?.courseId,
      programType: params?.programType,
    },
    { enabled: !!params?.enrollmentId }
  );

  const courseDestination =
    data?.ok === true
      ? getProviderCourseDestination(
          data.courseId,
          data.enrollmentId,
          "/home",
          data.courseDbId ?? undefined
        )
      : "/home";

  const ahaHubHref = "/aha-courses";

  useEffect(() => {
    if (!params?.enrollmentId && isFetched) {
      setLocation("/enroll?payment=invalid");
      return;
    }
    if (isLoading || !isFetched) return;
    if (!data) return;
    if (data.ok === false) {
      const target =
        data.reason === "unpaid"
          ? `/payment?enrollmentId=${params!.enrollmentId}&payment=pending`
          : "/enroll?payment=invalid";
      setLocation(target);
    }
  }, [params, data, isLoading, isFetched, setLocation]);

  useEffect(() => {
    if (data?.ok !== true || conversionTracked.current) return;
    conversionTracked.current = true;
    track("provider_conversion", "payment_success_page_view", {
      enrollmentId: data.enrollmentId,
      courseId: data.courseId,
      programType: data.programType,
      amountPaidCents: data.amountPaidCents,
    });
  }, [data, track]);

  useEffect(() => {
    if (data?.ok !== true) return;
    const tick = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    const redirect = window.setTimeout(() => {
      track("provider_conversion", "payment_completed_redirect", {
        paymentMethod: "mpesa",
        courseId: data.courseId,
        enrollmentId: data.enrollmentId,
        source: "payment_success_auto_redirect",
      });
      setLocation(courseDestination);
    }, AUTO_REDIRECT_MS);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(redirect);
    };
  }, [data, courseDestination, setLocation, track]);

  const handleStartCourse = () => {
    if (data?.ok !== true) return;
    track("provider_conversion", "payment_completed_redirect", {
      paymentMethod: "mpesa",
      courseId: data.courseId,
      enrollmentId: data.enrollmentId,
      source: "payment_success_cta",
    });
    setLocation(courseDestination);
  };

  if (!params?.enrollmentId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-muted-foreground text-sm">
        Redirecting…
      </div>
    );
  }

  if (isLoading || !data?.ok) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Confirming your payment…</p>
      </div>
    );
  }

  const courseLabel =
    data.courseTitle ??
    (isAhaProgramSlug(data.courseId) ? data.courseId.toUpperCase() : data.courseId);

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Thank you — payment confirmed</CardTitle>
          <CardDescription>
            Your enrollment is active. You can start learning right away.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-foreground font-medium">{courseLabel}</p>
          <p className="text-sm text-muted-foreground">
            Redirecting to your course in {secondsLeft} second{secondsLeft === 1 ? "" : "s"}…
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="cta" className="w-full sm:w-auto" onClick={handleStartCourse}>
              Start course
            </Button>
            {isAhaProgramSlug(data.courseId) && (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setLocation(ahaHubHref)}
              >
                Open AHA hub
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Need help? Visit{" "}
            <a href="/help" className="text-primary underline">
              Help
            </a>{" "}
            or email payments@paeds-resus.com with your enrollment ID ({data.enrollmentId}).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
