import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { getProviderCourseDestination } from "@/lib/providerCourseRoutes";
import { getNerpNextStep } from "@shared/nerp-pathway";
import { useAuth } from "@/_core/hooks/useAuth";

export default function NerpPathwayEntry() {
  const { user, loading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/login?redirect=%2Fprograms%2Fnerp-acls%2Fstart",
  });
  const pathway = trpc.nerp.getPathwayEntry.useQuery(undefined, {
    enabled: Boolean(user),
    retry: false,
  });

  if (authLoading || pathway.isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (pathway.isError || !pathway.data) {
    const verificationRequired = pathway.error?.message?.toLowerCase().includes("verified nursing council");
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle>{verificationRequired ? "NERP verification required" : "Complete your NERP setup"}</CardTitle>
            <CardDescription>
              {verificationRequired
                ? "Your payment and coursework link will appear after your NCK evidence is verified."
                : "We could not open your NERP learning path yet."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                {pathway.error?.message ??
                  "Please update your professional profile or contact Paeds Resus support, then try again."}
              </AlertDescription>
            </Alert>
            {verificationRequired ? (
              <p className="text-sm leading-6 text-muted-foreground">
                Uploading a licence is the submission step; an authorised verifier must still confirm the Nursing Council of Kenya licence and licence number before NERP enrollment and the first M-Pesa instalment can begin.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {verificationRequired ? (
                <Button asChild variant="cta">
                  <Link href="/provider-profile">Review Professional Credentials</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/programs/nerp-acls">Back to the NERP offer</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { offer, paymentState, bls, acls } = pathway.data;
  const paymentComplete = paymentState.status === "completed";
  const paymentConfirmed = paymentComplete || paymentState.amountPaidKes > 0;
  const blsComplete = bls.cognitiveModulesComplete;
  const nextStep = getNerpNextStep({
    paymentConfirmed,
    blsCognitiveComplete: blsComplete,
  });
  const nextLearningHref = blsComplete
    ? getProviderCourseDestination("acls", acls.enrollmentId)
    : getProviderCourseDestination("bls", bls.enrollmentId);
  const nextLearningLabel = nextStep === "acls_cognitive"
    ? "Continue to ACLS cognitive learning"
    : "Start BLS cognitive learning";

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
            NERP learning pathway
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Your next step: BLS first, then ACLS
          </h1>
          <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
            Paeds Resus checks your linked learning records and sends you to the
            correct next step. Complete BLS cognitive learning before starting
            the ACLS cognitive pathway.
          </p>
        </div>

        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
          <LockKeyhole className="h-4 w-4 text-blue-700" />
          <AlertDescription className="text-blue-950 dark:text-blue-100">
            Your professional licence must be verified before NERP enrollment.
            Payment and certification remain subject to the programme rules and
            instructor requirements.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>One linked pathway</CardTitle>
                <CardDescription>
                  BLS cognitive prerequisite → ACLS cognitive learning → required
                  practical and certification steps.
                </CardDescription>
              </div>
              <Badge variant={paymentConfirmed ? "default" : "outline"}>
                {paymentComplete
                  ? "Payment complete"
                  : paymentConfirmed
                    ? "First payment confirmed"
                    : "First payment required"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  {blsComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : null}
                  <p className="font-semibold">1. Paeds Resus BLS cognitive</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {blsComplete
                    ? "Cognitive prerequisite complete."
                    : "Complete this first if it is not already complete."}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  {acls.cognitiveModulesComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : null}
                  <p className="font-semibold">2. AHA ACLS cognitive</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {acls.cognitiveModulesComplete
                    ? "Cognitive learning complete."
                    : "Available after the BLS cognitive prerequisite."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {!paymentConfirmed ? (
                <Button asChild variant="cta">
                  <Link href="/programs/nerp-acls/enroll">
                    Make your first NERP payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="cta">
                  <Link href={nextLearningHref}>
                    {nextLearningLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href="/programs/nerp-acls/enroll">
                  View linked payment and course records
                </Link>
              </Button>
            </div>

            {!paymentConfirmed ? (
              <p className="text-sm text-muted-foreground">
                Make the first KES 2,500 instalment to unlock BLS cognitive learning.
                Later instalments remain visible in your payment ledger.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Current pathway offer: {offer.offerKey}. Your confirmed first payment
                unlocks the linked BLS record; ACLS follows after BLS cognitive completion.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
