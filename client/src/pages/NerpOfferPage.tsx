import { Link } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { NERP_PATHWAY_ENTRY_PATH } from "@shared/nerp-pathway";
import { ProgramJourneyCard } from "@/components/ProgramJourneyCard";

export default function NerpOfferPage() {
  const { user, loading } = useAuth();
  const eligibility = trpc.nerp.getEligibility.useQuery(undefined, { enabled: !!user, retry: false });
  const enrollment = trpc.nerp.getMyEnrollment.useQuery(undefined, {
    enabled: Boolean(user && eligibility.data?.eligible === true),
    retry: false,
  });
  const { data: journey } = trpc.nerp.getJourneyStatus.useQuery(undefined, {
    enabled: Boolean(user),
    retry: false,
  });
  const canStart = eligibility.data?.eligible === true;
  const paymentComplete = enrollment.data?.paymentState?.status === "completed";
  const paymentConfirmed = Boolean(
    enrollment.data?.paymentState &&
      (paymentComplete || enrollment.data.paymentState.amountPaidKes > 0)
  );
  const verificationPending = eligibility.data?.state === "pending_review";
  const nextHref = !user
    ? `/login?redirect=${encodeURIComponent(NERP_PATHWAY_ENTRY_PATH)}`
    : canStart
      ? paymentConfirmed
        ? NERP_PATHWAY_ENTRY_PATH
        : "/programs/nerp-acls/enroll"
      : verificationPending
        ? NERP_PATHWAY_ENTRY_PATH
        : "/provider-profile";

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-10 md:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-3xl border border-brand-orange/20 bg-gradient-to-br from-brand-surface via-background to-orange-50/40 p-6 shadow-sm md:p-10">
          <div className="max-w-3xl space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
              Paeds Resus learning pathway
            </p>
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              A guided path from BLS to ACLS readiness
            </h1>
            <p className="text-lg leading-8 text-muted-foreground">
              Complete the NERP pathway through six manageable monthly payments.
              Start with BLS cognitive learning when it is incomplete, then
              continue to the ACLS cognitive pathway.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="cta" size="lg" disabled={loading || (!!user && (eligibility.isLoading || enrollment.isLoading))}>
                <Link href={nextHref}>
                  {!user
                    ? "Sign in to continue"
                    : !canStart
                      ? verificationPending
                        ? "View verification status"
                        : "Complete professional credentials"
                      : paymentConfirmed
                        ? "Continue to learning"
                        : "Make your first NERP payment"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" disabled={loading || (!!user && (eligibility.isLoading || enrollment.isLoading))}>
                <Link href={nextHref}>
                  {paymentConfirmed ? "Check your next learning step" : "View first payment and learning steps"}
                </Link>
              </Button>
              {user && eligibility.data && !eligibility.data.eligible && (
                <p className="max-w-xl text-sm text-muted-foreground">
                  {"NERP is for nurses with a complete Nursing Council of Kenya licence submission. Submit the licence number and evidence in Professional Credentials before starting."}
                  {" "}<Link href="/provider-profile" className="font-medium text-primary underline">Open professional credentials</Link>
                </p>
              )}
              {user && verificationPending && (
                <p className="max-w-xl text-sm text-muted-foreground">
                  Your NCK evidence is under review. You may start the NERP payment now; after the first confirmed KES 2,500 instalment, BLS cognitive coursework becomes available. If the submission is rejected or revoked, access pauses and the specific reason will be shown for correction.
                  {" "}<Link href={NERP_PATHWAY_ENTRY_PATH} className="font-medium text-primary underline">View NERP next step</Link>
                </p>
              )}
              {user && eligibility.data?.eligible && enrollment.data?.offer && !paymentConfirmed && (
                <p className="max-w-xl text-sm text-muted-foreground">
                  Your NERP offer is ready. Make the first KES 2,500 instalment to unlock the linked BLS-first learning path.
                </p>
              )}
              {user && eligibility.data?.eligible && enrollment.data?.offer && paymentConfirmed && !paymentComplete && (
                <p className="max-w-xl text-sm text-muted-foreground">
                  Your first NERP payment is confirmed. Continue to BLS cognitive learning now; the next KES 2,500 instalment remains available in your payment ledger.
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Need clarification? Call <a href="tel:0706781260" className="font-medium text-primary underline">0706781260</a> or email <a href="mailto:paedsresus254@gmail.com" className="font-medium text-primary underline">paedsresus254@gmail.com</a>.
              </p>
            </div>
          </div>
        </section>

        {journey ? (
          <ProgramJourneyCard title={journey.programName} subtitle="Programme progress is an orientation aid, not a clinical competence score." percentComplete={journey.percentComplete} phases={journey.phases} nextAction={journey.nextAction} />
        ) : null}

        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CreditCard className="h-6 w-6 text-brand-orange" />
              <CardTitle className="text-lg">Lipa Mdogo Mdogo</CardTitle>
              <CardDescription>Simple monthly payments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                KES 2,500
                <span className="text-base font-normal text-muted-foreground">
                  {" "}
                  / month
                </span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Six payments · KES 15,000 total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <CardTitle className="text-lg">Two linked courses</CardTitle>
              <CardDescription>
                One pathway, existing course records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong className="text-foreground">BLS cognitive first</strong> when your linked record is incomplete.</p>
                <p><strong className="text-foreground">ACLS cognitive next</strong> after the BLS prerequisite is complete.</p>
                <Link className="inline-block text-primary hover:underline" href={NERP_PATHWAY_ENTRY_PATH}>
                  Open the guided pathway entry
                </Link>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <ShieldCheck className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-lg">Clear requirements</CardTitle>
              <CardDescription>No promise without completion</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Certification is subject to completion of the programme’s
                required cognitive, assessment, and skills requirements.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>What is included</CardTitle>
            <CardDescription>
              The offer links into the existing learning experience rather than
              creating duplicate course content.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            {[
              "BLS cognitive prerequisite checked before ACLS access",
              "Access to the AHA ACLS cognitive pathway after BLS completion",
              "Six-month KES 2,500 payment plan",
              "Payment progress and remaining balance in one ledger",
              "Free Paeds Resus BLS Certificate on completion of its requirements",
              "Clear next steps for any practical or skills requirements",
            ].map(item => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
