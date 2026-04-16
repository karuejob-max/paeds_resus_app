import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, BookOpen, CreditCard, GraduationCap, RefreshCcw, Siren } from "lucide-react";
import { useProviderConversionAnalytics } from "@/hooks/useProviderConversionAnalytics";
import { Badge } from "@/components/ui/badge";

export default function ProviderDashboard() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const summaryQuery = trpc.dashboards.getSummary.useQuery(undefined, {
    enabled: Boolean(user),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    if (!loading && !user) setLocation("/login");
  }, [loading, user, setLocation]);
  const { track } = useProviderConversionAnalytics("/home/provider");

  if (loading || !user || summaryQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-xl mx-4">
          <CardHeader>
            <CardTitle>Loading provider home…</CardTitle>
            <CardDescription>We&apos;re checking your courses, payments, and ResusGPS access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-24 rounded-lg bg-muted animate-pulse" />
            <div className="h-11 rounded-lg bg-muted animate-pulse" />
            <div className="h-11 rounded-lg bg-muted animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Provider home is temporarily unavailable</CardTitle>
              <CardDescription>
                We couldn&apos;t load your learning and payment summary. You can retry or continue to the main provider areas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Summary unavailable</AlertTitle>
                <AlertDescription>
                  {summaryQuery.error?.message || "Please try again in a moment."}
                </AlertDescription>
              </Alert>
              <Button className="w-full justify-between" onClick={() => void summaryQuery.refetch()}>
                Retry provider home
                <RefreshCcw className="h-4 w-4" />
              </Button>
              <Button variant="secondary" className="w-full justify-between" onClick={() => setLocation("/fellowship")}>
                <span className="inline-flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Open Fellowship
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full justify-between" onClick={() => setLocation("/aha-courses")}>
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Open AHA Courses
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { primaryAction, secondaryActions, stats, resusAccess } = summaryQuery.data;

  const recommendationReason =
    primaryAction.key === "resume_payment"
      ? "This is first because you already started an AHA enrollment, and payment is the one blocker before learning can continue."
      : primaryAction.key === "start_course"
        ? "This is first because you have a paid course ready to begin, so the fastest progress is to enter learning directly."
        : primaryAction.key === "continue_learning"
          ? "This is first because you already started a course, and continuing it is the clearest path to completion."
          : primaryAction.key === "renew_resusgps"
            ? "This is first because your ResusGPS access needs renewal before you can rely on it from the provider workspace."
            : "This is first because your learning and payment items are clear, so you can go straight into bedside guidance.";

  const statusHighlights = [
    {
      key: "aha",
      label:
        stats.unpaidAhaCount > 0
          ? `${stats.unpaidAhaCount} AHA payment${stats.unpaidAhaCount === 1 ? "" : "s"} pending`
          : "No unpaid AHA enrollments",
    },
    {
      key: "ready",
      label:
        stats.paidNotStartedCount > 0
          ? `${stats.paidNotStartedCount} paid course${stats.paidNotStartedCount === 1 ? "" : "s"} ready to start`
          : "No paid courses waiting to start",
    },
    {
      key: "progress",
      label:
        stats.inProgressCount > 0
          ? `${stats.inProgressCount} course${stats.inProgressCount === 1 ? "" : "s"} in progress`
          : "No course currently in progress",
    },
    {
      key: "resus",
      label: stats.hasResusGpsAccess
        ? `ResusGPS access active${resusAccess.expiresAt ? ` until ${new Date(resusAccess.expiresAt).toLocaleDateString()}` : ""}`
        : "ResusGPS access not currently active",
    },
  ];

  const handlePrimaryAction = () => {
    if (primaryAction.key === "resume_payment") {
      track("provider_conversion", "provider_next_action_resume_payment_clicked", {
        source: "provider_home_summary",
        programType: primaryAction.programType,
        enrollmentId: primaryAction.enrollmentId,
      });
    } else if (primaryAction.key === "start_course") {
      track("provider_conversion", "provider_next_action_start_course_clicked", {
        source: "provider_home_summary",
        enrollmentId: primaryAction.enrollmentId,
        courseId: primaryAction.courseId,
        destination: primaryAction.destination,
      });
    } else if (primaryAction.key === "continue_learning") {
      track("provider_conversion", "provider_next_action_continue_learning_clicked", {
        source: "provider_home_summary",
        enrollmentId: primaryAction.enrollmentId,
        courseId: primaryAction.courseId,
        destination: primaryAction.destination,
      });
    } else if (primaryAction.key === "renew_resusgps") {
      track("provider_conversion", "provider_next_action_renew_resusgps_clicked", {
        source: "provider_home_summary",
      });
    } else {
      track("provider_conversion", "provider_next_action_open_resusgps_clicked", {
        source: "provider_home_summary",
      });
    }

    setLocation(primaryAction.destination);
  };

  const primaryIcon =
    primaryAction.key === "resume_payment" ? (
      <CreditCard className="h-4 w-4" />
    ) : primaryAction.key === "renew_resusgps" ? (
      <AlertTriangle className="h-4 w-4" />
    ) : primaryAction.key === "open_resusgps" ? (
      <Siren className="h-4 w-4" />
    ) : (
      <BookOpen className="h-4 w-4" />
    );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Provider home</CardTitle>
            <CardDescription>
              One recommended next step, plus the state behind that recommendation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {statusHighlights.map((item) => (
                <Badge key={item.key} variant="secondary" className="font-normal">
                  {item.label}
                </Badge>
              ))}
            </div>
            <Card className="border-primary/40 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base inline-flex items-center gap-2">
                  {primaryIcon}
                  {primaryAction.title}
                </CardTitle>
                <CardDescription>{primaryAction.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert>
                  <AlertTitle>Why this is your next step</AlertTitle>
                  <AlertDescription>{recommendationReason}</AlertDescription>
                </Alert>
                <Button variant="cta" className="w-full justify-between" onClick={handlePrimaryAction}>
                  {primaryAction.cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            {secondaryActions.map((action) => (
              <Button
                key={action.key}
                variant={action.key === "open_fellowship" ? "secondary" : "outline"}
                className="w-full justify-between"
                onClick={() => {
                  track(
                    "provider_conversion",
                    action.key === "open_fellowship" ? "provider_cta_open_fellowship" : "provider_cta_open_aha_hub",
                    { source: "provider_home_summary" }
                  );
                  setLocation(action.destination);
                }}
              >
                <span className="inline-flex items-center gap-2">
                  {action.key === "open_fellowship" ? (
                    <GraduationCap className="h-4 w-4" />
                  ) : (
                    <BookOpen className="h-4 w-4" />
                  )}
                  {action.label}
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
